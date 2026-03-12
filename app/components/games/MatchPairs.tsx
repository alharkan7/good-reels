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
        <div className="text-center font-bold text-green-400 animate-bounce mt-4">
          ✨ {lang === 'id' ? 'Sempurna!' : 'Perfect!'} ✨
        </div>
      )}
    </div>
  );
}
