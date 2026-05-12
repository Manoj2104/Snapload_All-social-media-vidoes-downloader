'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { detectPlatform } from '../lib/detectPlatform';

export default function UrlInput({ onAnalyze, isLoading }: { onAnalyze: (url: string) => void, isLoading: boolean }) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedUrl = e.clipboardData.getData('text');
    const detected = detectPlatform(pastedUrl);
    setPlatform(detected !== 'unknown' ? detected : null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    const detected = detectPlatform(e.target.value);
    setPlatform(detected !== 'unknown' ? detected : null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative group z-20">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      <div className="relative flex items-center bg-white rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 p-1.5">
        <div className="pl-5 pr-3 text-gray-400">
          <Search size={22} />
        </div>
        <input
          type="url"
          value={url}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="Paste video URL here (YouTube, Instagram, TikTok...)"
          className="w-full bg-transparent text-gray-900 py-4 px-2 outline-none placeholder-gray-400 text-lg font-medium"
          disabled={isLoading}
        />
        <button
          onClick={() => onAnalyze(url)}
          disabled={!url || isLoading}
          className="bg-gray-900 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
        >
          {isLoading ? 'Analyzing...' : 'Download'}
        </button>
      </div>
      {platform && (
        <div className="absolute -bottom-8 left-4 text-sm text-blue-600 font-bold flex items-center gap-1">
          ✓ Detected {platform.charAt(0).toUpperCase() + platform.slice(1)} URL
        </div>
      )}
    </div>
  );
}
