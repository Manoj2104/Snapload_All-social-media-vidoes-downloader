import yt_dlp
import os
import re
import shutil
from services.redis_service import redis_client

# =========================================================
# DOWNLOAD DIRECTORY
# =========================================================

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# =========================================================
# COOKIE SETUP
# =========================================================

def init_cookies():

    writable_cookie = os.path.join(
        DOWNLOAD_DIR,
        "cookies.txt"
    )

    # already copied
    if (
        os.path.isfile(writable_cookie)
        and os.path.getsize(writable_cookie) > 100
    ):
        print(f"[cookies] loaded: {writable_cookie}")
        return writable_cookie

    # render secret file
    env_cookie_file = os.environ.get(
        "YT_COOKIES_FILE", ""
    ).strip()

    if env_cookie_file and os.path.isfile(env_cookie_file):
        try:
            shutil.copy2(env_cookie_file, writable_cookie)
            print(
                f"[cookies] copied from render secret: "
                f"{writable_cookie}"
            )
            return writable_cookie
        except Exception as e:
            print(f"[cookies] copy failed: {e}")

    # raw env content
    env_cookie_content = os.environ.get(
        "YT_COOKIES_CONTENT", ""
    ).strip()

    if env_cookie_content:
        try:
            with open(writable_cookie, "w", encoding="utf-8") as f:
                f.write(env_cookie_content)
            print("[cookies] loaded from env content")
            return writable_cookie
        except Exception as e:
            print(f"[cookies] write failed: {e}")

    # local fallback
    local_cookie = "cookies.txt"
    if os.path.isfile(local_cookie):
        try:
            shutil.copy2(local_cookie, writable_cookie)
            print("[cookies] local loaded")
            return writable_cookie
        except Exception as e:
            print(f"[cookies] local failed: {e}")

    print("[cookies] WARNING: no cookies found")
    return None


COOKIE_FILE = init_cookies()

# =========================================================
# OPTIONAL PROXY
# =========================================================

PROXY = os.environ.get("YT_PROXY", "").strip()

# =========================================================
# COMMON YTDLP OPTIONS
# - ios client primary: bypasses js_runtimes error
#   and YouTube bot detection entirely
# - web kept as fallback
# =========================================================

def get_common_opts(is_youtube=True, is_download=False):
    # Support for PO Token (Proof of Origin) — set these in Render Env Vars
    po_token = os.environ.get("YT_PO_TOKEN")
    visitor_data = os.environ.get("YT_VISITOR_DATA")

    opts = {
        "quiet":               True,
        "no_warnings":         True,
        "nocheckcertificate":  True,
        "ignoreerrors":        False,
        "geo_bypass":          True,
        "force_ipv4":          True,
        "socket_timeout":      60,
        "retries":             10,
        "fragment_retries":    10,
        "extractor_retries":   5,
        "sleep_interval":      1,
        "max_sleep_interval":  3,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if is_youtube:
        # We prioritize high-trust clients that bypass bot detection and n-sig challenges
        yt_args = {
            "player_client": ["ios", "web_creator", "tv_embedded", "android"],
            # Critical: Allow HLS/DASH during downloads to get high quality formats
            # We only skip them during Analyze (is_download=False) to avoid bot triggers
            "skip": ["hls", "dash"] if (not is_download and not po_token) else [],
        }
        
        if po_token:
            yt_args["po_token"] = [f"web+{po_token}", f"ios+{po_token}"]
        if visitor_data:
            yt_args["visitor_data"] = visitor_data
            
        opts["extractor_args"] = {"youtube": yt_args}

    if COOKIE_FILE and os.path.isfile(COOKIE_FILE):
        opts["cookiefile"] = COOKIE_FILE

    if PROXY:
        opts["proxy"] = PROXY

    return opts

# =========================================================
# METADATA-ONLY OPTIONS
#
# KEY DESIGN RULE:
# extract_metadata must NEVER fail due to format issues.
# extract_flat=True tells yt-dlp to fetch basic info only
# (title, thumbnail, duration, channel, views) and skip
# all format probing entirely.
#
# Format validation happens ONLY in download_video_task.
# This is the correct separation of concerns.
# =========================================================

def get_metadata_opts(is_youtube=True):

    opts = get_common_opts(is_youtube, is_download=False)

    # extract_flat=True on a single video URL:
    # fetches basic info, skips format listing completely.
    # No formats = no format errors. Ever.
    opts["extract_flat"]  = True
    opts["skip_download"] = True

    # Do NOT set "format" here — no format = no format error
    return opts

# =========================================================
# CLEANUP
# =========================================================

def cleanup_downloads():

    if not os.path.exists(DOWNLOAD_DIR):
        return

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
                clean   = re.sub(
                    r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])",
                    "",
                    percent
                )
                value = float(clean.replace("%", "").strip())

                redis_client.hset(
                    f"job:{job_id}", "progress", str(value)
                )

            elif d["status"] == "finished":
                redis_client.hset(
                    f"job:{job_id}", "progress", "99"
                )

        except Exception:
            pass

    return hook

