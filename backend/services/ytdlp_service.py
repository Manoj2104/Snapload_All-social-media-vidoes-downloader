"""yt-dlp integration used by the SnapLoad API.

The important production rule here is: use an exported Netscape cookies.txt file
from Render secret files/env vars, never browser cookie extraction. Browser
cookie extraction looks for Chrome/Edge profile databases that do not exist in a
Render container and causes errors like "could not find edge cookies database".
"""

from __future__ import annotations

import os
import re
import shutil
from pathlib import Path
from typing import Iterable

import yt_dlp

from services.redis_service import redis_client

ANSI_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent
DOWNLOAD_DIR = Path(os.environ.get("DOWNLOAD_DIR", BASE_DIR / "downloads")).resolve()
COOKIE_FILE_NAME = "cookies.txt"
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

PROXY = os.environ.get("YT_PROXY", "").strip()

HAS_IMPERSONATE = False
try:
    from yt_dlp.utils.impersonate import IMPERSONATE_TARGETS as _IMPERSONATE_TARGETS

    HAS_IMPERSONATE = bool(_IMPERSONATE_TARGETS)
except ImportError:
    HAS_IMPERSONATE = False


def clean_error(value: object) -> str:
    """Remove ANSI colour codes from yt-dlp errors before returning them to UI."""

    return ANSI_RE.sub("", str(value)).strip()


def is_youtube_url(url: str) -> bool:
    lowered = url.lower()
    return "youtube.com" in lowered or "youtu.be" in lowered


def _normalise_cookie_content(content: str) -> str:
    """Support both real newlines and pasted env values containing literal \\n."""

    content = content.strip()
    if "\n" not in content and "\\n" in content:
        content = content.replace("\\n", "\n")
    return content + "\n"


def _valid_cookie_file(path: Path) -> bool:
    try:
        if not path.is_file() or path.stat().st_size < 20:
            return False
        text = path.read_text(encoding="utf-8", errors="ignore")[:4096]
        return "# Netscape HTTP Cookie File" in text or "\t" in text
    except OSError:
        return False


def _cookie_sources() -> Iterable[Path]:
    env_cookie_file = os.environ.get("YT_COOKIES_FILE", "").strip()
    if env_cookie_file:
        yield Path(env_cookie_file)

    # Render mounts Secret Files at /etc/secrets/<filename>.
    yield Path("/etc/secrets") / COOKIE_FILE_NAME

    # Local development fallbacks.
    yield BASE_DIR / COOKIE_FILE_NAME
    yield PROJECT_DIR / COOKIE_FILE_NAME


def init_cookies() -> str | None:
    """Create a writable cookies.txt copy for yt-dlp and return its path."""

    writable_cookie = DOWNLOAD_DIR / COOKIE_FILE_NAME
    if _valid_cookie_file(writable_cookie):
        print(f"[cookies] loaded: {writable_cookie}")
        return str(writable_cookie)

    env_cookie_content = os.environ.get("YT_COOKIES_CONTENT", "")
    if env_cookie_content.strip():
        try:
            writable_cookie.write_text(
                _normalise_cookie_content(env_cookie_content),
                encoding="utf-8",
            )
            if _valid_cookie_file(writable_cookie):
                print(f"[cookies] loaded from YT_COOKIES_CONTENT: {writable_cookie}")
                return str(writable_cookie)
            writable_cookie.unlink(missing_ok=True)
            print("[cookies] YT_COOKIES_CONTENT is not a valid Netscape cookies.txt file")
        except OSError as exc:
            print(f"[cookies] env content write failed: {exc}")

    for source in _cookie_sources():
        try:
            source = source.expanduser().resolve()
        except OSError:
            continue

        if not _valid_cookie_file(source):
            continue

        if source == writable_cookie:
            return str(writable_cookie)

        try:
            shutil.copy2(source, writable_cookie)
            print(f"[cookies] copied from {source}: {writable_cookie}")
            return str(writable_cookie)
        except OSError as exc:
            print(f"[cookies] copy failed from {source}: {exc}")

    print("[cookies] WARNING: no valid cookies.txt found")
    return None


COOKIE_FILE = init_cookies()


def get_common_opts(is_youtube: bool = True, is_download: bool = False) -> dict:
    """Build safe yt-dlp options for metadata and downloads."""

    opts = {
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "ignoreerrors": False,
        "geo_bypass": True,
        "socket_timeout": 120,
        "retries": 20,
        "fragment_retries": 20,
        "extractor_retries": 10,
        "sleep_interval": 1,
        "max_sleep_interval": 3,
        "cached_player_responses": False,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.youtube.com/",
        },
    }

    if HAS_IMPERSONATE:
        opts["impersonate"] = "chrome"

    if is_youtube:
        # Render/YouTube can expose different formats per client. Query multiple
        # clients so videos that fail on the default web client can still expose
        # progressive MP4 or mobile streams.
        opts["extractor_args"] = {
            "youtube": {
                "player_client": ["web", "mweb", "ios", "android"],
            }
        }

        if not is_download:
            opts["youtube_skip_dash_manifest"] = True
            opts["youtube_skip_hls_manifest"] = True

    if COOKIE_FILE and os.path.isfile(COOKIE_FILE):
        opts["cookiefile"] = COOKIE_FILE

    if PROXY:
        opts["proxy"] = PROXY

    return opts


