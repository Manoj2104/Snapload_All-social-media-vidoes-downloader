from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import analyze, download, status
from services.file_service import start_cleanup_task

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

# API Routes only - frontend is hosted separately on Netlify
app.include_router(analyze.router, prefix="/api")
app.include_router(download.router, prefix="/api")
app.include_router(status.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "SnapLoad API is running", "version": "1.0.0"}
