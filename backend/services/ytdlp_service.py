import yt_dlp
import os
import re
import shutil
import time
from services.redis_service import redis_client

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def init_cookies():
    writable_cookie = os.path.join(DOWNLOAD_DIR, "cookies.txt")
    if os.path.isfile(writable_cookie) and os.path.getsize(writable_cookie) > 100:
        return writable_cookie
    env_path = os.environ.get("YT_COOKIES_FILE", "").strip()
    if env_path and os.path.isfile(env_path):
        try:
            shutil.copy2(env_path, writable_cookie)
            return writable_cookie
        except: pass
    content = os.environ.get("YT_COOKIES_CONTENT", "").strip()
    if content:
        try:
            with open(writable_cookie, "w", encoding="utf-8") as f:
                f.write(content)
            return writable_cookie
        except: pass
    if os.path.isfile("cookies.txt"):
        try:
            shutil.copy2("cookies.txt", writable_cookie)
            return writable_cookie
        except: pass
    return None

COOKIE_FILE = init_cookies()
PROXY = os.environ.get("YT_PROXY", "").strip()

def get_common_opts(is_youtube=True, is_download=False):
    po_token = os.environ.get("YT_PO_TOKEN")
    visitor_data = os.environ.get("YT_VISITOR_DATA")
    opts = {
        "quiet": True, "no_warnings": True, "nocheckcertificate": True,
        "ignoreerrors": False, "geo_bypass": True, "force_ipv4": True,
        "socket_timeout": 60, "retries": 10, "fragment_retries": 10,
    }
    if is_youtube:
        # TV_EMBEDDED is currently the strongest for Render/Data centers
        yt_args = {
            "player_client": ["tv_embedded", "ios", "web_creator", "android"],
            "skip": ["hls", "dash"] if (not is_download and not po_token) else [],
        }
        if po_token: yt_args["po_token"] = [f"web+{po_token}", f"ios+{po_token}"]
        if visitor_data: yt_args["visitor_data"] = visitor_data
        opts["extractor_args"] = {"youtube": yt_args}
    if COOKIE_FILE: opts["cookiefile"] = COOKIE_FILE
    if PROXY: opts["proxy"] = PROXY
    return opts

def cleanup_downloads():
    if not os.path.exists(DOWNLOAD_DIR): return
    for name in os.listdir(DOWNLOAD_DIR):
        if name == "cookies.txt": continue
        path = os.path.join(DOWNLOAD_DIR, name)
        try:
            if os.path.isfile(path): os.remove(path)
            elif os.path.isdir(path): shutil.rmtree(path)
        except: pass

def progress_hook(job_id):
    def hook(d):
        try:
            if d["status"] == "downloading":
                p = d.get("_percent_str", "0%")
                v = float(re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", p).replace("%", "").strip())
                redis_client.hset(f"job:{job_id}", "progress", str(v))
            elif d["status"] == "finished":
                redis_client.hset(f"job:{job_id}", "progress", "99")
        except: pass
    return hook

def extract_metadata(url):
    is_youtube = "youtube.com" in url or "youtu.be" in url
    opts = get_common_opts(is_youtube, is_download=False)
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False, process=(not is_youtube))
            return {
                "title": info.get("title", "Unknown"), "thumbnail": info.get("thumbnail", ""),
                "duration": info.get("duration", 0), "channel": info.get("uploader", ""),
                "views": info.get("view_count", 0),
                "formats": [
                    {"resolution": "4K", "ext": "mp4", "type": "video"},
                    {"resolution": "1080p", "ext": "mp4", "type": "video"},
                    {"resolution": "720p", "ext": "mp4", "type": "video"},
                    {"resolution": "480p", "ext": "mp4", "type": "video"},
                    {"resolution": "audio", "ext": "mp3", "type": "audio"},
                ],
            }
    except Exception as e:
        raise Exception(re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e)))

def download_video_task(job_id, url, format_type, quality):
    cleanup_downloads()
    outtmpl = os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s")
    res = {"4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}.get(quality.lower(), 720)
    
    # Resilient format selector: try progressive formats first if DASH is blocked
    if format_type == "audio":
        fmt = "bestaudio/best"
    else:
        fmt = f"best[height<={res}][ext=mp4]/bestvideo[height<={res}]+bestaudio/best[height<={res}]/best"
    
    is_youtube = "youtube.com" in url or "youtu.be" in url
    strategies = [["tv_embedded"], ["ios", "web_creator"], ["android"], ["web"]] if is_youtube else [None]

    success = False
    last_err = None
    for clients in strategies:
        opts = get_common_opts(is_youtube, is_download=True)
        if clients: opts["extractor_args"]["youtube"]["player_client"] = clients
        opts.update({
            "format": fmt, "outtmpl": outtmpl, "progress_hooks": [progress_hook(job_id)],
            "nopart": True, "continuedl": True, "overwrites": True,
            "merge_output_format": "mp4" if format_type != "audio" else None
        })
        if format_type == "audio":
            opts["postprocessors"] = [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
        
        try:
            print(f"[download] Strategy: {clients}")
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
            
            ext = "mp3" if format_type == "audio" else "mp4"
            path = os.path.join(DOWNLOAD_DIR, f"{job_id}.{ext}")
            if os.path.exists(path):
                success = True
                redis_client.hset(f"job:{job_id}", mapping={"status": "completed", "progress": "100", "downloadUrl": path})
                return
        except Exception as e:
            last_err = str(e)
            print(f"[download] Strategy {clients} failed: {last_err}")
            time.sleep(1)

    redis_client.hset(f"job:{job_id}", mapping={"status": "failed", "error": last_err or "Failed"})