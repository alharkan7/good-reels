'use client';

import { useState, useEffect, useRef } from 'react';
import { Article } from '@/app/lib/types';
import SwipeCards from './games/SwipeCards';
import MatchPairs from './games/MatchPairs';
import TimelineSorter from './games/TimelineSorter';
import CategorizationBuckets from './games/CategorizationBuckets';
import ScratchOff from './games/ScratchOff';

interface GameCardProps {
  article: Article;
  isActive: boolean;
  lang: 'en' | 'id';
  isGamesMode: boolean;
}

export default function GameCard({ article, lang, isGamesMode }: GameCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Game state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [scrambleInput, setScrambleInput] = useState('');
  const [blankInput, setBlankInput] = useState('');

  const fetchedObj = useRef(false);

  useEffect(() => {
    if (!isGamesMode) return;
    if (fetchedObj.current) return;
    fetchedObj.current = true;
    
    fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: article.title, 
        extract: article.extract,
        lang 
      }),
    })
      .then(res => res.json())
      .then(data => {
        setGameData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [article, lang, isGamesMode]);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      
      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
          <div className="w-20 h-20 rounded-full border-4 border-t-[var(--node-linked)] border-r-[var(--node-center)] border-b-[var(--node-hover)] border-l-[var(--toggle-active)] animate-spin flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="12" x2="10" y2="12"></line>
              <line x1="8" y1="10" x2="8" y2="14"></line>
              <line x1="15" y1="13" x2="15.01" y2="13"></line>
              <line x1="18" y1="11" x2="18.01" y2="11"></line>
              <path d="M11.838 5C8.831 4.966 5 6.438 5 10c0 3 1.5 5 2.5 5h.442a1.5 1.5 0 0 0 1.258-.696l1.242-1.928a3 3 0 0 1 5.116 0l1.242 1.928a1.5 1.5 0 0 0 1.258.696h.442c1 0 2.5-2 2.5-5 0-3.562-3.831-5.034-6.838-5Z"></path>
            </svg>
          </div>
          <p className="text-white/60 font-mono text-sm tracking-wider">
            {lang === 'id' ? 'Menyiapkan Game...' : 'Generating Game...'}
          </p>
        </div>
      ) : error || !gameData ? (
        <div className="text-white/50 bg-[var(--sheet-bg)] p-4 rounded-xl backdrop-blur-sm">
          {lang === 'id' ? 'Gagal memuat game.' : 'Failed to load game.'}
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center bg-[var(--sheet-bg)] border border-[var(--edge-default)] p-6 rounded-3xl shadow-2xl mx-4">
          <div className="absolute -top-4 bg-[var(--toggle-active)] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#1C1C1E] shadow-lg">
            {gameData.gameType?.replace('_', ' ')}
          </div>
          
          <h2 className="text-sm font-medium text-white/50 mb-6 text-center uppercase tracking-widest truncate w-full">
            {article.title}
          </h2>

          <div className="w-full flex justify-center">
            {renderGame(lang, gameData, selectedAnswer, setSelectedAnswer, showExplanation, setShowExplanation, scrambleInput, setScrambleInput, blankInput, setBlankInput)}
          </div>
        </div>
      )}
    </div>
  );
}

