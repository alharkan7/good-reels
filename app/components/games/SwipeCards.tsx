'use client';

import { useState } from 'react';

export default function SwipeCards({ data, lang }: { data: any, lang: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [results, setResults] = useState<{ isCorrect: boolean; explanation: string }[]>([]);

  const cards = data.cards || [];

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    if (offsetX > 80) handleSwipe(true); // Right = Fact
    else if (offsetX < -80) handleSwipe(false); // Left = Myth
    setOffsetX(0);
  };

  const handleSwipe = (isFactGuess: boolean) => {
    const card = cards[currentIndex];
    const isCorrect = card.isFact === isFactGuess;
    setResults([...results, { isCorrect, explanation: card.explanation }]);
    setCurrentIndex((prev) => prev + 1);
  };

  if (currentIndex >= cards.length) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    return (
      <div className="flex flex-col space-y-4 text-center items-center w-full">
        <h3 className="text-2xl font-bold text-[var(--node-linked)]">{lang === 'id' ? 'Selesai!' : 'Complete!'}</h3>
        <p className="text-white">{lang === 'id' ? `Kamu menjawab benar ${correctCount} dari ${cards.length}.` : `You got ${correctCount} out of ${cards.length} correct.`}</p>
        <div className="w-full text-left space-y-3 mt-4 overflow-y-auto max-h-[50vh] pr-2">
          {cards.map((c: any, i: number) => (
            <div key={i} className={`p-4 rounded-xl border ${results[i]?.isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
              <span className="font-bold">{c.statement}</span>
              <p className="text-white/70 text-sm mt-2">{c.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  // Calculate drag rotation and opacity
  const rotation = offsetX * 0.1;
  const overlayOpacity = Math.min(Math.abs(offsetX) / 100, 0.8);

  return (
    <div className="w-full flex w-full flex-col space-y-6 items-center">
      <p className="text-white/60 font-medium tracking-wide uppercase text-xs">{lang === 'id' ? 'Geser Kiri = MITOS, Kanan = FAKTA' : 'Swipe Left = MYTH, Right = FACT'}</p>

      <div className="relative w-full aspect-square flex items-center justify-center">
        <div
          className="absolute w-full h-full bg-[var(--sheet-bg)] border-2 border-[var(--edge-default)] rounded-3xl p-6 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing text-center z-10 select-none overflow-hidden"
          style={{
            transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
            transition: offsetX === 0 ? 'transform 0.3s ease-out' : 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Fact/Myth Overlays */}
          {offsetX > 0 && (
            <div className="absolute inset-0 bg-green-500/20 z-0" style={{ opacity: overlayOpacity }} />
          )}
          {offsetX < 0 && (
            <div className="absolute inset-0 bg-red-500/20 z-0" style={{ opacity: overlayOpacity }} />
          )}

          <h2 className="text-xl font-bold text-white relative z-10 leading-relaxed pointer-events-none">
            {offsetX > 80 ? (lang === 'id' ? "FAKTA?" : "FACT?") : offsetX < -80 ? (lang === 'id' ? "MITOS?" : "MYTH?") : card.statement}
          </h2>
        </div>

        {/* Next card preview slightly behind */}
        {currentIndex + 1 < cards.length && (
          <div className="absolute w-[90%] h-[90%] bg-[var(--action-bg)] border-2 border-[var(--edge-default)] rounded-3xl z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
        )}
      </div>

      <div className="flex w-full gap-4">
        <button className="flex-1 py-3 rounded-full font-bold bg-[var(--accent-like)] text-white" onClick={() => handleSwipe(false)}>
          {lang === 'id' ? "MITOS" : "MYTH"}
        </button>
        <button className="flex-1 py-3 rounded-full font-bold bg-[var(--node-linked)] text-black" onClick={() => handleSwipe(true)}>
          {lang === 'id' ? "FAKTA" : "FACT"}
        </button>
      </div>
    </div>
  );
}
