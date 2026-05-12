const PLATFORMS = [
  {n:'YouTube',c:'#FF0000'},{n:'Instagram',c:'#E4405F'},{n:'TikTok',c:'#000000'},
  {n:'Twitter/X',c:'#1DA1F2'},{n:'Facebook',c:'#1877F2'},{n:'Reddit',c:'#FF4500'},
  {n:'LinkedIn',c:'#0A66C2'},{n:'Pinterest',c:'#BD081C'},{n:'Vimeo',c:'#1AB7EA'},
  {n:'Dailymotion',c:'#0066DC'},{n:'Twitch',c:'#9146FF'},{n:'Rumble',c:'#85C742'},
];
const ITEMS = [...PLATFORMS, ...PLATFORMS];

export default function Marquee() {
  return (
    <div className="overflow-hidden bg-white border-y border-slate-100 py-6">
      <div className="marquee-track flex items-center gap-0 w-max">
        {ITEMS.map((p, i) => (
          <div key={i} className="flex items-center gap-4 px-10 border-r border-slate-100 whitespace-nowrap text-slate-500 text-sm font-semibold group cursor-default">
            <div className="w-2.5 h-2.5 rounded-full ring-4 ring-transparent group-hover:ring-blue-50 transition-all" style={{ background: p.c }} />
            <span className="group-hover:text-blue-700 transition-colors">{p.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
