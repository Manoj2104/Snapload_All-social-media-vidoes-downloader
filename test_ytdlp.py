import sys
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.services.ytdlp_service import extract_metadata, HAS_IMPERSONATE

print(f"Impersonation supported: {HAS_IMPERSONATE}")

url = "https://www.youtube.com/watch?v=eYq7WapuDLU"

try:
    print(f"Testing extraction for: {url}")
    data = extract_metadata(url)
    print("SUCCESS!")
    print(f"Title: {data['title']}")
except Exception as e:
    print(f"FAILED: {e}")
