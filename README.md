# SnapLoad - Universal Social Video Downloader

## Overview
SnapLoad is a production-ready, full-stack application that allows users to download videos from multiple platforms including YouTube, Instagram, TikTok, Twitter, and more.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: FastAPI, yt-dlp, FFmpeg
- **Deployment**: Docker / Render

## Features
- Real-time download progress tracking
- 4K video support when the source provides it
- Audio extraction
- Support for 1000+ sites (powered by yt-dlp)
- Automatic file cleanup after 1 hour

## YouTube cookies on Render/Docker

Render containers do **not** contain your local Edge/Chrome profile, so yt-dlp must not use browser cookie extraction (`cookiesfrombrowser`, `--cookies-from-browser edge`, etc.). That mode causes errors like:

```text
could not find edge cookies database in "/root/.config/microsoft-edge"
```

Use an exported Netscape `cookies.txt` instead:

1. Export cookies from your own browser with a cookies.txt exporter extension.
2. Keep the file private. Do not commit it to Git and do not paste real cookies in public issues/chats.
3. Configure one of these production options:
   - Render Secret File named `cookies.txt` mounted at `/etc/secrets/cookies.txt`.
   - Environment variable `YT_COOKIES_CONTENT` containing the full Netscape file content.
   - Environment variable `YT_COOKIES_FILE` pointing to a readable Netscape cookies file.
4. Remove any old browser-cookie environment values such as `YT_COOKIES_BROWSER`, `YT_DLP_COOKIES_FROM_BROWSER`, or `COOKIES_FROM_BROWSER`.
5. Redeploy the service.

The backend copies the configured cookies into its downloads directory as `cookies.txt` and protects that file from the hourly cleanup task.

## Disclaimer
For personal use only. Respect copyright laws and terms of service of the respective platforms.
