import yt_dlp
from yt_dlp.networking.impersonate import ImpersonateTarget
ydl_opts = {'impersonate': ImpersonateTarget(client='chrome'), 'quiet': True, 'extractor_args': {'youtube': {'player_client': ['tv', 'mweb', 'web']}}}
try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info('https://youtu.be/jZEA2mMwL1k?si=X8enknTT', download=False)
        print('SUCCESS:', info.get('title'))
except Exception as e:
    import traceback
    traceback.print_exc()
