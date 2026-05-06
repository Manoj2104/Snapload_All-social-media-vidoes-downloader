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
# Authentication & Bot Bypass
# ---------------------------------------------------------------------------
COOKIES_FILE = os.environ.get("YT_COOKIES_FILE", "cookies.txt")
COOKIES_CONTENT = os.environ.get("YT_COOKIES_CONTENT")

if COOKIES_CONTENT and not os.path.exists(COOKIES_FILE):
    try:
        with open(COOKIES_FILE, "w", encoding="utf-8") as f:
            f.write(COOKIES_CONTENT)
        print(f"[setup] Created {COOKIES_FILE} from YT_COOKIES_CONTENT")
    except Exception as e:
        print(f"[setup] Failed to write cookies file: {e}")

PO_TOKEN = os.environ.get("YT_PO_TOKEN")
VISITOR_DATA = os.environ.get("YT_VISITOR_DATA")

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


def _apply_cookies(opts: dict) -> dict:
    """Attach cookies file to opts if it exists."""
    if os.path.isfile(COOKIES_FILE):
        opts["cookiefile"] = COOKIES_FILE
        print(f"[auth] Using cookies from {COOKIES_FILE}")
    else:
        print(f"[auth] ⚠️  No cookies file found at '{COOKIES_FILE}' — YouTube may block requests")
    return opts


def _youtube_strategies(base_opts: dict) -> list[dict]:
    """
    Return a list of YouTube strategy overrides, ordered from best to worst.

    KEY INSIGHT:
    - 'web' client returns ALL formats (1080p, 4K, etc.) but needs cookies on datacenter IPs
    - 'ios'/'tv_embedded' bypass bot checks BUT only return limited formats (≤720p)
    - Solution: always try 'web' first (with cookies), fall back to mobile clients
      with a relaxed format string that accepts whatever they offer
    """
    has_cookies = os.path.isfile(COOKIES_FILE)

    strategies = []

    # --- Strategy 1: web client (full format list) + cookies ---
    s1 = {
        "_label": "web+cookies (full formats)",
        "extractor_args": {
            "youtube": {
                "player_client": ["web"],
            }
        },
    }
    if PO_TOKEN:
        s1["extractor_args"]["youtube"]["po_token"] = [f"web+{PO_TOKEN}"]
    if VISITOR_DATA:
        s1["extractor_args"]["youtube"]["visitor_data"] = VISITOR_DATA
    if has_cookies:
        s1["cookiefile"] = COOKIES_FILE
    strategies.append(s1)

    # --- Strategy 2: web_creator client (trusted, often bypasses bot check) ---
    s2 = {
        "_label": "web_creator (trusted client)",
        "extractor_args": {
            "youtube": {
                "player_client": ["web_creator"],
            }
        },
    }
    if has_cookies:
        s2["cookiefile"] = COOKIES_FILE
    strategies.append(s2)

    # --- Strategy 3: android client (mobile, different quota/bot rules) ---
    s3 = {
        "_label": "android (mobile client)",
        "extractor_args": {
            "youtube": {
                "player_client": ["android"],
            }
        },
    }
    if has_cookies:
        s3["cookiefile"] = COOKIES_FILE
    strategies.append(s3)

    # --- Strategy 4: tv_embedded (last resort, limited formats but no bot check) ---
    s4 = {
        "_label": "tv_embedded (no bot check, limited formats)",
        "extractor_args": {
            "youtube": {
                "player_client": ["tv_embedded"],
            }
        },
        # tv_embedded only has progressive formats, so override format to just grab best
        "_format_override": "best",
    }
    strategies.append(s4)

    return strategies


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

def extract_metadata(url: str):
    is_youtube = "youtube.com" in url or "youtu.be" in url
    base = _base_opts({"skip_download": True})

    if is_youtube:
        strategies = _youtube_strategies(base)
    else:
        strategies = [{}]

    last_error = None
    for strategy in strategies:
        label = strategy.pop("_label", "default")
        strategy.pop("_format_override", None)  # not relevant for metadata
        opts = {**base, **strategy}
        print(f"[extract_metadata] trying: {label}")

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
            print(f"[extract_metadata] {label} failed: {last_error}")

            bot_keywords = ["sign in", "bot", "cookie", "lock", "permission", "confirm"]
            if not any(kw in last_error.lower() for kw in bot_keywords):
                break  # Non-bot error – no point retrying

    raise Exception(last_error or "Extraction failed after all attempts")


# ---------------------------------------------------------------------------
# Download helpers
# ---------------------------------------------------------------------------

