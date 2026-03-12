'use client';

import { useState, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CategorizationBuckets({ data, lang }: { data: any, lang: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bucket1Items, setBucket1Items] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bucket2Items, setBucket2Items] = useState<any[]>([]);
  const [errorAnimation, setErrorAnimation] = useState(false);

  useEffect(() => {
    if (data.items) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([...data.items].sort(() => Math.random() - 0.5));
    }
  }, [data]);

  const handleSelectBucket = (bucketNumber: number) => {
    if (currentIndex >= items.length) return;

    const currentItem = items[currentIndex];
    if (currentItem.category === bucketNumber) {
      // Correct bucket!
      if (bucketNumber === 1) setBucket1Items((prev) => [...prev, currentItem]);
      else setBucket2Items((prev) => [...prev, currentItem]);
      setCurrentIndex((p) => p + 1);
    } else {
      // Wrong bucket
      setErrorAnimation(true);
      setTimeout(() => setErrorAnimation(false), 500);
    }
  };

  const isDone = currentIndex >= items.length && items.length > 0;

  return (
    <div className="w-full flex flex-col items-center justify-between h-[60dvh]">
      <div className="w-full text-center mb-8">
        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--node-linked)] to-[var(--node-center)]">
          {isDone ? (lang === 'id' ? "Selesai Disortir!" : "Sorted Perfectly!") : (lang === 'id' ? "Kategorisasi" : "Categorize")}
        </h3>
        {!isDone && <p className="text-white/50 text-sm mt-2">{lang === 'id' ? "Sortir item ke dalam keranjang yang benar" : "Sort the item into the correct bucket"}</p>}
      </div>

      {/* Active Item to Sort */}
      <div className="flex-1 flex items-center justify-center w-full perspective-1000 relative">
        {!isDone && items[currentIndex] && (
          <div className={`
            p-6 bg-white border-2 border-white/20 rounded-3xl text-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-10 w-[80%]
            transition-all duration-300 transform font-bold text-black text-xl leading-relaxed
            ${errorAnimation ? 'animate-shake bg-red-100 border-red-500' : ''}
          `}>
            {items[currentIndex].text}
          </div>
        )}
      </div>

      {/* Buckets */}
      <div className="flex w-full gap-4 mt-auto">
        <button
          onClick={() => handleSelectBucket(1)}
          className={`flex-1 min-h-[140px] flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all group
            ${isDone ? 'border-green-500/50 bg-green-500/10' : 'border-[var(--node-linked)]/50 bg-[var(--node-linked)]/10 active:scale-95'}`}
        >
          <span className="text-2xl mb-2 opacity-50 group-hover:opacity-100 transition-opacity">📦</span>
          <span className="text-sm font-bold text-center text-white break-words">{data.category1}</span>
          <span className="text-xs text-white/50 mt-1">{bucket1Items.length} {lang === 'id' ? 'item' : 'items'}</span>
        </button>

        <button
          onClick={() => handleSelectBucket(2)}
          className={`flex-1 min-h-[140px] flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all group
            ${isDone ? 'border-green-500/50 bg-green-500/10' : 'border-[var(--node-center)]/50 bg-[var(--node-center)]/10 active:scale-95'}`}
        >
          <span className="text-2xl mb-2 opacity-50 group-hover:opacity-100 transition-opacity">📥</span>
          <span className="text-sm font-bold text-center text-white break-words">{data.category2}</span>
          <span className="text-xs text-white/50 mt-1">{bucket2Items.length} {lang === 'id' ? 'item' : 'items'}</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
