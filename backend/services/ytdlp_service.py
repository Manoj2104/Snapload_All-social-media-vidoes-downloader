import yt_dlp
import os
import re
import time
import shutil
from services.redis_service import redis_client

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# =========================================================
# COOKIE SETUP
# =========================================================

def init_cookies():
    writable = os.path.join(DOWNLOAD_DIR, "cookies.txt")

    env_cookie_file = os.environ.get("YT_COOKIES_FILE", "").strip()

    if env_cookie_file and os.path.isfile(env_cookie_file):
        shutil.copy2(env_cookie_file, writable)
        print(f"[cookies] loaded: {writable}")
        return writable

    local_cookie = "cookies.txt"

    if os.path.isfile(local_cookie):
        shutil.copy2(local_cookie, writable)
        print(f"[cookies] local loaded")
        return writable

    print("[cookies] no cookies found")
    return None


COOKIE_FILE = init_cookies()

# =========================================================
# OPTIONAL PROXY
# =========================================================

PROXY = os.environ.get("YT_PROXY", "").strip()

# Example:
# http://user:pass@host:port

# =========================================================
# COMMON YTDLP OPTIONS
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

        "sleep_interval": 2,
        "max_sleep_interval": 5,
        "sleep_interval_requests": 1,

        "concurrent_fragment_downloads": 1,

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

            "X-YouTube-Client-Name": "1",
            "X-YouTube-Client-Version": "2.20240201.00.00",
        },

        "extractor_args": {
            "youtube": {
                "player_client": [
                    "android",
                    "web",
                    "tv_embedded",
                ],

                "player_skip": [
                    "configs",
                ],
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

                clean = re.sub(
                    r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])",
                    "",
                    percent
                )

                value = float(clean.replace("%", "").strip())

                redis_client.hset(
                    f"job:{job_id}",
                    "progress",
                    str(value)
                )

            elif d["status"] == "finished":

                redis_client.hset(
                    f"job:{job_id}",
                    "progress",
                    "99"
                )

        except:
            pass

    return hook

# =========================================================
# EXTRACT METADATA
# =========================================================

def extract_metadata(url):

    opts = get_common_opts()

    opts.update({
        "skip_download": True,
    })

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

            return {
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "channel": info.get("uploader"),
                "views": info.get("view_count"),
                "formats": formats,
            }

    except Exception as e:

        err = str(e)

        print(err)

        raise Exception(err)

# =========================================================
# DOWNLOAD VIDEO
# =========================================================

def download_video_task(job_id, url, format_type, quality):

    cleanup_downloads()

    ext = "mp3" if format_type == "audio" else "mp4"

    output_template = os.path.join(
        DOWNLOAD_DIR,
        f"{job_id}.%(ext)s"
    )

    quality_map = {
        "4k": "bestvideo[height<=2160]+bestaudio/best",
        "1080p": "bestvideo[height<=1080]+bestaudio/best",
        "720p": "bestvideo[height<=720]+bestaudio/best",
        "480p": "bestvideo[height<=480]+bestaudio/best",
    }

    selected_format = quality_map.get(
        quality.lower(),
        "bestvideo+bestaudio/best"
    )

    if format_type == "audio":
        selected_format = "bestaudio/best"

    opts = get_common_opts()

    opts.update({

        "format": selected_format,

        "outtmpl": output_template,

        "merge_output_format": "mp4",

        "progress_hooks": [
            progress_hook(job_id)
        ],

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

    try:

        with yt_dlp.YoutubeDL(opts) as ydl:

            ydl.download([url])

        final_file = None

        for file in os.listdir(DOWNLOAD_DIR):

            if file.startswith(job_id):

                if format_type == "audio" and file.endswith(".mp3"):
                    final_file = file

                elif format_type != "audio" and file.endswith(".mp4"):
                    final_file = file

        if not final_file:
            raise Exception("Downloaded file not found")

        final_path = os.path.join(
            DOWNLOAD_DIR,
            final_file
        )

        redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": "completed",
                "progress": "100",
                "downloadUrl": final_path,
            }
        )

        print(f"[download completed] {final_path}")

    except Exception as e:

        error = str(e)

        print(f"[download error] {error}")

        redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": "failed",
                "error": error,
            }
        )