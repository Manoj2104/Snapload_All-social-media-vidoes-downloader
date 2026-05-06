import yt_dlp
import os
import re
import shutil
from services.redis_service import redis_client

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def init_cookies():
    path = os.path.join(DOWNLOAD_DIR, "cookies.txt")
    if os.path.exists(path) and os.path.getsize(path) > 100: return path
    content = os.environ.get("YT_COOKIES_CONTENT", "").strip()
    if content:
        with open(path, "w", encoding="utf-8") as f: f.write(content)
        return path
    
    env_path = os.environ.get("YT_COOKIES_FILE", "").strip()
    if env_path and os.path.isfile(env_path):
        try:
            shutil.copy2(env_path, path)
            return path
        except: pass
    return None

COOKIE_FILE = init_cookies()

def get_opts(is_yt=True, strategy="ios"):
    opts = {
        "quiet": True, "no_warnings": True, "nocheckcertificate": True,
        "force_ipv4": True, "geo_bypass": True,
        # Let yt-dlp automatically find nodejs for n-challenge solving
        "allow_unplayable_formats": True,
    }
    if is_yt:
        # Strategy rotation
        client = "ios" if strategy == "ios" else "tv_embedded" if strategy == "tv" else "android"
        opts["extractor_args"] = {"youtube": {"player_client": [client]}}
    
    if COOKIE_FILE: opts["cookiefile"] = COOKIE_FILE
    return opts

def extract_metadata(url):
    is_yt = "youtube.com" in url or "youtu.be" in url
    # We try different strategies to find the best formats
    for s in ["ios", "tv", "android"]:
        try:
            with yt_dlp.YoutubeDL(get_opts(is_yt, s)) as ydl:
                info = ydl.extract_info(url, download=False)
                formats = []
                for f in info.get("formats", []):
                    if f.get("vcodec") != "none" and f.get("height"):
                        formats.append({"format_id": f["format_id"], "resolution": f"{f['height']}p", "ext": f["ext"], "type": "video"})
                    elif f.get("acodec") != "none" and f.get("vcodec") == "none":
                        formats.append({"format_id": f["format_id"], "resolution": "audio", "ext": f["ext"], "type": "audio"})
                return {
                    "title": info.get("title"), "thumbnail": info.get("thumbnail"),
                    "duration": info.get("duration"), "channel": info.get("uploader"),
                    "formats": formats, "platform": info.get("extractor_key"),
                }
        except Exception as e:
            if s == "android": raise e

def download_video_task(job_id, url, format_type, quality):
    is_yt = "youtube.com" in url or "youtu.be" in url
    res = {"4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}.get(quality.lower(), 1080)
    
    # Robust format selection
    if format_type == "audio":
        fmt = "bestaudio/best"
    else:
        fmt = f"bestvideo[height<={res}]+bestaudio/best"
    
    for s in ["ios", "tv", "android"]:
        try:
            opts = get_opts(is_yt, s)
            opts.update({
                "format": fmt, 
                "outtmpl": os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s"), 
                "merge_output_format": "mp4"
            })
            if format_type == "audio":
                opts["postprocessors"] = [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
            
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
            
            ext_final = "mp3" if format_type == "audio" else "mp4"
            final_file = os.path.join(DOWNLOAD_DIR, f"{job_id}.{ext_final}")
            redis_client.hset(f"job:{job_id}", mapping={"status": "completed", "progress": "100", "downloadUrl": final_file})
            return
        except Exception as e:
            if s == "android":
                redis_client.hset(f"job:{job_id}", mapping={"status": "failed", "error": str(e)})