from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ytdlp_service import extract_metadata

router = APIRouter()

class AnalyzeRequest(BaseModel):
    url: str

@router.post("/analyze")
async def analyze_video(request: AnalyzeRequest):
    try:
        data = extract_metadata(request.url)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