# =========================================================
# EXTRACT METADATA
#
# Only fetches: title, thumbnail, duration, channel, views.
# Never touches formats. Cannot fail due to format issues.
# Returns a static safe format list to the frontend.
# =========================================================

def extract_metadata(url):
    is_youtube = "youtube.com" in url or "youtu.be" in url
    opts = get_metadata_opts(is_youtube)

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            # For YouTube, we use process=False to ensure it NEVER tries to validate formats
            # during the analyze phase. This makes it extremely fast and stable.
            info = ydl.extract_info(url, download=False, process=(not is_youtube))

            # extract_flat on a playlist gives entries[];
            # on a single video it returns the video dict.
            # Handle both safely.
            if info.get("_type") == "playlist":
                entries = info.get("entries") or []
                info    = entries[0] if entries else info

            return {
                "title":     info.get("title",      "Unknown"),
                "thumbnail": info.get("thumbnail",  ""),
                "duration":  info.get("duration",   0),
                "channel":   info.get("uploader",   ""),
                "views":     info.get("view_count", 0),

                # Static format list shown to the user.
                # Actual download uses resilient cascading
                # format strings — see download_video_task.
                "formats": [
                    {
                        "resolution": "720p",
                        "ext":        "mp4",
                        "type":       "video",
                    },
                    {
                        "resolution": "360p",
                        "ext":        "mp4",
                        "type":       "video",
                    },
                    {
                        "resolution": "audio",
                        "ext":        "mp3",
                        "type":       "audio",
                    },
                ],
            }

    except Exception as e:

        err = re.sub(
            r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])",
            "",
            str(e)
        )
        print(f"[metadata error] {err}")
        raise Exception(err)

# =========================================================
# FIND FILE
# =========================================================

def find_downloaded_file(job_id, extension):

    for name in os.listdir(DOWNLOAD_DIR):
        if name.startswith(job_id) and name.endswith(extension):
            return os.path.join(DOWNLOAD_DIR, name)

    return None

# =========================================================
# DOWNLOAD TASK
#
# FORMAT STRATEGY — resilient cascading:
#
# OLD: "22/18/best"
#   Hardcoded legacy YouTube format IDs. Fails on Shorts,
#   newer uploads, age-restricted, and many other videos
#   that no longer expose format IDs 22 or 18.
#
# NEW: capability-based selection with full fallback chain
#   yt-dlp tries each option left-to-right and picks the
#   first that actually exists. Never hard-fails on formats.
# =========================================================
def download_video_task(
    job_id,
    url,
    format_type,
    quality
):
    cleanup_downloads()
    global COOKIE_FILE

    # reload cookies if missing
    if not COOKIE_FILE or not os.path.isfile(COOKIE_FILE):
        COOKIE_FILE = init_cookies()

    output_template = os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s")
    res_val = {"4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}.get(quality.lower(), 720)

    # 1. Choose Format String
    if format_type == "audio":
        fmt = "bestaudio[ext=m4a]/bestaudio/best"
    elif quality in ["4k", "2160p", "1080p", "720p"]:
        fmt = f"bestvideo[height<={res_val}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={res_val}]+bestaudio/bestvideo+bestaudio/best"
    else:
        fmt = f"bestvideo[height<={res_val}]+bestaudio/best[height<={res_val}]/best"

    # 2. Strategy Loop for Download
    # web_creator/ios combination is best for high resolution + stability
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
        opts.update(strategy)
        opts.update({
            "format":              fmt,
            "outtmpl":             output_template,
            "progress_hooks":      [progress_hook(job_id)],
            "nopart":              True,
            "continuedl":          True,
            "overwrites":          True,
            "merge_output_format": "mp4" if format_type != "audio" else None,
        })

        if format_type == "audio":
            opts["postprocessors"] = [{
                "key":              "FFmpegExtractAudio",
                "preferredcodec":   "mp3",
                "preferredquality": "192",
            }]

        try:
            print(f"[download] Strategy: {strategy.get('extractor_args', {}).get('youtube', {}).get('player_client', 'default')}")
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
            
            # Verify file exists
            ext_final = "mp3" if format_type == "audio" else "mp4"
            if find_downloaded_file(job_id, f".{ext_final}"):
                success = True
                break
        except Exception as e:
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e))
            print(f"[download strategy failed] {last_error}")
            if "not a valid URL" in last_error: break

    # 3. Update Status
    if success:
        ext_final = "mp3" if format_type == "audio" else "mp4"
        final_file = find_downloaded_file(job_id, f".{ext_final}")
        redis_client.hset(f"job:{job_id}", mapping={"status": "completed", "progress": "100", "downloadUrl": final_file})
        print(f"[download completed] {final_file}")
    else:
        redis_client.hset(f"job:{job_id}", mapping={"status": "failed", "error": last_error or "Download failed"})
       )