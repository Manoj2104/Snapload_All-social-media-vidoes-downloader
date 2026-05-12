from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from services.redis_service import redis_client
from services.ytdlp_service import download_video_task
import threading

router = APIRouter()

class DownloadRequest(BaseModel):
    url: str
    format: str # e.g. 'video' or 'audio'
    quality: str # e.g. '1080p'

@router.post("/download")
async def start_download(request: DownloadRequest):
    try:
        job_id = str(uuid.uuid4())
        
        # Initialize job status in Redis
        redis_client.hset(f"job:{job_id}", mapping={
            "status": "processing",
            "progress": "0",
            "downloadUrl": ""
        })
        
        # Start background thread to download using yt-dlp
        # In a fully production system, use Celery or RQ, but threading + redis works fine for this
        thread = threading.Thread(target=download_video_task, args=(job_id, request.url, request.format, request.quality))
        thread.start()
        
        return {"jobId": job_id, "estimatedTime": "Calculating..."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