function renderGame(
  lang: 'en' | 'id',
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any, 
  selectedAnswer: string | null, 
  setSelectedAnswer: (s: string) => void,
  showExplanation: boolean,
  setShowExplanation: (b: boolean) => void,
  scrambleInput: string,
  setScrambleInput: (s: string) => void,
  blankInput: string,
  setBlankInput: (s: string) => void
) {
  const type = data.gameType;

  if (type === 'swipe_cards') return <SwipeCards data={data.swipeCards} lang={lang} />;
  if (type === 'match_pairs') return <MatchPairs data={data.matchPairs} lang={lang} />;
  if (type === 'timeline_sorter') return <TimelineSorter data={data.timelineSorter} lang={lang} />;
  if (type === 'categorization_buckets') return <CategorizationBuckets data={data.categorizationBuckets} lang={lang} />;
  if (type === 'scratch_off') return <ScratchOff data={data.scratchOff} lang={lang} />;

  if (type === 'quiz' && data.quiz) {
    const q = data.quiz;
    return (
      <div className="w-full flex flex-col space-y-4">
        <p className="text-white text-lg font-bold text-center mb-4 leading-relaxed">{q.question}</p>
        <div className="grid gap-3 w-full">
          {q.choices?.map((choice: string, i: number) => {
            const isSelected = selectedAnswer === choice;
            const isCorrect = choice === q.correctAnswer;
            const showStatus = selectedAnswer !== null;
            
            let bgClass = "bg-[var(--action-bg)] hover:bg-[var(--accent-chip-hover)] border-[var(--edge-default)]";
            if (showStatus) {
              if (isCorrect) bgClass = "bg-[var(--node-linked)]/20 border-[var(--node-linked)] text-[var(--node-linked)]";
              else if (isSelected && !isCorrect) bgClass = "bg-[var(--accent-like)]/20 border-[var(--accent-like)] text-[var(--accent-like)]";
              else bgClass = "bg-[var(--action-bg)] opacity-50";
            }

            return (
              <button
                key={i}
                disabled={showStatus}
                onClick={() => setSelectedAnswer(choice)}
                className={`p-4 rounded-xl border text-left text-sm font-medium transition-all w-full text-white ${bgClass}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'true_false' && data.trueFalse) {
    const tf = data.trueFalse;
    return (
      <div className="w-full flex flex-col space-y-6">
        <p className="text-white text-xl font-medium text-center leading-relaxed">
          &quot;{tf.statement}&quot;
        </p>
        <div className="flex gap-4 w-full">
          <button
            disabled={selectedAnswer !== null}
            onClick={() => { setSelectedAnswer('TRUE'); setShowExplanation(true); }}
            className={`flex-1 p-4 rounded-2xl font-bold uppercase transition-all ${selectedAnswer === 'TRUE' ? (tf.isTrue ? 'bg-[var(--node-linked)] text-[#1C1C1E]' : 'bg-[var(--accent-like)] text-white') : 'bg-[var(--action-bg)] text-white border border-[var(--edge-default)] hover:bg-[var(--accent-chip-hover)]'}`}
          >
            {lang === 'id' ? 'Benar' : 'True'}
          </button>
          <button
            disabled={selectedAnswer !== null}
            onClick={() => { setSelectedAnswer('FALSE'); setShowExplanation(true); }}
            className={`flex-1 p-4 rounded-2xl font-bold uppercase transition-all ${selectedAnswer === 'FALSE' ? (!tf.isTrue ? 'bg-[var(--node-linked)] text-[#1C1C1E]' : 'bg-[var(--accent-like)] text-white') : 'bg-[var(--action-bg)] text-white border border-[var(--edge-default)] hover:bg-[var(--accent-chip-hover)]'}`}
          >
            {lang === 'id' ? 'Salah' : 'False'}
          </button>
        </div>
        {showExplanation && (
          <div className="bg-[var(--action-bg)] p-4 rounded-xl text-sm text-white/80 animate-fade-in text-center border border-[var(--edge-default)]">
            {tf.explanation}
          </div>
        )}
      </div>
    );
  }

  if (type === 'word_scramble' && data.wordScramble) {
    const ws = data.wordScramble;
    const isCorrect = scrambleInput.toLowerCase().trim() === (ws.originalWord || '').toLowerCase();
    
    return (
      <div className="w-full flex flex-col space-y-6 items-center">
        <div className="text-4xl font-mono font-black tracking-[0.2em] text-center text-transparent bg-clip-text bg-gradient-to-r from-[var(--node-linked)] to-[var(--node-center)] uppercase">
          {ws.scrambledWord}
        </div>
        <p className="text-white/60 text-sm text-center italic mt-2">{lang === 'id' ? 'Petunjuk' : 'Hint'}: {ws.hint}</p>
        
        <input 
          type="text"
          value={scrambleInput}
          onChange={(e) => setScrambleInput(e.target.value)}
          placeholder={lang === 'id' ? "Susun kata..." : "Unscramble it..."}
          className="w-full bg-[#000000] border-2 border-[var(--edge-default)] rounded-xl p-4 text-center text-white text-lg font-bold outline-none focus:border-[var(--node-linked)] transition-colors"
        />
        
        {scrambleInput.length > 0 && isCorrect && (
          <div className="text-[var(--node-linked)] flex items-center justify-center gap-2 font-bold text-center animate-bounce text-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
            {lang === 'id' ? 'Benar!' : 'Correct!'}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-x-[-1]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
          </div>
        )}
      </div>
    );
  }

  if (type === 'fill_in_the_blank' && data.fillInTheBlank) {
    const fb = data.fillInTheBlank;
    const isCorrect = blankInput.toLowerCase().trim() === (fb.missingWord || '').toLowerCase();
    
    return (
      <div className="w-full flex flex-col space-y-6">
        <p className="text-white text-lg font-medium text-center leading-relaxed">
           {fb.sentenceWithBlank?.replace('___', '__________')}
        </p>
        
        <input 
          type="text"
          value={blankInput}
          onChange={(e) => setBlankInput(e.target.value)}
          placeholder={lang === 'id' ? "Kata yang hilang..." : "Missing word..."}
          className="w-full bg-[#000000] border-2 border-[var(--edge-default)] rounded-xl p-4 text-center text-white text-lg font-bold outline-none focus:border-[var(--node-hover)] transition-colors"
        />
        
        {blankInput.length > 0 && isCorrect && (
          <div className="text-[var(--node-hover)] flex items-center justify-center gap-2 font-bold text-center animate-bounce text-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
            {lang === 'id' ? 'Tepat!' : 'Nailed it!'}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-x-[-1]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M7 5H3" /><path d="M21 17v4" /><path d="M23 19h-4" /></svg>
          </div>
        )}
      </div>
    );
  }

  if (type === 'fun_fact' && data.funFact) {
    const ff = data.funFact;
    return (
      <div className="w-full flex flex-col space-y-6 items-center text-center">
        <div className="flex justify-center mb-1">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/>
            <path d="M9 18h6"/><path d="M10 22h4"/>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--node-hover)] to-[var(--node-center)] mb-2">
          {lang === 'id' ? 'Tahukah Kamu?' : 'Did You Know?'}
        </h3>
        <p className="text-white font-medium text-lg leading-relaxed">
          {ff.fact}
        </p>
        <p className="text-white/60 text-sm bg-[var(--action-bg)] p-4 rounded-xl border border-[var(--edge-default)]">
          {ff.elaboration}
        </p>
      </div>
    );
  }

  return (
    <div className="text-white/60 text-sm">
      {lang === 'id' ? 'Menyiapkan konten interaktif...' : 'Generating interactive content...'}
    </div>
  );
}
