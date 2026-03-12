'use client';

import { useEffect, useRef, useState } from 'react';
import { Gamepad2, ChevronDown } from 'lucide-react';
import { Article } from '@/app/lib/types';
import GameCard from './GameCard';
import PullToRefresh from './PullToRefresh';

const BUFFER_THRESHOLD = 3;

interface GamesFeedProps {
  articles: Article[];
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
  prependArticle: (article: Article) => void;
  lang: 'id' | 'en';
  layoutMode: 'reels' | 'network' | 'games';
  onLayoutToggle: () => void;
  onArticleChange: (article: Article) => void;
}

export default function GamesFeed({
  articles,
  currentIndex,
  setCurrentIndex,
  isLoading,
  refresh,
  lang,
  layoutMode,
  onArticleChange,
}: GamesFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Minimal pull to refresh for Games Feed just like Reels
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // We could use usePullToRefresh from hooks here, but we pass manual handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) setStartY(e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0) return;
    const y = e.touches[0].clientY;
    const distance = Math.max(0, y - startY);
    if (distance > 0 && window.scrollY <= 0) {
      if (e.cancelable) e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, 150));
    }
  };
  const handleTouchEnd = async () => {
    if (pullDistance > 100) {
      setIsRefreshing(true);
      await refresh();
      setIsRefreshing(false);
    }
    setStartY(0);
    setPullDistance(0);
  };

  const pullHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  useEffect(() => {
    if (!feedRef.current || layoutMode !== 'games') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) {
              setCurrentIndex(idx);
            }
          }
        }
      },
      { root: feedRef.current, threshold: 0.6 }
    );

    const cards = feedRef.current.querySelectorAll('[data-index]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [articles.length, setCurrentIndex, layoutMode]);

  useEffect(() => {
    if (articles[currentIndex]) {
      onArticleChange(articles[currentIndex]);
    }
  }, [currentIndex, articles, onArticleChange]);

  useEffect(() => {
    if (layoutMode === 'games' && feedRef.current) {
      const el = feedRef.current.querySelector(`[data-index="${currentIndex}"]`);
      if (el) {
        el.scrollIntoView();
      }
    }
  }, [layoutMode, currentIndex]); // Auto scroll when mode switches, or index updates externally

  return (
    <div
      ref={feedRef}
      className="reels-feed relative"
      {...pullHandlers}
    >
      <PullToRefresh
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
      />

      {articles.map((article, index) => (
        <div key={`game-${article.id}-${index}`} data-index={index} className="reel-card relative">
          {Math.abs(index - currentIndex) <= 2 && ( // Only render games near current index to save API calls
            <GameCard
              article={article}
              isActive={index === currentIndex}
              lang={lang}
              isGamesMode={layoutMode === 'games'}
            />
          )}
          
          {index === currentIndex && (
            <div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-50 animate-bounce"
              style={{ animationDuration: '2s' }}
            >
              <ChevronDown size={36} className="text-white drop-shadow-md" />
            </div>
          )}
        </div>
      ))}

      {(isLoading || articles.length - currentIndex <= BUFFER_THRESHOLD + 1) && (
        <div className="reel-card flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="w-20 h-20 rounded-full border-4 border-t-[var(--node-linked)] border-r-[var(--node-center)] border-b-[var(--node-hover)] border-l-[var(--toggle-active)] animate-spin flex items-center justify-center">
              <Gamepad2 size={32} strokeWidth={2} className="text-white/80" />
            </div>
            <p className="text-white/60 font-mono text-sm tracking-wider">
              {lang === 'id' ? 'Memuat Game...' : 'Loading Games...'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