def get_metadata_opts(is_youtube: bool = True) -> dict:
    opts = get_common_opts(is_youtube, is_download=False)
    opts["extract_flat"] = "in_playlist"
    opts["skip_download"] = True
    return opts


def cleanup_downloads() -> None:
    if not DOWNLOAD_DIR.exists():
        return

    for path in DOWNLOAD_DIR.iterdir():
        if path.name == COOKIE_FILE_NAME:
            continue
        try:
            if path.is_file():
                path.unlink()
            elif path.is_dir():
                shutil.rmtree(path)
        except OSError as exc:
            print(f"[cleanup] {exc}")


def progress_hook(job_id: str):
    def hook(d):
        try:
            if d.get("status") == "downloading":
                percent = clean_error(d.get("_percent_str", "0%"))
                value = float(percent.replace("%", "").strip())
                redis_client.hset(
                    f"job:{job_id}",
                    mapping={"status": "processing", "progress": str(value)},
                )
            elif d.get("status") == "finished":
                redis_client.hset(
                    f"job:{job_id}",
                    mapping={"status": "processing", "progress": "99"},
                )
        except Exception:
            pass

    return hook


def extract_metadata(url: str) -> dict:
    youtube = is_youtube_url(url)
    opts = get_metadata_opts(youtube)

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False, process=not youtube)

        if info.get("_type") == "playlist":
            entries = info.get("entries") or []
            info = entries[0] if entries else info

        return {
            "title": info.get("title", "Unknown"),
            "thumbnail": info.get("thumbnail", ""),
            "duration": info.get("duration", 0) or 0,
            "channel": info.get("uploader", ""),
            "views": info.get("view_count", 0) or 0,
            "platform": "YouTube" if youtube else info.get("extractor_key", "Detected Platform"),
            "formats": [
                {"resolution": "4K", "ext": "mp4", "type": "video"},
                {"resolution": "1080p", "ext": "mp4", "type": "video"},
                {"resolution": "720p", "ext": "mp4", "type": "video"},
                {"resolution": "480p", "ext": "mp4", "type": "video"},
                {"resolution": "MP3", "ext": "mp3", "type": "audio"},
            ],
        }
    except Exception as exc:
        err = clean_error(exc)
        print(f"[metadata error] {err}")
        raise Exception(err) from exc


def find_downloaded_file(job_id: str, preferred_extension: str | None = None) -> str | None:
    candidates = [path for path in DOWNLOAD_DIR.iterdir() if path.is_file() and path.name.startswith(job_id)]
    if preferred_extension:
        for path in candidates:
            if path.suffix == preferred_extension:
                return str(path)
    return str(candidates[0]) if candidates else None


def _quality_height(quality: str) -> int | None:
    q = str(quality).lower().replace("p", "").strip()
    if q == "4k":
        return 2160
    return int(q) if q.isdigit() else None


def _format_filesize(fmt: dict) -> int:
    return int(fmt.get("filesize") or fmt.get("filesize_approx") or 0)


def _sort_score(fmt: dict) -> tuple[int, int, int]:
    height = int(fmt.get("height") or 0)
    tbr = int(fmt.get("tbr") or 0)
    return height, tbr, _format_filesize(fmt)


def _dedupe_formats(formats: list[str | None]) -> list[str | None]:
    seen = set()
    result = []
    for fmt in formats:
        marker = "__DEFAULT__" if fmt is None else fmt
        if marker not in seen:
            seen.add(marker)
            result.append(fmt)
    return result


