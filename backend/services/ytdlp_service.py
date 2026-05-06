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
                "[cookies] copied "
                "from render secret"
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
    if os.path.isfile("cookies.txt"):

        try:

            shutil.copy2(
                "cookies.txt",
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
        "No cookies found"
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
                "Chrome/137.0.0.0 "
                "Safari/537.36"
            ),

            "Accept-Language":
            "en-US,en;q=0.9",
        },

        # =================================================
        # FINAL YOUTUBE FIX
        # =================================================

        "extractor_args": {

            "youtube": {

                "player_client": [
                    "web"
                ]
            }
        },

        # IMPORTANT
        # NODE JS RUNTIME
        "js_runtimes": {

            "node": "node"
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
# EXTRACT METADATA
# =========================================================

def extract_metadata(url):

    try:

        # =================================================
        # IMPORTANT
        # DO NOT USE get_common_opts()
        # =================================================

        opts = {

            "quiet": True,

            "skip_download": True,

            "extract_flat": True,

            "nocheckcertificate": True,

            "ignoreerrors": False,

            "http_headers": {

                "User-Agent": (
                    "Mozilla/5.0 "
                    "(Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 "
                    "(KHTML, like Gecko) "
                    "Chrome/137.0.0.0 "
                    "Safari/537.36"
                )
            },

            "js_runtimes": {

                "node": "node"
            },
        }

        # cookies
        if (
            COOKIE_FILE
            and os.path.isfile(COOKIE_FILE)
        ):

            opts["cookiefile"] = COOKIE_FILE

        with yt_dlp.YoutubeDL(opts) as ydl:

            info = ydl.extract_info(
                url,
                download=False
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

                # STATIC SAFE FORMATS
                "formats": [

                    {
                        "format_id":
                        "22",

                        "resolution":
                        "720p",

                        "ext":
                        "mp4",

                        "type":
                        "video",
                    },

                    {
                        "format_id":
                        "18",

                        "resolution":
                        "360p",

                        "ext":
                        "mp4",

                        "type":
                        "video",
                    },

                    {
                        "format_id":
                        "140",

                        "resolution":
                        "audio",

                        "ext":
                        "mp3",

                        "type":
                        "audio",
                    }
                ]
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
    # FINAL SAFE FORMATS
    # =====================================================

    if format_type == "audio":

        fmt = (
            "140/"
            "251/"
            "bestaudio/"
            "best"
        )

    else:

        fmt = (
            "22/"
            "18/"
            "best[ext=mp4]/"
            "best"
        )

    print(
        f"[download] format => "
        f"{fmt}"
    )

    last_error = None

    for client in [

        "web",

        "android",

        "tv_embedded"
    ]:

        try:

            print(
                f"[download] trying => "
                f"{client}"
            )

            opts = get_common_opts()

            opts["extractor_args"] = {

                "youtube": {

                    "player_client": [
                        client
                    ]
                }
            }

            opts.update({

                "format": fmt,

                "format_sort": [
                    "res",
                    "ext:mp4:m4a"
                ],

                "outtmpl":
                output_template,

                "progress_hooks": [
                    progress_hook(job_id)
                ],

                "nopart": True,

                "continuedl": True,

                "overwrites": True,

                "noplaylist": True,
            })

            # =================================================
            # AUDIO CONVERT
            # =================================================

            if format_type == "audio":

                opts["postprocessors"] = [{

                    "key":
                    "FFmpegExtractAudio",

                    "preferredcodec":
                    "mp3",

                    "preferredquality":
                    "192",
                }]

            # =================================================
            # DOWNLOAD
            # =================================================

            with yt_dlp.YoutubeDL(opts) as ydl:

                ydl.download([url])

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
                f"[client {client}] "
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