'use client';

import { useState, useEffect } from 'react';

export default function TimelineSorter({ data, lang }: { data: any, lang: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    if (data.events) {
      // shuffle events initially
      const shuffled = [...data.events].sort(() => Math.random() - 0.5);
      setItems(shuffled);
    }
  }, [data]);

  const handleTap = (index: number) => {
    if (isWon) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      // Swap items
      const newItems = [...items];
      const temp = newItems[selectedIndex];
      newItems[selectedIndex] = newItems[index];
      newItems[index] = temp;

      setItems(newItems);
      setSelectedIndex(null);

      // Check win condition
      const won = newItems.every((item, i) => item.order === i + 1);
      if (won) setIsWon(true);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 items-center">
      <h3 className="text-xl font-bold text-center text-[var(--node-hover)] mb-2">
        {isWon ? (lang === 'id' ? "Urutan Benar!" : "Perfect Order!") : (lang === 'id' ? "Urutkan Linimasa" : "Sort the Timeline")}
      </h3>
      <p className="text-sm text-white/50 mb-4">{isWon ? (lang === 'id' ? "Linimasa berhasil diurutkan." : "Timeline correctly sorted.") : (lang === 'id' ? "Ketuk untuk memilih, ketuk lainnya untuk menukar posisi." : "Tap to select, then tap another to swap positions.")}</p>

      <div className="w-full space-y-3 relative">
        {/* Draw timeline vertical line */}
        <div className="absolute left-4 top-4 bottom-4 w-1 bg-[var(--edge-default)] z-0 rounded-full" />

        {items.map((item, index) => {
          const isSelected = selectedIndex === index;

          let bg = "bg-[var(--sheet-bg)] border-[var(--edge-default)]";
          if (isWon) bg = "bg-green-500/20 border-green-500 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
          else if (isSelected) bg = "bg-[var(--node-hover)]/20 border-[var(--node-hover)] shadow-[0_0_10px_var(--node-hover)] translate-y-[-2px]";

          return (
            <div
              key={index}
              onClick={() => handleTap(index)}
              className={`relative z-10 w-full flex items-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${bg}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 transition-colors
                ${isWon ? 'bg-green-500 text-black' : isSelected ? 'bg-[var(--node-hover)] text-black' : 'bg-[var(--action-bg)] text-white/50'}`}>
                {index + 1}
              </div>
              <p className={`text-sm ${isWon ? 'text-white font-medium' : 'text-white/80'}`}>
                {item.text}
              </p>
            </div>
          );
        })}
      </div>

      {isWon && (
        <div className="text-green-400 flex items-center justify-center gap-2 font-bold animate-bounce mt-6 text-2xl">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
          {lang === 'id' ? 'Benar!' : 'Correct!'}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-x-[-1]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
        </div>
      )}
    </div>
  );
}
