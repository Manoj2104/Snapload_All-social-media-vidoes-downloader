from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import analyze, download, status
from services.file_service import start_cleanup_task
import os

app = FastAPI(title="SnapLoad API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    start_cleanup_task()

# API Routes - MUST be registered before static files
app.include_router(analyze.router, prefix="/api")
app.include_router(download.router, prefix="/api")
app.include_router(status.router, prefix="/api")

# Serve Frontend Static Files
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "out"))

if os.path.exists(frontend_path):
    # Mount static assets (JS, CSS, images)
    app.mount("/_next", StaticFiles(directory=os.path.join(frontend_path, "_next")), name="next-assets")
    
    # Serve all other routes as the Next.js SPA
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            return {"error": "Not found"}
        
        # Check for exact file match first
        file_path = os.path.join(frontend_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Check for .html version
        html_path = os.path.join(frontend_path, full_path, "index.html")
        if os.path.isfile(html_path):
            return FileResponse(html_path)
        
        # Default: serve index.html (SPA fallback)
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"status": "Backend running. Frontend not found at: " + frontend_path}
