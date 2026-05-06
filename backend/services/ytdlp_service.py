import yt_dlp
import os
import re
import shutil
import time

from services.redis_service import redis_client

# =========================================================
# DOWNLOAD DIRECTORY
# =========================================================

DOWNLOAD_DIR = os.path.abspath("downloads")

os.makedirs(
    DOWNLOAD_DIR,
    exist_ok=True
)

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

        print(
            f"[cookies] loaded: "
            f"{writable_cookie}"
        )

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
                f"[cookies] copied from "
                f"render secret: "
                f"{writable_cookie}"
            )

            return writable_cookie

        except Exception as e:

            print(
                f"[cookies] copy failed: "
                f"{e}"
            )

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

                f.write(
                    env_cookie_content
                )

            print(
                "[cookies] loaded "
                "from env content"
            )

            return writable_cookie

        except Exception as e:

            print(
                f"[cookies] write failed: "
                f"{e}"
            )

    # local fallback
    local_cookie = "cookies.txt"

    if os.path.isfile(local_cookie):

        try:

            shutil.copy2(
                local_cookie,
                writable_cookie
            )

            print(
                "[cookies] local loaded"
            )

            return writable_cookie

        except Exception as e:

            print(
                f"[cookies] local failed: "
                f"{e}"
            )

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
# COMMON OPTIONS
# =========================================================

def get_common_opts(
    is_youtube=True,
    is_download=False
):

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
    }

    # =====================================================
    # YOUTUBE SETTINGS
    # =====================================================

    if is_youtube:

        opts["extractor_args"] = {

            "youtube": {

                # FINAL STABLE CLIENT
                "player_client": [
                    "android"
                ],

                # skip heavy parsing during metadata
                "skip": (
                    ["hls", "dash"]
                    if not is_download
                    else []
                )
            }
        }

    # =====================================================
    # COOKIES
    # =====================================================

    if (
        COOKIE_FILE
        and os.path.isfile(COOKIE_FILE)
    ):

        opts["cookiefile"] = COOKIE_FILE

    # =====================================================
    # PROXY
    # =====================================================

    if PROXY:

        opts["proxy"] = PROXY

    return opts

# =========================================================
# METADATA OPTIONS
# =========================================================

def get_metadata_opts(
    is_youtube=True
):

    opts = get_common_opts(
        is_youtube,
        is_download=False
    )

    opts["extract_flat"] = True

    opts["skip_download"] = True

    return opts

# =========================================================
# CLEANUP
# =========================================================

def cleanup_downloads():

    if not os.path.exists(
        DOWNLOAD_DIR
    ):
        return

    for name in os.listdir(
        DOWNLOAD_DIR
    ):

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

            print(
                f"[cleanup] {e}"
            )

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

                    clean.replace(
                        "%",
                        ""
                    ).strip()
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
# METADATA EXTRACTION
# =========================================================

def extract_metadata(url):

    is_youtube = (
        "youtube.com" in url
        or "youtu.be" in url
    )

    opts = get_metadata_opts(
        is_youtube
    )

    try:

        with yt_dlp.YoutubeDL(opts) as ydl:

            info = ydl.extract_info(

                url,

                download=False,

                process=(
                    not is_youtube
                )
            )

            # playlist safe
            if info.get("_type") == "playlist":

                entries = (
                    info.get("entries")
                    or []
                )

                info = (
                    entries[0]
                    if entries
                    else info
                )

            return {

                "title":
                info.get(
                    "title",
                    "Unknown"
                ),

                "thumbnail":
                info.get(
                    "thumbnail",
                    ""
                ),

                "duration":
                info.get(
                    "duration",
                    0
                ),

                "channel":
                info.get(
                    "uploader",
                    ""
                ),

                "views":
                info.get(
                    "view_count",
                    0
                ),

                # STATIC UI FORMATS
                "formats": [

                    {
                        "resolution":
                        "1080p",

                        "ext":
                        "mp4",

                        "type":
                        "video",
                    },

                    {
                        "resolution":
                        "720p",

                        "ext":
                        "mp4",

                        "type":
                        "video",
                    },

                    {
                        "resolution":
                        "480p",

                        "ext":
                        "mp4",

                        "type":
                        "video",
                    },

                    {
                        "resolution":
                        "360p",

                        "ext":
                        "mp4",

                        "type":
                        "video",
                    },

                    {
                        "resolution":
                        "audio",

                        "ext":
                        "mp3",

                        "type":
                        "audio",
                    },
                ],
            }

    except Exception as e:

        err = re.sub(

            r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])",

            "",

            str(e)
        )

        print(
            f"[metadata error] "
            f"{err}"
        )

        raise Exception(err)

