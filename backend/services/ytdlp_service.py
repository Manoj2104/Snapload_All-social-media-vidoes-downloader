import yt_dlp
import os
import re
import shutil
from services.redis_service import redis_client

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------
# COOKIE SETUP
# ---------------------------------------------------------
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

# ---------------------------------------------------------
# OPTIONS GENERATOR
# ---------------------------------------------------------
def get_common_opts(is_youtube=True, is_download=False):
    po_token = os.environ.get("YT_PO_TOKEN")
    visitor_data = os.environ.get("YT_VISITOR_DATA")
    opts = {
        "quiet": True, "no_warnings": True, "nocheckcertificate": True, "ignoreerrors": False,
        "geo_bypass": True, "force_ipv4": True, "socket_timeout": 60, "retries": 10,
        "fragment_retries": 10, "extractor_retries": 5, "sleep_interval": 1, "max_sleep_interval": 3,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    }
    if is_youtube:
        yt_args = {
            "player_client": ["ios", "web_creator", "tv_embedded", "android"],
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

def get_metadata_opts(is_youtube=True):
    opts = get_common_opts(is_youtube, is_download=False)
    opts["extract_flat"] = True
    opts["skip_download"] = True
    return opts

def extract_metadata(url):
    is_youtube = "youtube.com" in url or "youtu.be" in url
    opts = get_metadata_opts(is_youtube)
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False, process=(not is_youtube))
            if info.get("_type") == "playlist":
                entries = info.get("entries") or []
                info = entries[0] if entries else info
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

def find_downloaded_file(job_id, extension):
    for name in os.listdir(DOWNLOAD_DIR):
        if name.startswith(job_id) and name.endswith(extension):
            return os.path.join(DOWNLOAD_DIR, name)
    return None

def progress_hook(job_id):
    def hook(d):
        try:
            if d["status"] == "downloading":
                percent = d.get("_percent_str", "0%")
                clean = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", percent)
                value = float(clean.replace("%", "").strip())
                redis_client.hset(f"job:{job_id}", "progress", str(value))
            elif d["status"] == "finished":
                redis_client.hset(f"job:{job_id}", "progress", "99")
        except: pass
    return hook

def download_video_task(job_id, url, format_type, quality):
    cleanup_downloads()
    global COOKIE_FILE
    if not COOKIE_FILE or not os.path.isfile(COOKIE_FILE): COOKIE_FILE = init_cookies()
    output_template = os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s")
    res_val = {"4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}.get(quality.lower(), 720)
    if format_type == "audio":
        fmt = "bestaudio[ext=m4a]/bestaudio/best"
    else:
        fmt = f"bestvideo[height<={res_val}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={res_val}]+bestaudio/bestvideo+bestaudio/best"

    is_youtube = "youtube.com" in url or "youtu.be" in url
    strategies = [
        {"extractor_args": {"youtube": {"player_client": ["web_creator", "ios"]}}},
        {"extractor_args": {"youtube": {"player_client": ["tv_embedded"]}}},
        {"extractor_args": {"youtube": {"player_client": ["android"]}}},
    ] if is_youtube else [{}]

    success = False
    last_error = None
    for strategy in strategies:
        opts = get_common_opts(is_youtube, is_download=True)
        if "extractor_args" in strategy:
            for key, val in strategy["extractor_args"].items():
                if key in opts["extractor_args"]: opts["extractor_args"][key].update(val)
                else: opts["extractor_args"][key] = val
        opts.update({"format": fmt, "outtmpl": output_template, "progress_hooks": [progress_hook(job_id)], "nopart": True, "continuedl": True, "overwrites": True, "merge_output_format": "mp4" if format_type != "audio" else None})
        if format_type == "audio":
            opts["postprocessors"] = [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
        try:
            with yt_dlp.YoutubeDL(opts) as ydl: ydl.download([url])
            ext_f = "mp3" if format_type == "audio" else "mp4"
            if find_downloaded_file(job_id, f".{ext_f}"):
                success = True
                break
        except Exception as e:
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e))
    
    if success:
        ext_f = "mp3" if format_type == "audio" else "mp4"
        final_file = find_downloaded_file(job_id, f".{ext_f}")
        redis_client.hset(f"job:{job_id}", mapping={"status": "completed", "progress": "100", "downloadUrl": final_file})
    else:
        redis_client.hset(f"job:{job_id}", mapping={"status": "failed", "error": last_error or "Download failed"})