'use client';

import { useState, useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ScratchOff({ data, lang }: { data: any, lang: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchedPercent, setScratchedPercent] = useState(0);

  // Parse sentence to highlight the hidden texts dynamically under the canvas
  const fullText = data.fullSentence || "";
  const hiddenWords = data.wordsToHide || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match container
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Fill with modern gradient film
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#4ECDC4');
    gradient.addColorStop(1, '#FF6B35');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text on the scratch-off layer
    ctx.font = 'bold 20px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(lang === 'id' ? 'GOSOK DI SINI' : 'SCRATCH HERE', canvas.width / 2, canvas.height / 2);

  }, [data, lang]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsScratching(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    scratch(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsScratching(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    checkPercent();
  };

  const scratch = (e: React.PointerEvent) => {
    if (!isScratching) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkPercent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const percent = (transparent / (pixels.length / 4)) * 100;
    setScratchedPercent(percent);

    // Auto-reveal if >60%
    if (percent > 60) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setScratchedPercent(100);
    }
  };

  // Helper to render the text with hidden words highlighted
  const renderText = () => {
    if (!hiddenWords.length) return fullText;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parts: any[] = [fullText];
    hiddenWords.forEach((word: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newParts: any[] = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          const split = part.split(new RegExp(`(${word})`, 'gi'));
          newParts.push(...split);
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts.map((part, i) => {
      const isHidden = hiddenWords.some((w: string) => w.toLowerCase() === (typeof part === 'string' ? part.toLowerCase() : ''));
      if (isHidden) {
        return <span key={i} className="text-[var(--node-linked)] font-black text-2xl uppercase tracking-wider">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">{lang === 'id' ? 'Gosok Untuk Melihat' : 'Scratch To Reveal'}</h3>
        <p className="text-white/50 text-sm">{lang === 'id' ? 'Temukan kata kunci yang tersembunyi' : 'Discover the hidden keywords'}</p>
      </div>

      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-[var(--edge-default)] shadow-xl bg-[var(--sheet-bg)] p-8 flex items-center justify-center text-center">
        {/* The revealed text underneath */}
        <p className="text-xl leading-relaxed text-white font-medium select-none pointer-events-none relative z-0">
          {renderText()}
        </p>

        {/* The scratchable canvas on top */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full z-10 touch-none ${scratchedPercent >= 100 ? 'pointer-events-none' : 'cursor-crosshair'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={scratch}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {scratchedPercent >= 100 && (
        <div className="text-green-400 flex items-center justify-center gap-2 font-bold animate-bounce text-xl mt-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
          {lang === 'id' ? 'Terbuka!' : 'Revealed!'}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-x-[-1]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
        </div>
      )}
    </div>
  );
}
