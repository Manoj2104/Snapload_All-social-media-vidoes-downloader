export const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? '/api' 
  : (process.env.NEXT_PUBLIC_API_URL || '/api');

export const api = {
  analyze: async (url: string) => {
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const detail = typeof errorData.detail === 'string' ? errorData.detail.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '') : null;
        throw new Error(detail || `Server Error: ${res.status}`);
      }
      return res.json();
    } catch (err) {
      alert(`DEBUG ERROR: ${err.message}\nAPI_URL: ${API_BASE}/analyze`);
      throw err;
    }
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