def _pick_format_from_info(info: dict, format_type: str, quality: str) -> str | None:
    """Pick concrete format IDs from extracted metadata before generic fallbacks.

    Some YouTube videos expose only a small/odd set of formats on Render. A
    concrete ID chosen from the actual format list is more reliable than asking
    yt-dlp to solve a strict selector such as 1080p MP4.
    """

    formats = info.get("formats") or []
    if not formats:
        return None

    if format_type == "audio":
        audio_formats = [
            fmt
            for fmt in formats
            if fmt.get("format_id") and fmt.get("acodec") != "none" and fmt.get("vcodec") == "none"
        ]
        if not audio_formats:
            return None
        best_audio = max(audio_formats, key=lambda fmt: (int(fmt.get("abr") or 0), int(fmt.get("tbr") or 0), _format_filesize(fmt)))
        return str(best_audio["format_id"])

    requested_height = _quality_height(quality)
    video_formats = [
        fmt
        for fmt in formats
        if fmt.get("format_id") and fmt.get("vcodec") != "none" and fmt.get("height")
    ]
    if requested_height:
        video_formats = [fmt for fmt in video_formats if int(fmt.get("height") or 0) <= requested_height]

    progressive_mp4 = [
        fmt
        for fmt in video_formats
        if fmt.get("ext") == "mp4" and fmt.get("acodec") != "none"
    ]
    if progressive_mp4:
        return str(max(progressive_mp4, key=_sort_score)["format_id"])

    video_only = [fmt for fmt in video_formats if fmt.get("acodec") == "none"]
    audio_only = [
        fmt
        for fmt in formats
        if fmt.get("format_id") and fmt.get("acodec") != "none" and fmt.get("vcodec") == "none"
    ]
    if video_only and audio_only:
        best_video = max(video_only, key=_sort_score)
        m4a_audio = [fmt for fmt in audio_only if fmt.get("ext") == "m4a"] or audio_only
        best_audio = max(m4a_audio, key=lambda fmt: (int(fmt.get("abr") or 0), int(fmt.get("tbr") or 0), _format_filesize(fmt)))
        return f'{best_video["format_id"]}+{best_audio["format_id"]}'

    any_progressive = [
        fmt
        for fmt in formats
        if fmt.get("format_id") and fmt.get("vcodec") != "none" and fmt.get("acodec") != "none"
    ]
    if any_progressive:
        return str(max(any_progressive, key=_sort_score)["format_id"])

    return None


def _format_attempts(format_type: str, quality: str, info: dict | None = None) -> list[str | None]:
    attempts = []
    if info:
        attempts.append(_pick_format_from_info(info, format_type, quality))

    if format_type == "audio":
        attempts.extend(["ba[ext=m4a]/ba/b", "140/251/bestaudio/best", "bestaudio/best", "best", None])
        return _dedupe_formats(attempts)

    height = _quality_height(quality)
    if height:
        attempts.extend([
            # First try the requested cap, then explicitly fall back to common
            # progressive YouTube MP4 itags before the broad best selectors.
            f"bv*[height<={height}][ext=mp4]+ba[ext=m4a]/b[height<={height}][ext=mp4]/22/18",
            f"bv*[height<={height}]+ba/b[height<={height}]/22/18",
            "22/18",
            "18",
            "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best[ext=mp4]",
            "bv*+ba/b",
            "best",
            None,
        ])
    else:
        attempts.extend(["22/18", "18", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]", "bv*+ba/b", "best", None])

    return _dedupe_formats(attempts)


def download_video_task(job_id: str, url: str, format_type: str, quality: str) -> None:
    cleanup_downloads()

    global COOKIE_FILE
    if not COOKIE_FILE or not os.path.isfile(COOKIE_FILE):
        COOKIE_FILE = init_cookies()

    extension = ".mp3" if format_type == "audio" else ".mp4"
    output_template = str(DOWNLOAD_DIR / f"{job_id}.%(ext)s")
    youtube = is_youtube_url(url)

    print(f"[download request] type={format_type} quality={quality}")

    info = None
    try:
        probe_opts = get_common_opts(youtube, is_download=True)
        probe_opts.update({"skip_download": True, "noplaylist": True, "extract_flat": False})
        with yt_dlp.YoutubeDL(probe_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as exc:
        print(f"[download probe failed] {clean_error(exc)}")

    last_error = "Download failed"
    for fmt in _format_attempts(format_type, quality, info):
        print(f"[download] format => {fmt or 'yt-dlp default'}")
        try:
            opts = get_common_opts(youtube, is_download=True)
            opts.update(
                {
                    "outtmpl": output_template,
                    "progress_hooks": [progress_hook(job_id)],
                    "nopart": True,
                    "continuedl": True,
                    "overwrites": True,
                    "noplaylist": True,
                    "extract_flat": False,
                }
            )
            if fmt:
                opts["format"] = fmt

            if format_type == "audio":
                opts["postprocessors"] = [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ]
            else:
                opts["merge_output_format"] = "mp4"

            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])

            final_file = find_downloaded_file(job_id, extension)
            if not final_file:
                raise Exception("Downloaded file not found")

            redis_client.hset(
                f"job:{job_id}",
                mapping={
                    "status": "completed",
                    "progress": "100",
                    "downloadUrl": final_file,
                },
            )
            print(f"[download completed] {final_file}")
            return
        except Exception as exc:
            last_error = clean_error(exc)
            print(f"[download retry] {last_error}")
            if "Requested format is not available" not in last_error:
                break

    print(f"[download failed] {last_error}")
    redis_client.hset(
        f"job:{job_id}",
        mapping={"status": "failed", "error": last_error},
    )
