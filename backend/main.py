from fastapi import FastAPI
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

# API Routes
app.include_router(analyze.router, prefix="/api")
app.include_router(download.router, prefix="/api")
app.include_router(status.router, prefix="/api")

# Serve Frontend
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    @app.get("/")
    def read_root():
        return {"status": "Backend is running. Frontend build missing at " + frontend_path}
