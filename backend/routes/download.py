from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
import uuid
from services.redis_service import redis_client
from services.ytdlp_service import download_video_task
import threading
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
import models
from routes.auth import get_current_user, SECRET_KEY, ALGORITHM, check_and_reset_credits
from jose import jwt

router = APIRouter()

class DownloadRequest(BaseModel):
    url: str
    format: str # e.g. 'video' or 'audio'
    quality: str # e.g. '1080p'

async def get_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email:
            user = db.query(models.User).filter(models.User.email == email).first()
            if user:
                check_and_reset_credits(user, db)
                return user
    except:
        return None
    return None

@router.post("/download")
async def start_download(request: DownloadRequest, user: Optional[models.User] = Depends(get_user_optional), db: Session = Depends(get_db)):
    # 1. Enforce Quality Restriction
    premium_qualities = ['1080p', '4K']
    if request.quality in premium_qualities and not user:
        raise HTTPException(status_code=403, detail="Sign in to download 1080p or 4K quality")
    
    # 2. Enforce Credit Check
    if user:
        if user.credits < 50:
            raise HTTPException(status_code=403, detail="Insufficient credits. 50 credits required per download.")
        
        # Deduct credits
        user.credits -= 50
        tx = models.Transaction(user_id=user.id, amount=-50, type="download")
        db.add(tx)
        db.commit()

    try:
        job_id = str(uuid.uuid4())
        
        # Initialize job status in Redis
        redis_client.hset(f"job:{job_id}", mapping={
            "status": "processing",
            "progress": "0",
            "downloadUrl": ""
        })
        
        # Start background thread to download using yt-dlp
        thread = threading.Thread(target=download_video_task, args=(job_id, request.url, request.format, request.quality))
        thread.start()
        
        return {
            "jobId": job_id, 
            "estimatedTime": "Calculating...",
            "remainingCredits": user.credits if user else "Unlimited (Guest 720p)"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
