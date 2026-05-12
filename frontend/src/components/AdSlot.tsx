export default function AdSlot({ type }: { type: 'leaderboard' | 'rectangle' }) {
  if (type === 'leaderboard') {
    return (
      <div className="w-full max-w-[728px] h-[90px] bg-gray-100 border border-gray-200 rounded-xl mx-auto flex items-center justify-center text-gray-400 text-sm my-8 font-semibold uppercase tracking-widest shadow-inner">
        Advertisement
      </div>
    );
  }

  return (
    <div className="w-full max-w-[300px] h-[250px] bg-gray-100 border border-gray-200 rounded-xl mx-auto flex items-center justify-center text-gray-400 text-sm my-8 font-semibold uppercase tracking-widest shadow-inner">
      Advertisement
    </div>
  );
}
