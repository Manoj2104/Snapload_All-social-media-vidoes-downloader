export const detectPlatform = (url: string) => {
  if (!url) return null;
  
  const patterns = {
    youtube: /youtube\.com|youtu\.be/i,
    instagram: /instagram\.com/i,
    tiktok: /tiktok\.com/i,
    twitter: /twitter\.com|x\.com/i,
    facebook: /facebook\.com|fb\.watch/i,
    reddit: /reddit\.com/i,
    linkedin: /linkedin\.com/i,
    pinterest: /pinterest\.com/i,
    vimeo: /vimeo\.com/i,
    dailymotion: /dailymotion\.com/i,
  };

  for (const [platform, regex] of Object.entries(patterns)) {
    if (regex.test(url)) {
      return platform;
    }
  }
  
  return 'unknown';
};
