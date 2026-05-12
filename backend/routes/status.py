from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from services.redis_service import redis_client

router = APIRouter()

@router.get("/status/{job_id}")
async def get_status(job_id: str):
    job_data = redis_client.hgetall(f"job:{job_id}")
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    decoded_data = {}
    for k, v in job_data.items():
        key_str = k.decode('utf-8') if isinstance(k, bytes) else str(k)
        val_str = v.decode('utf-8') if isinstance(v, bytes) else str(v)
        decoded_data[key_str] = val_str
    return decoded_data

@router.get("/download/{job_id}")
async def download_file(job_id: str):
    job_data = redis_client.hgetall(f"job:{job_id}")
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    decoded_data = {}
    for k, v in job_data.items():
        key_str = k.decode('utf-8') if isinstance(k, bytes) else str(k)
        val_str = v.decode('utf-8') if isinstance(v, bytes) else str(v)
        decoded_data[key_str] = val_str
    
    if decoded_data.get("status") != "completed":
        raise HTTPException(status_code=400, detail="File not ready")
        
    file_path = decoded_data.get("downloadUrl")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found or expired")
        
    # Send file
    return FileResponse(path=file_path, filename=os.path.basename(file_path))
