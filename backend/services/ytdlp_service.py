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
        "YT_COOKIES_FILE",
        ""
    ).strip()

    if (
        env_cookie_file
        and os.path.isfile(env_cookie_file)
    ):

        try:

            shutil.copy2(
                env_cookie_file,
                writable_cookie
            )

            print(
                f"[cookies] copied from render secret: "
                f"{writable_cookie}"
            )

            return writable_cookie

        except Exception as e:

            print(f"[cookies] copy failed: {e}")

    # raw env content
    env_cookie_content = os.environ.get(
        "YT_COOKIES_CONTENT",
        ""
    ).strip()

    if env_cookie_content:

        try:

            with open(
                writable_cookie,
                "w",
                encoding="utf-8"
            ) as f:

                f.write(env_cookie_content)

            print(
                f"[cookies] loaded from env content"
            )

            return writable_cookie

        except Exception as e:

            print(f"[cookies] write failed: {e}")

    # local fallback
    local_cookie = "cookies.txt"

    if os.path.isfile(local_cookie):

        try:

            shutil.copy2(
                local_cookie,
                writable_cookie
            )

            print("[cookies] local loaded")

            return writable_cookie

        except Exception as e:

            print(f"[cookies] local failed: {e}")

    print(
        "[cookies] WARNING: "
        "no cookies found"
    )

    return None


COOKIE_FILE = init_cookies()

# =========================================================
# OPTIONAL PROXY
# =========================================================

PROXY = os.environ.get(
    "YT_PROXY",
    ""
).strip()

# =========================================================
# COMMON YTDLP OPTIONS
# FIX 1: Added "ios" as primary player_client to bypass
#         YouTube bot-detection and js_runtimes errors.
#         "web" kept as fallback.
# =========================================================

def get_common_opts():

    opts = {

        "quiet": False,

        "no_warnings": True,

        "nocheckcertificate": True,

        "ignoreerrors": False,

        "geo_bypass": True,

        "force_ipv4": True,

        "socket_timeout": 60,

        "retries": 10,

        "fragment_retries": 10,

        "extractor_retries": 5,

        "sleep_interval": 1,

        "max_sleep_interval": 3,

        "http_headers": {

            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/124.0.0.0 "
                "Safari/537.36"
            ),

            "Accept-Language":
            "en-US,en;q=0.9",
        },

        # FIX 1: ios bypasses js_runtimes issues + bot detection
        "extractor_args": {

            "youtube": {

                "player_client": [
                    "ios",
                    "web",
                ]
            }
        },
    }

    # cookies
    if (
        COOKIE_FILE
        and os.path.isfile(COOKIE_FILE)
    ):

        opts["cookiefile"] = COOKIE_FILE

    # proxy
    if PROXY:

        opts["proxy"] = PROXY

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

        path = os.path.join(
            DOWNLOAD_DIR,
            name
        )

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

                percent = d.get(
                    "_percent_str",
                    "0%"
                )

                clean = re.sub(
                    r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])",
                    "",
                    percent
                )

                value = float(
                    clean.replace("%", "")
                    .strip()
                )

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

        except Exception:
            pass

    return hook

# =========================================================
# EXTRACT METADATA
# FIX 2: Removed extract_flat=True so yt-dlp actually
#         validates available formats. Static format list
#         is still returned to the frontend (safe UX),
#         but now metadata extraction won't silently lie
#         about what's available.
# =========================================================