# =========================================================
# FIND FILE
# =========================================================

def find_downloaded_file(
    job_id,
    extension
):

    for name in os.listdir(
        DOWNLOAD_DIR
    ):

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
# =========================================================

def download_video_task(
    job_id,
    url,
    format_type,
    quality
):

    cleanup_downloads()

    global COOKIE_FILE

    # reload cookies
    if (
        not COOKIE_FILE
        or not os.path.isfile(COOKIE_FILE)
    ):

        COOKIE_FILE = init_cookies()

    # =====================================================
    # OUTPUT
    # =====================================================

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
    # DETECT YOUTUBE
    # =====================================================

    is_youtube = any(

        x in url.lower()

        for x in [

            "youtube.com",

            "youtu.be"
        ]
    )

    # =====================================================
    # FINAL SAFE FORMAT FIX
    # =====================================================

    if format_type == "audio":

        # safest audio fallback
        fmt = "140/251/bestaudio/best"

    else:

        # IMPORTANT:
        # Use progressive streams ONLY.
        # Avoid DASH adaptive formats on Render.

        if quality == "1080":

            # most videos won't have progressive 1080
            # fallback chain required
            fmt = "137+140/248+251/22/18/best"

        elif quality == "720":

            fmt = "22/136+140/247+251/18/best"

        elif quality == "480":

            fmt = "135+140/244+251/18/best"

        elif quality == "360":

            fmt = "18/134+140/243+251/best"

        else:

            fmt = "22/18/best"

    # =====================================================
    # STABLE STRATEGY
    # =====================================================

    strategies = [

        {
            "extractor_args": {

                "youtube": {

                    "player_client": [
                        "android"
                    ]
                }
            }
        }
    ]

    last_error = None

    # =====================================================
    # TRY STRATEGIES
    # =====================================================

    for strategy in strategies:

        try:

            print(
                f"[download] Strategy: "
                f"{strategy['extractor_args']['youtube']['player_client']}"
            )

            opts = get_common_opts(

                is_youtube,

                is_download=True
            )

            opts.update(strategy)

            opts.update({

                # =========================================
                # FORMAT
                # =========================================

                "format": fmt,

                # =========================================
                # OUTPUT
                # =========================================

                "outtmpl":
                output_template,

                # =========================================
                # PROGRESS
                # =========================================

                "progress_hooks": [

                    progress_hook(job_id)
                ],

                # =========================================
                # DOWNLOAD SETTINGS
                # =========================================

                "nopart": True,

                "continuedl": True,

                "overwrites": True,

                "noplaylist": True,

                "extract_flat": False,

                # =========================================
                # FORMAT PRIORITY
                # =========================================

                "format_sort": [

                    "res",

                    "codec:h264",

                    "ext:mp4:m4a"
                ],

                # =========================================
                # FINAL FORMAT
                # =========================================

                "merge_output_format": (

                    "mp4"

                    if format_type != "audio"

                    else None
                ),
            })

            # =============================================
            # AUDIO POST PROCESS
            # =============================================

            if format_type == "audio":

                opts["postprocessors"] = [{

                    "key":
                    "FFmpegExtractAudio",

                    "preferredcodec":
                    "mp3",

                    "preferredquality":
                    "192",
                }]

            # =============================================
            # DOWNLOAD
            # =============================================

            with yt_dlp.YoutubeDL(opts) as ydl:

                ydl.download([url])

            # =============================================
            # FIND FILE
            # =============================================

            final_file = find_downloaded_file(

                job_id,

                ".mp3"

                if format_type == "audio"

                else ".mp4"
            )

            if not final_file:

                raise Exception(
                    "Downloaded file not found"
                )

            # =============================================
            # SUCCESS
            # =============================================

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

            return

        except Exception as e:

            err = re.sub(

                r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])",

                "",

                str(e)
            )

            print(
                f"[download strategy failed] "
                f"{err}"
            )

            last_error = err

            time.sleep(1)

    # =====================================================
    # FAILED
    # =====================================================

    redis_client.hset(

        f"job:{job_id}",

        mapping={

            "status":
            "failed",

            "error":
            last_error or "Download failed",
        }
    )

    print(
        f"[download failed] "
        f"{last_error}"
    )