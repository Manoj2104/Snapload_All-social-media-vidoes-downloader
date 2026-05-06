import yt_dlp
import os
import re
import shutil
import time
from services.redis_service import redis_client
from yt_dlp.networking.impersonate import ImpersonateTarget

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------
# COOKIE SETUP
# ---------------------------------------------------------
def init_cookies():
    writable_cookie = os.path.join(DOWNLOAD_DIR, "cookies.txt")

    # Already copied
    if os.path.isfile(writable_cookie) and os.path.getsize(writable_cookie) > 100:
        return writable_cookie

    # Render Secret File
    env_path = os.environ.get("YT_COOKIES_FILE", "").strip()
    if env_path and os.path.isfile(env_path):
        try:
            shutil.copy2(env_path, writable_cookie)
            return writable_cookie
        except: pass

    # Raw Env Content
    content = os.environ.get("YT_COOKIES_CONTENT", "").strip()
    if content:
        try:
            with open(writable_cookie, "w", encoding="utf-8") as f:
                f.write(content)
            return writable_cookie
        except: pass

    # Local fallback
    if os.path.isfile("cookies.txt"):
        try:
            shutil.copy2("cookies.txt", writable_cookie)
            return writable_cookie
        except: pass

    return None

COOKIE_FILE = init_cookies()
PROXY = os.environ.get("YT_PROXY", "").strip()

# ---------------------------------------------------------
# OPTIONS GENERATOR
# ---------------------------------------------------------
def get_common_opts(is_youtube=True):
    po_token = os.environ.get("YT_PO_TOKEN")
    visitor_data = os.environ.get("YT_VISITOR_DATA")

    opts = {
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "ignoreerrors": False,
        "geo_bypass": True,
        "force_ipv4": True,
        "socket_timeout": 60,
        "retries": 10,
        "fragment_retries": 10,
        "impersonate": ImpersonateTarget(client="chrome"),
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if is_youtube:
        yt_args = {
            "player_client": ["ios", "web_creator", "tv_embedded", "android"],
            "skip": ["hls", "dash"] if not po_token else [],
        }
        if po_token: yt_args["po_token"] = [f"web+{po_token}", f"ios+{po_token}"]
        if visitor_data: yt_args["visitor_data"] = visitor_data
        opts["extractor_args"] = {"youtube": yt_args}

    if COOKIE_FILE: opts["cookiefile"] = COOKIE_FILE
    if PROXY: opts["proxy"] = PROXY
    return opts

# ---------------------------------------------------------
# CORE TASKS
# ---------------------------------------------------------
def cleanup_downloads():
    if not os.path.exists(DOWNLOAD_DIR): return
    for name in os.listdir(DOWNLOAD_DIR):
        if name == "cookies.txt": continue
        path = os.path.join(DOWNLOAD_DIR, name)
        try:
            if os.path.isfile(path): os.remove(path)
            elif os.path.isdir(path): shutil.rmtree(path)
        except: pass

def extract_metadata(url):
    is_youtube = "youtube.com" in url or "youtu.be" in url
    strategies = [
        {"extractor_args": {"youtube": {"player_client": ["ios", "web_creator"]}}},
        {"extractor_args": {"youtube": {"player_client": ["tv_embedded"]}}},
        {"extractor_args": {"youtube": {"player_client": ["android"]}}},
        {"extractor_args": {"youtube": {"player_client": ["web"]}}},
    ] if is_youtube else [{}]

    last_error = None
    for strategy in strategies:
        opts = get_common_opts(is_youtube)
        opts.update(strategy)
        opts["skip_download"] = True
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                formats = []
                for f in info.get("formats", []):
                    if f.get("vcodec") != "none" and f.get("height"):
                        formats.append({"format_id": f.get("format_id"), "resolution": f"{f.get('height')}p", "ext": f.get("ext"), "type": "video"})
                    elif f.get("acodec") != "none" and f.get("vcodec") == "none":
                        formats.append({"format_id": f.get("format_id"), "resolution": "audio", "ext": f.get("ext"), "type": "audio"})
                return {
                    "title": info.get("title"), "thumbnail": info.get("thumbnail"),
                    "duration": info.get("duration"), "channel": info.get("uploader"),
                    "views": info.get("view_count"), "formats": formats, "platform": info.get("extractor_key", ""),
                }
        except Exception as e:
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e))
            if "sign in" not in last_error.lower() and "bot" not in last_error.lower(): break
    raise Exception(last_error or "Extraction failed")

def download_video_task(job_id, url, format_type, quality):
    cleanup_downloads()
    is_youtube = "youtube.com" in url or "youtu.be" in url
    res_val = {"4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}.get(quality.lower(), 1080)
    
    if format_type == "audio":
        fmt = "bestaudio/best"
    else:
        fmt = f"bestvideo[height<={res_val}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={res_val}]+bestaudio/best[height<={res_val}]/best"

    strategies = [
        {"extractor_args": {"youtube": {"player_client": ["ios", "web_creator"]}}},
        {"extractor_args": {"youtube": {"player_client": ["tv_embedded"]}}},
        {"extractor_args": {"youtube": {"player_client": ["android"]}}},
        {"extractor_args": {"youtube": {"player_client": ["web"]}}},
    ] if is_youtube else [{}]

    success = False
    last_error = None
    for strategy in strategies:
        opts = get_common_opts(is_youtube)
        opts.update(strategy)
        opts.update({
            "format": fmt, "outtmpl": os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s"),
            "merge_output_format": "mp4", "nopart": True, "overwrites": True,
            "progress_hooks": [lambda d: redis_client.hset(f"job:{job_id}", "progress", d.get("_percent_str", "0%").replace("%","").strip()) if d["status"]=="downloading" else None],
        })
        if format_type == "audio":
            opts["postprocessors"] = [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
            success = True
            break
        except Exception as e:
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e))
            if "sign in" not in last_error.lower() and "bot" not in last_error.lower(): break

    if success:
        ext_final = "mp3" if format_type == "audio" else "mp4"
        final_file = os.path.join(DOWNLOAD_DIR, f"{job_id}.{ext_final}")
        redis_client.hset(f"job:{job_id}", mapping={"status": "completed", "progress": "100", "downloadUrl": final_file})
    else:
        redis_client.hset(f"job:{job_id}", mapping={"status": "failed", "error": last_error or "Download failed"})