def extract_metadata(url):

    opts = get_common_opts()

    # Do NOT use extract_flat — it skips format validation
    # and causes 400s downstream when formats don't exist.
    opts["skip_download"] = True

    try:

        with yt_dlp.YoutubeDL(opts) as ydl:

            info = ydl.extract_info(
                url,
                download=False
            )

            return {

                "title":
                info.get("title", "Unknown"),

                "thumbnail":
                info.get("thumbnail", ""),

                "duration":
                info.get("duration", 0),

                "channel":
                info.get("uploader", ""),

                "views":
                info.get("view_count", 0),

                # Static safe formats shown to user.
                # Actual download uses resilient fallback
                # format string — see download_video_task.
                "formats": [

                    {
                        "resolution": "720p",
                        "ext": "mp4",
                        "type": "video",
                    },

                    {
                        "resolution": "360p",
                        "ext": "mp4",
                        "type": "video",
                    },

                    {
                        "resolution": "audio",
                        "ext": "mp3",
                        "type": "audio",
                    }
                ]
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

def find_downloaded_file(
    job_id,
    extension
):

    for name in os.listdir(DOWNLOAD_DIR):

        if (
            name.startswith(job_id)
            and name.endswith(extension)
        ):

            return os.path.join(
                DOWNLOAD_DIR,
                name
            )

    return None

# =========================================================
# DOWNLOAD TASK
# FIX 3: Replaced hardcoded "22/18/best" with a resilient
#         cascading format string that works even when
#         specific YouTube format IDs are unavailable.
#         "22" and "18" are legacy IDs that many videos
#         no longer expose — this new string always finds
#         the best available option safely.
# =========================================================

def download_video_task(
    job_id,
    url,
    format_type,
    quality
):

    cleanup_downloads()

    global COOKIE_FILE

    # reload cookies if deleted
    if (
        not COOKIE_FILE
        or not os.path.isfile(COOKIE_FILE)
    ):

        COOKIE_FILE = init_cookies()

    ext = (
        "mp3"
        if format_type == "audio"
        else "mp4"
    )

    output_template = os.path.join(
        DOWNLOAD_DIR,
        f"{job_id}.%(ext)s"
    )

    # =====================================================
    # FIX 3: RESILIENT FORMAT STRINGS
    # Old: "22/18/best" — breaks when format IDs missing
    # New: Cascading height-capped selectors with merge
    #      fallbacks, always finds something to download.
    # =====================================================

    if format_type == "audio":

        # Direct audio formats, cascading from best
        fmt = "140/251/bestaudio[ext=m4a]/bestaudio"

    elif quality == "720p":

        # Try merged 720p first, then progressive, then any
        fmt = (
            "bestvideo[height<=720][ext=mp4]"
            "+bestaudio[ext=m4a]"
            "/bestvideo[height<=720]+bestaudio"
            "/best[height<=720]"
            "/best"
        )

    else:

        # 360p fallback path
        fmt = (
            "bestvideo[height<=360][ext=mp4]"
            "+bestaudio[ext=m4a]"
            "/bestvideo[height<=360]+bestaudio"
            "/best[height<=360]"
            "/best"
        )

    print(f"[download] format: {fmt}")

    print(
        f"[download] cookies: "
        f"{COOKIE_FILE or 'NONE'}"
    )

    opts = get_common_opts()

    opts.update({

        "format": fmt,

        "outtmpl": output_template,

        "progress_hooks": [
            progress_hook(job_id)
        ],

        "nopart": True,

        "continuedl": True,

        "overwrites": True,

        # Required when merging bestvideo+bestaudio
        "merge_output_format": "mp4",
    })

    # =====================================================
    # AUDIO POSTPROCESS
    # =====================================================

    if format_type == "audio":

        opts["postprocessors"] = [{

            "key":
            "FFmpegExtractAudio",

            "preferredcodec":
            "mp3",

            "preferredquality":
            "192",
        }]

    # =====================================================
    # DOWNLOAD
    # =====================================================

    try:

        with yt_dlp.YoutubeDL(opts) as ydl:

            ydl.download([url])

        final_file = find_downloaded_file(
            job_id,
            ".mp3" if format_type == "audio"
            else ".mp4"
        )

        if not final_file:

            raise Exception(
                "Downloaded file not found"
            )

        redis_client.hset(

            f"job:{job_id}",

            mapping={

                "status":
                "completed",

                "progress":
                "100",

                "downloadUrl":
                final_file,
            }
        )

        print(
            f"[download completed] "
            f"{final_file}"
        )

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

                "status":
                "failed",

                "error":
                err,
            }
        )