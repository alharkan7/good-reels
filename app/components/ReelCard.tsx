'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Article, Track, ReelStyle } from '@/app/lib/types';
import { MOTION_PRESETS, FILTER_PRESETS } from '@/app/lib/variety';
import MusicIndicator from './MusicIndicator';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { ExternalLink, Search } from 'lucide-react';

interface ReelCardProps {
  article: Article;
  style: ReelStyle;
  track: Track | null;
  isActive: boolean;
  isMusicPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  isPriority: boolean;
  actionBar: React.ReactNode;
  onSearch?: () => void;
}

export default function ReelCard({
  article,
  style,
  track,
  isActive,
  isMusicPlaying,
  isMuted,
  onToggleMute,
  isPriority,
  actionBar,
  onSearch,
}: ReelCardProps) {
  const motion = MOTION_PRESETS[style.motionPreset];
  const filter = FILTER_PRESETS[style.filterPreset];
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [article.summary]);

  const effectiveExpanded = expanded && isActive;

  // Pinch-to-zoom state
  const [isPinching, setIsPinching] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoomOrigin, setZoomOrigin] = useState({ x: 0, y: 0 });
  const initialTouchDist = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    } else if (touches.length >= 2) {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length >= 2) {
      const center = getTouchCenter(e.touches);
      if (!isPinching && center) {
        setIsPinching(true);
        setZoomLevel(1);
        setPan({ x: 0, y: 0 });
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setZoomOrigin({ x: center.x - rect.left, y: center.y - rect.top });
      }
      
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialTouchDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY) / zoomLevel;
      lastTouchCenter.current = center;
    } else if (isPinching && e.touches.length === 1) {
      lastTouchCenter.current = getTouchCenter(e.touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPinching) return;
    
    if (e.cancelable) e.preventDefault();
    
    const currentCenter = getTouchCenter(e.touches);
    if (currentCenter && lastTouchCenter.current) {
      const dx = currentCenter.x - lastTouchCenter.current.x;
      const dy = currentCenter.y - lastTouchCenter.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastTouchCenter.current = currentCenter;
    }

    if (e.touches.length >= 2 && initialTouchDist.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      setZoomLevel(Math.max(0.2, dist / initialTouchDist.current));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isPinching) return;
    
    if (e.touches.length === 0) {
      setIsPinching(false);
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
      initialTouchDist.current = null;
      lastTouchCenter.current = null;
    } else if (e.touches.length > 0) {
      lastTouchCenter.current = getTouchCenter(e.touches);
      if (e.touches.length < 2) {
        initialTouchDist.current = null;
      } else {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialTouchDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY) / zoomLevel;
      }
    }
  };

  const handleTextTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTruncated || effectiveExpanded) {
      setExpanded((v) => !v);
    }
  }, [isTruncated, effectiveExpanded]);

  return (
    <div 
      className="reel-card bg-black relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: isPinching ? `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` : 'translate(0px, 0px) scale(1)',
          transformOrigin: `${zoomOrigin.x}px ${zoomOrigin.y}px`,
          transition: isPinching ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          zIndex: isPinching ? 60 : 0,
        }}
      >
        <div
          className="reel-image-container pointer-events-auto"
          style={{
            animationName: isActive ? motion.animation : 'none',
            animationDuration: isActive ? `${motion.duration}s` : '0s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationPlayState: isPinching ? 'paused' : 'running',
            filter: filter.css,
          }}
        >
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            style={{ objectFit: isPinching && zoomLevel < 1 ? 'contain' : 'cover' }}
            priority={isPriority}
            sizes="100vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 px-8 text-center border-[12px] border-zinc-950">
            <span className="text-[160px] font-serif leading-none text-white/10 mb-6">W</span>
            <p className="text-white/30 font-mono text-sm">No Image Available</p>
          </div>
        )}
      </div>
      </div>

      {/* Background/Overlay tap toggle for mute (Instagram style) */}
      <div 
        className="absolute inset-0 reel-overlay-gradient z-[5] cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation(); // Avoid triggering feed ref click
          onToggleMute();
        }}
        style={{ opacity: isPinching ? 0 : 1, transition: 'opacity 0.2s ease-out' }}
      />

      {/* Action bar — FIXED position, does not move */}
      <div
        className="absolute right-3 z-20 flex flex-col items-center gap-5"
        style={{ 
          bottom: 'calc(12dvh + 16px)',
          opacity: isPinching ? 0 : 1,
          transition: 'opacity 0.2s ease-out',
          pointerEvents: isPinching ? 'none' : 'auto'
        }}
      >
        {actionBar}
      </div>

      {/* Top right search button */}
      {onSearch && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSearch();
          }}
          className="absolute top-16 right-3 z-30 action-btn flex flex-col items-center gap-1"
          aria-label="Search"
          style={{ opacity: isPinching ? 0 : 1, transition: 'opacity 0.2s ease-out' }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center drop-shadow-md"
            style={{ background: 'var(--action-bg)' }}
          >
            <Search size={22} stroke="white" strokeWidth={2} />
          </div>
        </button>
      )}

      {/* Bottom content area — grows upward from bottom, capped at max */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-5 transition-all flex flex-col justify-end"
        style={{
          ...(effectiveExpanded ? { maxHeight: '55dvh', height: 'auto' } : { height: '28dvh' }),
          opacity: isPinching ? 0 : 1,
          transition: isPinching ? 'opacity 0.2s ease-out' : 'all 300ms ease-out',
          pointerEvents: isPinching ? 'none' : 'auto'
        }}
      >
        {!effectiveExpanded && (
          <h2
            className="text-2xl font-bold text-white mb-1 leading-tight drop-shadow-lg flex-shrink-0 pr-11"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {article.title}
          </h2>
        )}

        {effectiveExpanded ? (
          <>
            <h2
              className="text-2xl font-bold text-white mb-1 leading-tight drop-shadow-lg flex-shrink-0 pr-11"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
            >
              {article.title}
            </h2>
            <div
              className="overflow-y-auto no-scrollbar mt-1 cursor-pointer flex-shrink min-h-0 pr-11"
              style={{ maxHeight: 'calc(55dvh - 160px)' }}
              onClick={handleTextTap}
            >
              <p className="text-[15px] text-white/80 leading-relaxed pb-2">
                {article.summary}
              </p>
            </div>
          </>
        ) : (
          <p
            ref={textRef}
            className="text-[15px] text-white/80 line-clamp-3 leading-relaxed flex-shrink overflow-hidden min-h-0 cursor-pointer pr-11"
            onClick={handleTextTap}
          >
            {article.summary}
          </p>
        )}

        <div className="flex-shrink-0 pt-2 pb-3 flex items-center justify-between gap-4 w-full">
          <a
            href={article.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white/90 transition-colors whitespace-nowrap flex-shrink-0"
            style={{ background: 'var(--accent-chip)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} strokeWidth={2} />
            {lang === 'id' ? 'Baca di Wikipedia' : 'Read on Wikipedia'}
          </a>
          <MusicIndicator
            track={track}
            isPlaying={isActive && isMusicPlaying}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
          />
        </div>
      </div>
    </div>
  );
}
