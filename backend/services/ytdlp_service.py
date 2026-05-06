import yt_dlp
import os
import re
import time
import shutil
from services.redis_service import redis_client
from yt_dlp.networking.impersonate import ImpersonateTarget

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Cookie Setup — copies read-only secret to writable location
# ---------------------------------------------------------------------------
def _init_cookies() -> str | None:
    writable = os.path.join(DOWNLOAD_DIR, "yt_cookies.txt")

    # Already copied and ready
    if os.path.isfile(writable) and os.path.getsize(writable) > 100:
        print(f"[cookies] ✅ Using cached cookies ({os.path.getsize(writable)} bytes)")
        return writable

    # Copy from Render Secret File (read-only) → writable downloads dir
    env_path = os.environ.get("YT_COOKIES_FILE", "").strip()
    if env_path and os.path.isfile(env_path):
        try:
            shutil.copy2(env_path, writable)
            print(f"[cookies] ✅ Copied {env_path} → {writable} ({os.path.getsize(writable)} bytes)")
            return writable
        except Exception as e:
            print(f"[cookies] ❌ Copy failed: {e}")

    # Raw cookie text in env var
    content = os.environ.get("YT_COOKIES_CONTENT", "").strip()
    if content:
        try:
            with open(writable, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"[cookies] ✅ Written from env var ({os.path.getsize(writable)} bytes)")
            return writable
        except Exception as e:
            print(f"[cookies] ❌ Write failed: {e}")

    # Local dev fallback
    for p in ["cookies.txt", os.path.join(os.getcwd(), "cookies.txt")]:
        if os.path.isfile(p):
            print(f"[cookies] ✅ Using local {p}")
            return p

    print("[cookies] ⚠️  No cookies — YouTube will block this IP!")
    return None

_COOKIES_FILE: str | None = _init_cookies()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _base_opts(extra: dict | None = None) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "source_address": "0.0.0.0",
        "impersonate": ImpersonateTarget(client="chrome"),
        "force_ipv4": True,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
        "sleep_interval": 1,
        "max_sleep_interval": 3,
        "ratelimit": 8_000_000,
    }
    if extra:
        opts.update(extra)
    return opts


def _yt_opts(base: dict, is_youtube: bool = True) -> dict:
    """Add YouTube-specific options to a base opts dict with client strategies."""
    opts = dict(base)
    
    # Exhaustive strategy list
    attempt_overrides = [
        {},   # Default (ios + web_creator)
        {"extractor_args": {"youtube": {"player_client": ["tv"]}}} if is_youtube else {},
        {"extractor_args": {"youtube": {"player_client": ["android"]}}} if is_youtube else {},
        {"extractor_args": {"youtube": {"player_client": ["web"]}}} if is_youtube else {},
    ]
    
    if _COOKIES_FILE and os.path.isfile(_COOKIES_FILE):
        opts["cookiefile"] = _COOKIES_FILE
    return opts


def _format_str(format_type: str, res: int) -> str:
    """
    Simple, proven format strings. 
    YouTube with web client + cookies returns standard mp4/m4a streams.
    """
    if format_type == "audio":
        return "bestaudio/best"

    # These are the ONLY format strings that reliably work.
    # We try from most specific → least specific.
    # The final "bestvideo+bestaudio/best" ALWAYS succeeds.
    quality_map = {
        2160: (
            "bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]"
            "/bestvideo[height<=2160]+bestaudio"
            "/bestvideo+bestaudio"
            "/best"
        ),
        1080: (
            "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]"
            "/bestvideo[height<=1080]+bestaudio"
            "/bestvideo+bestaudio"
            "/best"
        ),
        720: (
            "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]"
            "/bestvideo[height<=720]+bestaudio"
            "/bestvideo+bestaudio"
            "/best"
        ),
        480: (
            "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]"
            "/bestvideo[height<=480]+bestaudio"
            "/bestvideo+bestaudio"
            "/best"
        ),
    }
    return quality_map.get(res, "bestvideo+bestaudio/best")


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

def extract_metadata(url: str):
    is_youtube = "youtube.com" in url or "youtu.be" in url
    base = _base_opts({"skip_download": True})

    # Strategies to try in order
    # Since cookies are working, 'web' is the best choice for formats.
    strategies = [
        {"extractor_args": {"youtube": {"player_client": ["web"]}}},
        {"extractor_args": {"youtube": {"player_client": ["ios", "web_creator"]}}},
        {"extractor_args": {"youtube": {"player_client": ["tv_embedded"]}}},
    ] if is_youtube else [{}]

    last_error = None
    for strategy in strategies:
        opts = {**base, **strategy}
        if _COOKIES_FILE and os.path.isfile(_COOKIES_FILE):
            opts["cookiefile"] = _COOKIES_FILE
        
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                formats = []
                for f in info.get("formats", []):
                    if f.get("vcodec") != "none" and f.get("height"):
                        formats.append({
                            "format_id": f.get("format_id"),
                            "resolution": f.get("format_note", f"{f.get('height')}p"),
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
                    "title": info.get("title", "Unknown Title"),
                    "thumbnail": info.get("thumbnail", ""),
                    "duration": info.get("duration", 0),
                    "channel": info.get("uploader", ""),
                    "views": info.get("view_count", 0),
                    "formats": formats,
                    "platform": info.get("extractor_key", ""),
                }
        except Exception as e:
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e))
            print(f"[extract_metadata] strategy failed: {last_error}")
            if "sign in" not in last_error.lower() and "bot" not in last_error.lower():
                break # if it's not a bot error, stop trying strategies

    raise Exception(last_error or "Extraction failed")


