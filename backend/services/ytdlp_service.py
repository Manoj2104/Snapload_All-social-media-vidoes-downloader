import yt_dlp
import os
import json
import re
import time
import shutil
from services.redis_service import redis_client
from yt_dlp.networking.impersonate import ImpersonateTarget

DOWNLOAD_DIR = os.path.abspath("downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def extract_metadata(url: str):
    is_youtube = 'youtube.com' in url or 'youtu.be' in url
    
    ydl_opts_base = {
        'quiet': True,
        'skip_download': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'source_address': '0.0.0.0',
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'impersonate': ImpersonateTarget(client='chrome'),
        'js_runtimes': {'node': {}},
    }

    attempts = [{}]

    last_error = None
    for attempt_opts in attempts:
        opts = {**ydl_opts_base, **attempt_opts}
        if is_youtube:
            opts['extractor_args'] = {
                'youtube': {
                    'player_client': ['android', 'ios'],
                    'player_skip': ['webpage', 'configs', 'js']
                }
            }
        
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                formats = []
                if 'formats' in info:
                    for f in info['formats']:
                        if f.get('vcodec') != 'none' and f.get('height'):
                            formats.append({
                                'format_id': f.get('format_id'),
                                'resolution': f.get('format_note', f"{f.get('height')}p"),
                                'ext': f.get('ext'),
                                'type': 'video'
                            })
                        elif f.get('acodec') != 'none' and f.get('vcodec') == 'none':
                            formats.append({
                                'format_id': f.get('format_id'),
                                'resolution': 'audio',
                                'ext': f.get('ext'),
                                'type': 'audio'
                            })
                            
                return {
                    "title": info.get("title", "Unknown Title"),
                    "thumbnail": info.get("thumbnail", ""),
                    "duration": info.get("duration", 0),
                    "channel": info.get("uploader", ""),
                    "views": info.get("view_count", 0),
                    "formats": formats,
                    "platform": info.get("extractor_key", "")
                }
        except Exception as e:
            last_error = str(e)
            last_error = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', last_error)
            print(f"Attempt with {attempt_opts} failed: {last_error}")
            if not any(x in last_error.lower() for x in ["sign in", "bot", "cookie", "lock", "permission"]):
                break

    raise Exception(last_error or "Extraction failed after multiple attempts")


def cleanup_downloads():
    """Removes all files from the downloads directory to keep it clean."""
    if os.path.exists(DOWNLOAD_DIR):
        for f in os.listdir(DOWNLOAD_DIR):
            file_path = os.path.join(DOWNLOAD_DIR, f)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Cleanup error for {f}: {e}")

def download_video_task(job_id: str, url: str, format_type: str, quality: str):
    # Auto-cleanup: Delete old files before starting new download
    cleanup_downloads()
    
    def hook(d):
        if d['status'] == 'downloading':
            try:
                p = d.get('_percent_str', '0%')
                p = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', p)
                percent = float(p.replace('%', ''))
                redis_client.hset(f"job:{job_id}", "progress", str(percent))
            except:
                pass
        elif d['status'] == 'finished':
            redis_client.hset(f"job:{job_id}", "progress", "99")

    res_map = {'4k': 2160, '1080p': 1080, '720p': 720, '480p': 480}
    res = res_map.get(quality.lower(), 2160)

    if format_type == 'audio':
        format_str = 'bestaudio/best'
        ext = 'mp3'
    else:
        format_str = f'bestvideo[height<={res}]+bestaudio/best'
        ext = 'mp4'

    # 🎯 TARGET FILENAMES
    final_file_path = os.path.join(DOWNLOAD_DIR, f"{job_id}.{ext}")
    
    ydl_opts_base = {
        'format': format_str,
        'outtmpl': os.path.join(DOWNLOAD_DIR, f"{job_id}_raw.%(ext)s"),
        'progress_hooks': [hook],
        'quiet': False,
        'nocheckcertificate': True,
        'concurrent_fragment_downloads': 4,
        'ratelimit': 10000000, # 10MB/s limit to avoid detection
        'sleep_interval_fr_base': 1, # Small sleep between fragments
        'buffersize': 1024 * 1024,
        'socket_timeout': 30,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'impersonate': ImpersonateTarget(client='chrome'),
        'js_runtimes': {'node': {}},
        'merge_output_format': 'mp4' if format_type != 'audio' else None,
        'nopart': True,
        'fixup': 'warn',
        'updatetime': False,
        'continuedl': True,
        'retries': 10,
        'fragment_retries': 10,
        'ignoreerrors': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }] if format_type == 'audio' else []
    }

    is_youtube = 'youtube.com' in url or 'youtu.be' in url
    attempts = [{}]

    success = False
    last_error = None

    for attempt in attempts:
        opts = {**ydl_opts_base, **attempt}
        if is_youtube:
            opts['extractor_args'] = {
                'youtube': {
                    'player_client': ['android', 'ios'],
                    'player_skip': ['webpage', 'configs', 'js']
                }
            }
        try:
            print(f"🚀 ATTEMPT DOWNLOAD: {attempt}")
            with yt_dlp.YoutubeDL(opts) as ydl:
                # Wrap extraction in a retry for merger locks
                for retry in range(3):
                    try:
                        ydl.extract_info(url, download=True)
                        break
                    except Exception as e:
                        if "WinError 32" in str(e) and retry < 2:
                            print("🔄 Merger lock detected, waiting to retry...")
                            time.sleep(5)
                            continue
                        raise e

                time.sleep(2) 
                
                downloaded_file = None
                expected_ext = 'mp3' if format_type == 'audio' else 'mp4'
                # Check for various possible output names if merger was messy
                possible_paths = [
                    os.path.join(DOWNLOAD_DIR, f"{job_id}_raw.{expected_ext}"),
                    os.path.join(DOWNLOAD_DIR, f"{job_id}_raw.temp.{expected_ext}"),
                    os.path.join(DOWNLOAD_DIR, f"{job_id}_raw")
                ]
                
                for p in possible_paths:
                    if os.path.exists(p):
                        downloaded_file = p
                        break
                
                if not downloaded_file:
                    # Last resort: scan dir for the job_id
                    for f in os.listdir(DOWNLOAD_DIR):
                        if f.startswith(f"{job_id}_raw") and not f.endswith(".part"):
                            downloaded_file = os.path.join(DOWNLOAD_DIR, f)
                            break
                
                if downloaded_file:
                    for i in range(15): # Increased wait for slow mergers
                        try:
                            if os.path.exists(final_file_path):
                                os.remove(final_file_path)
                            shutil.move(downloaded_file, final_file_path)
                            success = True
                            print(f"✅ FINALIZED: {final_file_path}")
                            break
                        except:
                            time.sleep(1)
            
            if success:
                # Cleanup any leftover .temp or .part files
                for f in os.listdir(DOWNLOAD_DIR):
                    if job_id in f and f != f"{job_id}.{ext}":
                        try: os.remove(os.path.join(DOWNLOAD_DIR, f))
                        except: pass
                
                redis_client.hset(f"job:{job_id}", mapping={
                    "status": "completed",
                    "progress": "100",
                    "downloadUrl": final_file_path
                })
                break
        except Exception as e:
            last_error = str(e)
            print(f"Download error: {last_error}")

    if not success:
        redis_client.hset(f"job:{job_id}", mapping={
            "status": "failed",
            "error": last_error or "Download failed"
        })