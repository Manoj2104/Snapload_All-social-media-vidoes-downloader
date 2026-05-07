from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import analyze, download, status, auth
from services.file_service import start_cleanup_task
import os
import models
from database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SnapLoad API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, # Allowed for auth
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    start_cleanup_task()

# API Routes
app.include_router(analyze.router, prefix="/api")
app.include_router(download.router, prefix="/api")
app.include_router(status.router, prefix="/api")
app.include_router(auth.router, prefix="/api")

# Serve frontend static files
# We mount static directory if it exists (for Docker deployment)
if os.path.exists("static"):
    app.mount("/_next", StaticFiles(directory="static/_next"), name="next_assets")
    
    # Custom catch-all for Next.js static export
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve exact file if it exists
        static_file_path = os.path.join("static", full_path)
        if full_path and os.path.isfile(static_file_path):
            return FileResponse(static_file_path)
        
        # Fallback to index.html for SPA routing
        return FileResponse(os.path.join("static", "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"status": "SnapLoad API is running (Backend only)", "version": "1.0.0"}

@app.get("/debug-cookies")
def debug_cookies():
    import os
    return {
        "YT_COOKIES_FILE_env": os.environ.get("YT_COOKIES_FILE"),
        "YT_COOKIES_CONTENT_env": "SET" if os.environ.get("YT_COOKIES_CONTENT") else "NOT SET",
        "env_path_exists": os.path.isfile(os.environ.get("YT_COOKIES_FILE", "")),
        "downloads_dir": os.listdir("downloads") if os.path.isdir("downloads") else [],
        "cookies_exists": os.path.isfile("downloads/cookies.txt"),
        "cookies_size": os.path.getsize("downloads/cookies.txt") if os.path.isfile("downloads/cookies.txt") else 0,
        "cwd": os.getcwd(),
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