# ---------------------------------------------------------------------------
# Download helpers
# ---------------------------------------------------------------------------

def cleanup_downloads():
    if not os.path.exists(DOWNLOAD_DIR):
        return
    for name in os.listdir(DOWNLOAD_DIR):
        if name == "yt_cookies.txt":
            continue  # never delete cookies
        path = os.path.join(DOWNLOAD_DIR, name)
        try:
            if os.path.isfile(path):
                os.remove(path)
            elif os.path.isdir(path):
                shutil.rmtree(path)
        except Exception as e:
            print(f"[cleanup] {name}: {e}")


def _progress_hook(job_id: str):
    def hook(d):
        try:
            if d["status"] == "downloading":
                raw = d.get("_percent_str", "0%")
                clean = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", raw)
                redis_client.hset(f"job:{job_id}", "progress",
                                  str(float(clean.replace("%", "").strip())))
            elif d["status"] == "finished":
                redis_client.hset(f"job:{job_id}", "progress", "99")
        except Exception:
            pass
    return hook


def _find_downloaded_file(job_id: str, expected_ext: str) -> str | None:
    for p in [
        os.path.join(DOWNLOAD_DIR, f"{job_id}_raw.{expected_ext}"),
        os.path.join(DOWNLOAD_DIR, f"{job_id}_raw.temp.{expected_ext}"),
        os.path.join(DOWNLOAD_DIR, f"{job_id}_raw"),
    ]:
        if os.path.exists(p):
            return p
    for name in os.listdir(DOWNLOAD_DIR):
        if name.startswith(f"{job_id}_raw") and not name.endswith(".part"):
            return os.path.join(DOWNLOAD_DIR, name)
    return None


# ---------------------------------------------------------------------------
# Main download task
# ---------------------------------------------------------------------------

def download_video_task(job_id: str, url: str, format_type: str, quality: str):
    cleanup_downloads()

    # Re-init cookies if lost after cleanup
    global _COOKIES_FILE
    if not _COOKIES_FILE or not os.path.isfile(_COOKIES_FILE):
        _COOKIES_FILE = _init_cookies()

    is_youtube = "youtube.com" in url or "youtu.be" in url
    res = {"4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}.get(quality.lower(), 1080)
    ext = "mp3" if format_type == "audio" else "mp4"
    final_path = os.path.join(DOWNLOAD_DIR, f"{job_id}.{ext}")
    fmt = _format_str(format_type, res)

    print(f"[download] format_type={format_type} quality={quality} res={res}")
    print(f"[download] format string: {fmt}")
    print(f"[download] cookies: {'✅ ' + _COOKIES_FILE if _COOKIES_FILE else '❌ none'}")

    base_opts = _base_opts({
        "quiet": False,
        "format": fmt,
        "outtmpl": os.path.join(DOWNLOAD_DIR, f"{job_id}_raw.%(ext)s"),
        "progress_hooks": [_progress_hook(job_id)],
        "nocheckcertificate": True,
        "concurrent_fragment_downloads": 4,
        "buffersize": 1024 * 1024,
        "socket_timeout": 30,
        "impersonate": ImpersonateTarget(client="chrome"),
        "force_ipv4": True,
        "merge_output_format": "mp4" if format_type != "audio" else None,
        "nopart": True,
        "fixup": "warn",
        "updatetime": False,
        "continuedl": True,
        "retries": 10,
        "fragment_retries": 10,
        "ignoreerrors": False,
        "postprocessors": (
            [{"key": "FFmpegExtractAudio",
              "preferredcodec": "mp3", "preferredquality": "192"}]
            if format_type == "audio" else []
        ),
    })

    strategies = [
        {"extractor_args": {"youtube": {"player_client": ["web"]}}},
        {"extractor_args": {"youtube": {"player_client": ["ios", "web_creator"]}}},
        {"extractor_args": {"youtube": {"player_client": ["tv_embedded"]}}},
    ] if is_youtube else [{}]

    success = False
    last_error = None

    for strategy in strategies:
        opts = {**base_opts, **strategy}
        if _COOKIES_FILE and os.path.isfile(_COOKIES_FILE):
            opts["cookiefile"] = _COOKIES_FILE

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                for retry in range(3):
                    try:
                        ydl.extract_info(url, download=True)
                        break
                    except Exception as e:
                        if "WinError 32" in str(e) and retry < 2:
                            time.sleep(5)
                        else:
                            raise

            time.sleep(2)
            dl_file = _find_downloaded_file(job_id, "mp3" if format_type == "audio" else "mp4")

            if dl_file:
                for _ in range(15):
                    try:
                        if os.path.exists(final_path):
                            os.remove(final_path)
                        shutil.move(dl_file, final_path)
                        success = True
                        print(f"[download] ✅ {final_path}")
                        break
                    except Exception:
                        time.sleep(1)

            if success:
                # Clean up any leftover temp / part files
                for name in os.listdir(DOWNLOAD_DIR):
                    if job_id in name and name != f"{job_id}.{ext}" and name != "yt_cookies.txt":
                        try:
                            os.remove(os.path.join(DOWNLOAD_DIR, name))
                        except Exception:
                            pass

                redis_client.hset(f"job:{job_id}", mapping={
                    "status": "completed",
                    "progress": "100",
                    "downloadUrl": final_path,
                })
                break # Exit strategy loop on success

        except Exception as e:
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", str(e))
            print(f"[download] strategy failed: {last_error}")
            if "sign in" not in last_error.lower() and "bot" not in last_error.lower():
                break # Not a bot error

    if not success:
        redis_client.hset(f"job:{job_id}", mapping={
            "status": "failed",
            "error": last_error or "Download failed",
        })