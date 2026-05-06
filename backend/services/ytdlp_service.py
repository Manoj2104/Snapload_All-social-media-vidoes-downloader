import yt_dlp
import os
import re
import shutil
from services.redis_service import redis_client

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# =========================================================
# COOKIE SETUP
# =========================================================

def init_cookies():
    writable = os.path.join(DOWNLOAD_DIR, "cookies.txt")

    # Already copied and ready
    if os.path.isfile(writable) and os.path.getsize(writable) > 100:
        print(f"[cookies] loaded: {writable}")
        return writable

    # Render Secret File path (read-only) → copy to writable downloads/
    env_path = os.environ.get("YT_COOKIES_FILE", "").strip()
    if env_path and os.path.isfile(env_path):
        shutil.copy2(env_path, writable)
        print(f"[cookies] loaded: {writable}")
        return writable

    # Raw cookie text pasted as env var
    content = os.environ.get("YT_COOKIES_CONTENT", "").strip()
    if content:
        with open(writable, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[cookies] loaded from env content: {writable}")
        return writable

    # Local dev fallback
    if os.path.isfile("cookies.txt"):
        shutil.copy2("cookies.txt", writable)
        print("[cookies] loaded local cookies.txt")
        return writable

    print("[cookies] WARNING: no cookies found — YouTube will block this server IP")
    return None


COOKIE_FILE = init_cookies()
PROXY = os.environ.get("YT_PROXY", "").strip()

# =========================================================
# COMMON OPTIONS
# =========================================================

def get_common_opts():
    opts = {
        "quiet": False,
        "no_warnings": True,
        "nocheckcertificate": True,
        "ignoreerrors": False,
        "retries": 10,
        "fragment_retries": 10,
        "extractor_retries": 5,
        "sleep_interval": 1,
        "max_sleep_interval": 3,
        "concurrent_fragment_downloads": 4,
        "geo_bypass": True,
        "force_ipv4": True,
        "socket_timeout": 60,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
        # Use ONLY "web" client — it returns all formats (1080p/4K/webm/mp4)
        # Multiple clients cause format conflicts and "not available" errors
        "extractor_args": {
            "youtube": {
                "player_client": ["web"],
            }
        },
    }

    if COOKIE_FILE and os.path.isfile(COOKIE_FILE):
        opts["cookiefile"] = COOKIE_FILE

    if PROXY:
        opts["proxy"] = PROXY

    return opts

# =========================================================
# CLEANUP
# =========================================================

def cleanup_downloads():
    for name in os.listdir(DOWNLOAD_DIR):
        if name == "cookies.txt":
            continue
        path = os.path.join(DOWNLOAD_DIR, name)
        try:
            if os.path.isfile(path):
                os.remove(path)
            elif os.path.isdir(path):
                shutil.rmtree(path)
        except Exception as e:
            print(f"[cleanup] {e}")

# =========================================================
# PROGRESS HOOK
# =========================================================

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
        except:
            pass
    return hook

# =========================================================
# EXTRACT METADATA
# =========================================================

def extract_metadata(url):
    opts = get_common_opts()
    opts["skip_download"] = True

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = []
            for f in info.get("formats", []):
                if f.get("vcodec") != "none" and f.get("height"):
                    formats.append({
                        "format_id": f.get("format_id"),
                        "resolution": f"{f.get('height')}p",
                        "ext": f.get("ext"),
                        "type": "video",
                    })
                elif f.get("acodec") != "none" and f.get("vcodec") == "none":
                    formats.append({
                        "format_id": f.get("format_id"),
                        "resolution": "audio",
                        "ext": f.get("ext"),
                        "type": "audio",
                    })
            return {
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "channel": info.get("uploader"),
                "views": info.get("view_count"),
                "formats": formats,
            }
    except Exception as e:
        err = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e))
        print(f"[metadata error] {err}")
        raise Exception(err)

# =========================================================
# DOWNLOAD VIDEO
# =========================================================

def download_video_task(job_id, url, format_type, quality):
    cleanup_downloads()

    # Re-init cookies if lost after cleanup
    global COOKIE_FILE
    if not COOKIE_FILE or not os.path.isfile(COOKIE_FILE):
        COOKIE_FILE = init_cookies()

    ext = "mp3" if format_type == "audio" else "mp4"
    output_template = os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s")

    # =====================================================
    # FORMAT SELECTION
    # DO NOT add [ext=mp4] or [ext=m4a] filters —
    # YouTube via "web" client serves webm/opus streams
    # and ext filters cause "format not available" errors.
    # merge_output_format="mp4" handles the container.
    # =====================================================

    if format_type == "audio":
        fmt = "bestaudio/best"
    else:
        quality_map = {
            "4k":    "bestvideo[height<=2160]+bestaudio/bestvideo+bestaudio/best",
            "1080p": "bestvideo[height<=1080]+bestaudio/bestvideo+bestaudio/best",
            "720p":  "bestvideo[height<=720]+bestaudio/bestvideo+bestaudio/best",
            "480p":  "bestvideo[height<=480]+bestaudio/bestvideo+bestaudio/best",
        }
        fmt = quality_map.get(quality.lower(), "bestvideo+bestaudio/best")

    print(f"[download] using format: {fmt}")
    print(f"[download] cookies: {COOKIE_FILE or 'NONE ⚠️'}")

    opts = get_common_opts()
    opts.update({
        "format": fmt,
        "outtmpl": output_template,
        "merge_output_format": "mp4",
        "progress_hooks": [progress_hook(job_id)],
        "nopart": True,
        "continuedl": True,
        "overwrites": True,
    })

    if format_type == "audio":
        opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]

    # =====================================================
    # DOWNLOAD
    # =====================================================

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])

        # Find the output file
        final_file = None
        for name in os.listdir(DOWNLOAD_DIR):
            if not name.startswith(job_id):
                continue
            if format_type == "audio" and name.endswith(".mp3"):
                final_file = name
                break
            elif format_type != "audio" and name.endswith(".mp4"):
                final_file = name
                break

        if not final_file:
            raise Exception("Downloaded file not found in downloads dir")

        final_path = os.path.join(DOWNLOAD_DIR, final_file)
        redis_client.hset(f"job:{job_id}", mapping={
            "status": "completed",
            "progress": "100",
            "downloadUrl": final_path,
        })
        print(f"[download completed] {final_path}")

    except Exception as e:
        error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e))
        print(f"[download error] {error}")
        redis_client.hset(f"job:{job_id}", mapping={
            "status": "failed",
            "error": error,
        })