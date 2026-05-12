import os
import time
import threading

DOWNLOAD_DIR = "downloads"
EXPIRY_SECONDS = 3600 # 1 hour

def cleanup_old_files():
    while True:
        try:
            now = time.time()
            if os.path.exists(DOWNLOAD_DIR):
                for filename in os.listdir(DOWNLOAD_DIR):
                    filepath = os.path.join(DOWNLOAD_DIR, filename)
                    if os.path.isfile(filepath):
                        # check modification time
                        mtime = os.path.getmtime(filepath)
                        if now - mtime > EXPIRY_SECONDS:
                            os.remove(filepath)
                            print(f"Cleaned up old file: {filepath}")
        except Exception as e:
            print(f"Cleanup error: {e}")
            
        # Run every 10 minutes
        time.sleep(600)

def start_cleanup_task():
    thread = threading.Thread(target=cleanup_old_files, daemon=True)
    thread.start()
