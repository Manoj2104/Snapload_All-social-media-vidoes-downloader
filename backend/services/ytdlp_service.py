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
# Cookie Setup
# ---------------------------------------------------------------------------
# Render Secret Files at /etc/secrets/ are READ-ONLY — we must read them,
# not write to them. We copy the content into our writable DOWNLOAD_DIR once.

def _init_cookies() -> str | None:
    # 1. YT_COOKIES_FILE points to a readable file (e.g. /etc/secrets/cookies.txt)
    env_path = os.environ.get("YT_COOKIES_FILE", "").strip()
    if env_path and os.path.isfile(env_path):
        # Copy from read-only secret location → writable working dir
        writable = os.path.join(DOWNLOAD_DIR, "yt_cookies.txt")
        try:
            shutil.copy2(env_path, writable)
            print(f"[cookies] ✅ Copied {env_path} → {writable} ({os.path.getsize(writable)} bytes)")
            return writable
        except Exception as e:
            print(f"[cookies] ❌ Failed to copy from {env_path}: {e}")

    # 2. YT_COOKIES_CONTENT — raw Netscape cookie text pasted as env var
    content = os.environ.get("YT_COOKIES_CONTENT", "").strip()
    if content:
        writable = os.path.join(DOWNLOAD_DIR, "yt_cookies.txt")
        try:
            with open(writable, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"[cookies] ✅ Written from YT_COOKIES_CONTENT ({os.path.getsize(writable)} bytes)")
            return writable
        except Exception as e:
            print(f"[cookies] ❌ Failed to write YT_COOKIES_CONTENT: {e}")

    # 3. cookies.txt in working directory (local dev)
    cwd = os.path.join(os.getcwd(), "cookies.txt")
    if os.path.isfile(cwd):
        print(f"[cookies] ✅ Found cookies.txt in cwd ({os.path.getsize(cwd)} bytes)")
        return cwd

    print("[cookies] ⚠️  No cookies — YouTube WILL block Render's datacenter IP")
    return None

_COOKIES_FILE: str | None = _init_cookies()

PO_TOKEN     = os.environ.get("YT_PO_TOKEN", "").strip() or None
VISITOR_DATA = os.environ.get("YT_VISITOR_DATA", "").strip() or None

# ---------------------------------------------------------------------------
# Shared helpers
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
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        "sleep_interval": 1,
        "max_sleep_interval": 3,
        "ratelimit": 8_000_000,
    }
    if extra:
        opts.update(extra)
    return opts


def _youtube_strategies() -> list[dict]:
    def _s(label, clients, fmt=None):
        s = {
            "_label": label,
            "_format_override": fmt,
            "extractor_args": {"youtube": {"player_client": clients}},
        }
        if PO_TOKEN:
            s["extractor_args"]["youtube"]["po_token"] = [f"web+{PO_TOKEN}"]
        if VISITOR_DATA:
            s["extractor_args"]["youtube"]["visitor_data"] = VISITOR_DATA
        if _COOKIES_FILE and os.path.isfile(_COOKIES_FILE):
            s["cookiefile"] = _COOKIES_FILE
        return s

    return [
        _s("web (full formats)",                  ["web"]),
        _s("web_creator",                         ["web_creator"]),
        _s("android",                             ["android"]),
        _s("tv_embedded (limited, no bot check)", ["tv_embedded"], fmt="best"),
    ]


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

def extract_metadata(url: str):
    is_youtube = "youtube.com" in url or "youtu.be" in url
    base = _base_opts({"skip_download": True})
    strategies = _youtube_strategies() if is_youtube else [{"_label": "default", "_format_override": None}]

    last_error = None
    for strategy in strategies:
        label = strategy.pop("_label", "default")
        strategy.pop("_format_override", None)
        opts = {**base, **strategy}
        print(f"[metadata] trying: {label} | cookies: {'✅' if _COOKIES_FILE else '❌'}")

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
            raw = str(e)
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", raw)
            print(f"[metadata] {label} failed: {last_error}")
            if not any(k in last_error.lower() for k in ["sign in", "bot", "cookie", "confirm", "permission", "not available"]):
                break

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
                redis_client.hset(f"job:{job_id}", "progress", str(float(clean.replace("%", "").strip())))
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


def _build_format_str(format_type: str, res: int) -> str:
    if format_type == "audio":
        return "bestaudio/best"
    return (
        f"bestvideo[height<={res}][ext=mp4]+bestaudio[ext=m4a]"
        f"/bestvideo[height<={res}]+bestaudio"
        f"/best[height<={res}]"
        f"/best"
    )


# ---------------------------------------------------------------------------
# Main download task
# ---------------------------------------------------------------------------

def download_video_task(job_id: str, url: str, format_type: str, quality: str):
    cleanup_downloads()

    # Re-init cookies in case the file was cleaned up
    global _COOKIES_FILE
    if not _COOKIES_FILE or not os.path.isfile(_COOKIES_FILE):
        _COOKIES_FILE = _init_cookies()

    is_youtube = "youtube.com" in url or "youtu.be" in url
    res = {"4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}.get(quality.lower(), 2160)
    ext = "mp3" if format_type == "audio" else "mp4"
    final_path = os.path.join(DOWNLOAD_DIR, f"{job_id}.{ext}")

    base_dl = _base_opts({
        "quiet": False,
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
            [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
            if format_type == "audio" else []
        ),
    })

    strategies = _youtube_strategies() if is_youtube else [{"_label": "default", "_format_override": None}]
    success = False
    last_error = None

    for strategy in strategies:
        label = strategy.pop("_label", "default")
        fmt_override = strategy.pop("_format_override", None)
        fmt = fmt_override or _build_format_str(format_type, res)
        opts = {**base_dl, **strategy, "format": fmt}

        print(f"[download] {label} | fmt: {fmt[:50]} | cookies: {'✅' if _COOKIES_FILE else '❌'}")

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
                for name in os.listdir(DOWNLOAD_DIR):
                    if job_id in name and name != f"{job_id}.{ext}" and name != "yt_cookies.txt":
                        try:
                            os.remove(os.path.join(DOWNLOAD_DIR, name))
                        except Exception:
                            pass
                redis_client.hset(f"job:{job_id}", mapping={
                    "status": "completed", "progress": "100", "downloadUrl": final_path,
                })
                break

        except Exception as e:
            raw = str(e)
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", raw)
            print(f"[download] {label} failed: {last_error}")
            # Always try next strategy for bot/format errors
            recoverable = ["sign in", "bot", "cookie", "confirm", "permission", "not available", "requested format"]
            if not any(k in last_error.lower() for k in recoverable):
                break

    if not success:
        redis_client.hset(f"job:{job_id}", mapping={
            "status": "failed",
            "error": last_error or "Download failed after all strategies",
        })