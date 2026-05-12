const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = {
  analyze: async (url: string) => {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      // Remove ANSI escape codes from yt-dlp error string
      const detail = typeof errorData.detail === 'string' ? errorData.detail.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '') : null;
      throw new Error(detail || 'Failed to analyze URL');
    }
    return res.json();
  },

  download: async (url: string, format: string, quality: string) => {
    const res = await fetch(`${API_BASE}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format, quality }),
    });
    if (!res.ok) throw new Error('Failed to start download');
    return res.json();
  },

  getStatus: async (jobId: string) => {
    const res = await fetch(`${API_BASE}/status/${jobId}`);
    if (!res.ok) throw new Error('Failed to get status');
    return res.json();
  },
  
  getDownloadUrl: (jobId: string) => `${API_BASE}/download/${jobId}`
};
