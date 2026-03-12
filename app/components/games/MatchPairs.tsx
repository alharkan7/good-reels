'use client';

import { useState, useEffect } from 'react';

export default function MatchPairs({ data, lang }: { data: any, lang: string }) {
  const [lefts, setLefts] = useState<any[]>([]);
  const [rights, setRights] = useState<any[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({}); // maps left ID to right ID
  const [errors, setErrors] = useState<number[]>([]);

  useEffect(() => {
    if (data.pairs) {
      const parsedPairs = data.pairs.map((p: any, i: number) => ({ ...p, id: i }));
      setLefts([...parsedPairs].sort(() => Math.random() - 0.5));
      setRights([...parsedPairs].sort(() => Math.random() - 0.5));
    }
  }, [data]);

  useEffect(() => {
    if (selectedLeft !== null && selectedRight !== null) {
      const l = lefts[selectedLeft];
      const r = rights[selectedRight];
      if (l.id === r.id) {
        // match
        setMatches((prev) => ({ ...prev, [selectedLeft]: selectedRight }));
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        // wrong
        setErrors([selectedLeft, selectedRight]);
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          setErrors([]);
        }, 800);
      }
    }
  }, [selectedLeft, selectedRight, lefts, rights]);

  const allMatched = Object.keys(matches).length === lefts.length && lefts.length > 0;

  return (
    <div className="w-full flex flex-col space-y-6">
      <h3 className="text-xl font-bold text-center text-[var(--node-center)]">
        {allMatched ? (lang === 'id' ? "Cocok!" : "Pairs Matched!") : (lang === 'id' ? "Cocokkan Konsep" : "Match the Concepts")}
      </h3>

      <div className="flex w-full gap-4">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-3">
          {lefts.map((item, i) => {
            const isMatched = matches[i] !== undefined;
            const isSelected = selectedLeft === i;
            const isError = errors[0] === i;

            let bg = "bg-[var(--action-bg)] border-[var(--edge-default)] hover:bg-[var(--accent-chip-hover)]";
            if (isMatched) bg = "bg-green-500/20 border-green-500 text-green-200 opacity-50";
            else if (isError) bg = "bg-red-500/40 border-red-500 text-red-100 animate-pulse";
            else if (isSelected) bg = "bg-[var(--node-linked)]/20 border-[var(--node-linked)] shadow-[0_0_10px_var(--node-linked)]";

            return (
              <button
                key={i}
                disabled={isMatched}
                onClick={() => setSelectedLeft(i)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all min-h-[80px] text-center flex items-center justify-center ${bg}`}
              >
                {item.left}
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col gap-3">
          {rights.map((item, i) => {
            const isMatched = Object.values(matches).includes(i);
            const isSelected = selectedRight === i;
            const isError = errors[1] === i;

            let bg = "bg-[var(--action-bg)] border-[var(--edge-default)] hover:bg-[var(--accent-chip-hover)]";
            if (isMatched) bg = "bg-green-500/20 border-green-500 text-green-200 opacity-50";
            else if (isError) bg = "bg-red-500/40 border-red-500 text-red-100 animate-pulse";
            else if (isSelected) bg = "bg-blue-500/20 border-blue-500 shadow-[0_0_10px_#3b82f6]";

            return (
              <button
                key={i}
                disabled={isMatched}
                onClick={() => setSelectedRight(i)}
                className={`p-3 rounded-xl border text-xs text-white/80 transition-all min-h-[80px] flex items-center justify-center text-center ${bg}`}
              >
                {item.right}
              </button>
            );
          })}
        </div>
      </div>
      {allMatched && (
        <div className="text-green-400 flex items-center justify-center gap-2 font-bold animate-bounce mt-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
          {lang === 'id' ? 'Sempurna!' : 'Perfect!'}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-x-[-1]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
        </div>
      )}
    </div>
  );
}
