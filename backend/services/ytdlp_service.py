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

def get_common_opts():

    opts = {
        "quiet":               False,
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
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
        # ios = no JS runtime needed, bypasses bot checks
        # web = fallback for platforms ios doesn't cover
        "extractor_args": {
            "youtube": {
                "player_client": ["ios", "web"]
            }
        },
    }

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

def get_metadata_opts():

    opts = get_common_opts()

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

    opts = get_metadata_opts()

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)

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

    output_template = os.path.join(
        DOWNLOAD_DIR,
        f"{job_id}.%(ext)s"
    )

    # --------------------------------------------------
    # RESILIENT FORMAT STRINGS
    # --------------------------------------------------

    if format_type == "audio":

        # m4a/webm audio, converted to mp3 via postprocessor
        fmt = "140/251/bestaudio[ext=m4a]/bestaudio"

    elif quality == "720p":

        # Merged streams (best quality) → progressive mp4
        # → anything ≤720p → absolute best available
        fmt = (
            "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]"
            "/bestvideo[height<=720]+bestaudio"
            "/best[height<=720]"
            "/best"
        )

    else:

        # 360p cascade — same pattern at lower resolution cap
        fmt = (
            "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]"
            "/bestvideo[height<=360]+bestaudio"
            "/best[height<=360]"
            "/best"
        )

    print(f"[download] format: {fmt}")
    print(f"[download] cookies: {COOKIE_FILE or 'NONE'}")

    opts = get_common_opts()

    opts.update({
        "format":              fmt,
        "outtmpl":             output_template,
        "progress_hooks":      [progress_hook(job_id)],
        "nopart":              True,
        "continuedl":          True,
        "overwrites":          True,
        # Required when yt-dlp merges separate
        # video + audio streams into a single file
        "merge_output_format": "mp4",
    })

    # --------------------------------------------------
    # AUDIO POSTPROCESS
    # --------------------------------------------------

    if format_type == "audio":
        opts["postprocessors"] = [{
            "key":              "FFmpegExtractAudio",
            "preferredcodec":   "mp3",
            "preferredquality": "192",
        }]

    # --------------------------------------------------
    # DOWNLOAD
    # --------------------------------------------------

    try:

        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])

        ext        = "mp3" if format_type == "audio" else "mp4"
        final_file = find_downloaded_file(job_id, f".{ext}")

        if not final_file:
            raise Exception("Downloaded file not found")

        redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status":      "completed",
                "progress":    "100",
                "downloadUrl": final_file,
            }
        )

        print(f"[download completed] {final_file}")

    except Exception as e:

        err = re.sub(
            r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])",
            "",
            str(e)
        )

        print(f"[download error] {err}")

        redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": "failed",
                "error":  err,
            }
        )