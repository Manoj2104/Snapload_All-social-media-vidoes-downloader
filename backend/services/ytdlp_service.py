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
from typing import Iterable, Any

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


def get_common_opts(
    is_youtube: bool = True,
    is_download: bool = False,
    youtube_clients: list[str] | None = None,
) -> dict:
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

    if is_youtube and youtube_clients:
        opts["extractor_args"] = {"youtube": {"player_client": youtube_clients}}

    if is_youtube and not is_download:
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


def _format_attempts(format_type: str, quality: str) -> list[str]:
    if format_type == "audio":
        return ["ba[ext=m4a]/ba/b", "140/251/bestaudio/best"]

    height = _quality_height(quality)
    if height:
        return [
            f"bv*[height<={height}][ext=mp4]+ba[ext=m4a]/b[height<={height}][ext=mp4]/22/18",
            f"bv*[height<={height}]+ba/b[height<={height}]",
            "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]",
            "bv*+ba/b",
        ]

    return ["bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]", "bv*+ba/b"]

def _youtube_client_profiles(is_youtube: bool) -> list[list[str] | None]:
    if not is_youtube:
        return [None]
    return [
        None,
        ["web"],
        ["mweb", "web"],
        ["ios", "android", "web"],
    ]


def _format_height(format_info: dict[str, Any]) -> int:
    return int(format_info.get("height") or 0)


def _format_tbr(format_info: dict[str, Any]) -> float:
    return float(format_info.get("tbr") or format_info.get("vbr") or format_info.get("abr") or 0)


def _usable_formats(info: dict[str, Any]) -> list[dict[str, Any]]:
    formats = info.get("formats") or []
    usable = []
    for fmt in formats:
        if not fmt.get("format_id"):
            continue
        if fmt.get("vcodec") == "none" and fmt.get("acodec") == "none":
            continue
        if fmt.get("protocol") in {"mhtml", "images"}:
            continue
        usable.append(fmt)
    return usable


def _best_by_quality(formats: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not formats:
        return None
    return sorted(
        formats,
        key=lambda fmt: (_format_height(fmt), _format_tbr(fmt), fmt.get("filesize") or fmt.get("filesize_approx") or 0),
        reverse=True,
    )[0]


def _select_available_format(info: dict[str, Any], format_type: str, quality: str) -> str | None:
    """Pick exact format ids from the actual list returned by YouTube.

    Some videos/accounts return no match for generic selectors like `bv*+ba/b`.
    Selecting an existing format_id avoids the "Requested format is not available"
    loop for videos that only expose a small set of progressive formats.
    """

    formats = _usable_formats(info)
    height = _quality_height(quality)

    audio_formats = [fmt for fmt in formats if fmt.get("acodec") != "none" and fmt.get("vcodec") == "none"]
    video_only_formats = [fmt for fmt in formats if fmt.get("vcodec") != "none" and fmt.get("acodec") == "none"]
    progressive_formats = [fmt for fmt in formats if fmt.get("vcodec") != "none" and fmt.get("acodec") != "none"]

    if format_type == "audio":
        best_audio = _best_by_quality([fmt for fmt in audio_formats if fmt.get("ext") == "m4a"]) or _best_by_quality(audio_formats)
        return str(best_audio["format_id"]) if best_audio else None

    def under_requested(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not height:
            return items
        return [fmt for fmt in items if _format_height(fmt) and _format_height(fmt) <= height]

    video_mp4 = under_requested([fmt for fmt in video_only_formats if fmt.get("ext") == "mp4"])
    best_video = _best_by_quality(video_mp4) or _best_by_quality(under_requested(video_only_formats))
    best_audio = _best_by_quality([fmt for fmt in audio_formats if fmt.get("ext") == "m4a"]) or _best_by_quality(audio_formats)
    if best_video and best_audio:
        return f"{best_video['format_id']}+{best_audio['format_id']}"

    progressive_mp4 = under_requested([fmt for fmt in progressive_formats if fmt.get("ext") == "mp4"])
    best_progressive = _best_by_quality(progressive_mp4) or _best_by_quality(under_requested(progressive_formats))
    if best_progressive:
        return str(best_progressive["format_id"])

    any_progressive = _best_by_quality(progressive_formats)
    if any_progressive:
        return str(any_progressive["format_id"])

    any_video = _best_by_quality(video_only_formats)
    if any_video and best_audio:
        return f"{any_video['format_id']}+{best_audio['format_id']}"

    return None


def _dynamic_format_attempts(url: str, is_youtube: bool, format_type: str, quality: str) -> list[tuple[str, list[str] | None]]:
    attempts: list[tuple[str, list[str] | None]] = []
    seen: set[tuple[str, tuple[str, ...]]] = set()

    for clients in _youtube_client_profiles(is_youtube):
        try:
            opts = get_common_opts(is_youtube, is_download=True, youtube_clients=clients)
            opts.update({"skip_download": True, "noplaylist": True, "extract_flat": False})
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)

            if info.get("_type") == "playlist":
                entries = info.get("entries") or []
                info = entries[0] if entries else info

            selected = _select_available_format(info, format_type, quality)
            usable = _usable_formats(info)
            heights = sorted({_format_height(fmt) for fmt in usable if _format_height(fmt)})
            print(
                "[formats] "
                f"clients={clients or 'default'} count={len(usable)} "
                f"heights={heights[-6:]} selected={selected}"
            )
            if selected:
                key = (selected, tuple(clients or []))
                if key not in seen:
                    attempts.append((selected, clients))
                    seen.add(key)
        except Exception as exc:
            print(f"[formats] clients={clients or 'default'} failed: {clean_error(exc)}")

    for clients in _youtube_client_profiles(is_youtube):
        for fmt in _format_attempts(format_type, quality):
            key = (fmt, tuple(clients or []))
            if key not in seen:
                attempts.append((fmt, clients))
                seen.add(key)

    return attempts


def download_video_task(job_id: str, url: str, format_type: str, quality: str) -> None:
    cleanup_downloads()

    global COOKIE_FILE
    if not COOKIE_FILE or not os.path.isfile(COOKIE_FILE):
        COOKIE_FILE = init_cookies()

    extension = ".mp3" if format_type == "audio" else ".mp4"
    output_template = str(DOWNLOAD_DIR / f"{job_id}.%(ext)s")
    youtube = is_youtube_url(url)

    print(f"[download request] type={format_type} quality={quality}")

    last_error = "Download failed"
    attempts = _dynamic_format_attempts(url, youtube, format_type, quality)
    for fmt, youtube_clients in attempts:
        print(f"[download] format => {fmt} clients={youtube_clients or 'default'}")
        try:
            opts = get_common_opts(
                youtube,
                is_download=True,
                youtube_clients=youtube_clients,
            )
            opts.update(
                {
                    "format": fmt,
                    "outtmpl": output_template,
                    "progress_hooks": [progress_hook(job_id)],
                    "nopart": True,
                    "continuedl": True,
                    "overwrites": True,
                    "noplaylist": True,
                    "extract_flat": False,
                }
            )

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

    if "Requested format is not available" in last_error:
        last_error = (
            "This video did not expose downloadable video formats to the server. "
            "Try 480p/720p, MP3, a fresh cookies.txt, or another YouTube URL. "
            f"Last yt-dlp error: {last_error}"
        )

    print(f"[download failed] {last_error}")
    redis_client.hset(
        f"job:{job_id}",
        mapping={"status": "failed", "error": last_error},
    )