def cleanup_downloads():
    if not os.path.exists(DOWNLOAD_DIR):
        return
    for name in os.listdir(DOWNLOAD_DIR):
        path = os.path.join(DOWNLOAD_DIR, name)
        try:
            if os.path.isfile(path):
                os.remove(path)
            elif os.path.isdir(path):
                shutil.rmtree(path)
        except Exception as e:
            print(f"[cleanup] error removing {name}: {e}")


def _progress_hook(job_id: str):
    def hook(d):
        try:
            if d["status"] == "downloading":
                raw = d.get("_percent_str", "0%")
                clean = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", raw)
                percent = float(clean.replace("%", "").strip())
                redis_client.hset(f"job:{job_id}", "progress", str(percent))
            elif d["status"] == "finished":
                redis_client.hset(f"job:{job_id}", "progress", "99")
        except Exception:
            pass
    return hook


def _find_downloaded_file(job_id: str, expected_ext: str) -> str | None:
    candidates = [
        os.path.join(DOWNLOAD_DIR, f"{job_id}_raw.{expected_ext}"),
        os.path.join(DOWNLOAD_DIR, f"{job_id}_raw.temp.{expected_ext}"),
        os.path.join(DOWNLOAD_DIR, f"{job_id}_raw"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    for name in os.listdir(DOWNLOAD_DIR):
        if name.startswith(f"{job_id}_raw") and not name.endswith(".part"):
            return os.path.join(DOWNLOAD_DIR, name)
    return None


def _build_format_str(format_type: str, res: int) -> str:
    """
    Build a robust format selection string with 4-level fallback.
    Only used when the strategy does NOT have a _format_override.
    """
    if format_type == "audio":
        return "bestaudio/best"

    # Level 1: mp4 video + m4a audio at desired res (best quality, clean merge)
    # Level 2: any video + audio at desired res
    # Level 3: best single progressive format at desired res
    # Level 4: absolute best (no restriction) — ALWAYS succeeds
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

    is_youtube = "youtube.com" in url or "youtu.be" in url

    res_map = {"4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}
    res = res_map.get(quality.lower(), 2160)
    ext = "mp3" if format_type == "audio" else "mp4"
    final_file_path = os.path.join(DOWNLOAD_DIR, f"{job_id}.{ext}")

    base_dl_opts = _base_opts({
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
            [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }]
            if format_type == "audio"
            else []
        ),
    })

    strategies = _youtube_strategies(base_dl_opts) if is_youtube else [{"_label": "default", "_format_override": None}]

    success = False
    last_error = None

    for strategy in strategies:
        label = strategy.pop("_label", "default")
        format_override = strategy.pop("_format_override", None)

        # Use strategy's format override if present, else build normal format string
        format_str = format_override if format_override else _build_format_str(format_type, res)

        opts = {**base_dl_opts, **strategy, "format": format_str}
        print(f"[download] trying strategy: {label} | format: {format_str[:60]}...")

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                for retry in range(3):
                    try:
                        ydl.extract_info(url, download=True)
                        break
                    except Exception as e:
                        if "WinError 32" in str(e) and retry < 2:
                            print("[download] merger lock, retrying in 5s…")
                            time.sleep(5)
                        else:
                            raise

            time.sleep(2)

            expected_ext = "mp3" if format_type == "audio" else "mp4"
            downloaded_file = _find_downloaded_file(job_id, expected_ext)

            if downloaded_file:
                for _ in range(15):
                    try:
                        if os.path.exists(final_file_path):
                            os.remove(final_file_path)
                        shutil.move(downloaded_file, final_file_path)
                        success = True
                        print(f"[download] ✅ finalized: {final_file_path}")
                        break
                    except Exception:
                        time.sleep(1)

            if success:
                for name in os.listdir(DOWNLOAD_DIR):
                    if job_id in name and name != f"{job_id}.{ext}":
                        try:
                            os.remove(os.path.join(DOWNLOAD_DIR, name))
                        except Exception:
                            pass

                redis_client.hset(f"job:{job_id}", mapping={
                    "status": "completed",
                    "progress": "100",
                    "downloadUrl": final_file_path,
                })
                break

        except Exception as e:
            raw = str(e)
            last_error = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", raw)
            print(f"[download] {label} failed: {last_error}")

            bot_keywords = ["sign in", "bot", "cookie", "confirm", "permission"]
            if not any(kw in last_error.lower() for kw in bot_keywords):
                # Format error — don't keep retrying with same format on different clients
                # BUT do continue if it's a "not available" format issue (try next client)
                if "not available" in last_error.lower() or "requested format" in last_error.lower():
                    print(f"[download] format not available for this client, trying next...")
                    continue
                break

    if not success:
        redis_client.hset(f"job:{job_id}", mapping={
            "status": "failed",
            "error": last_error or "Download failed after all strategies",
        })