import os
import time
import threading
from pathlib import Path

DOWNLOAD_DIR = Path(os.environ.get("DOWNLOAD_DIR", "downloads")).resolve()
EXPIRY_SECONDS = 3600  # 1 hour
PROTECTED_FILENAMES = {"cookies.txt"}


def cleanup_old_files():
    while True:
        try:
            now = time.time()
            if DOWNLOAD_DIR.exists():
                for filepath in DOWNLOAD_DIR.iterdir():
                    if filepath.name in PROTECTED_FILENAMES:
                        continue
                    if filepath.is_file():
                        # check modification time
                        mtime = filepath.stat().st_mtime
                        if now - mtime > EXPIRY_SECONDS:
                            filepath.unlink()
                            print(f"Cleaned up old file: {filepath}")
        except Exception as e:
            print(f"Cleanup error: {e}")

        # Run every 10 minutes
        time.sleep(600)


def start_cleanup_task():
    thread = threading.Thread(target=cleanup_old_files, daemon=True)
    thread.start()
