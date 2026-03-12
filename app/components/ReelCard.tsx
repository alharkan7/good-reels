'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Article, Track, ReelStyle } from '@/app/lib/types';
import { MOTION_PRESETS, FILTER_PRESETS } from '@/app/lib/variety';
import MusicIndicator from './MusicIndicator';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { ExternalLink } from 'lucide-react';

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

  const handleTextTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTruncated || effectiveExpanded) {
      setExpanded((v) => !v);
    }
  }, [isTruncated, effectiveExpanded]);

  return (
    <div className="reel-card bg-black">
      <div
        className="reel-image-container"
        style={{
          animation: isActive
            ? `${motion.animation} ${motion.duration}s ease-in-out infinite alternate`
            : 'none',
          filter: filter.css,
        }}
      >
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          style={{ objectFit: 'cover' }}
          priority={isPriority}
          sizes="100vw"
          unoptimized
        />
      </div>

      {/* Background/Overlay tap toggle for mute (Instagram style) */}
      <div 
        className="absolute inset-0 reel-overlay-gradient z-[5] cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation(); // Avoid triggering feed ref click
          onToggleMute();
        }}
      />

      {/* Action bar — FIXED position, does not move */}
      <div
        className="absolute right-3 z-20 flex flex-col items-center gap-5"
        style={{ bottom: 'calc(25dvh + 16px)' }}
      >
        {actionBar}
      </div>

      {/* Bottom content area — grows upward from bottom, capped at max */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-5 pr-16 transition-all duration-300 ease-out flex flex-col justify-end"
        style={effectiveExpanded
          ? { maxHeight: '55dvh', height: 'auto' }
          : { height: '28dvh' }
        }
      >
        {!effectiveExpanded && (
          <h2
            className="text-2xl font-bold text-white mb-1 leading-tight drop-shadow-lg flex-shrink-0"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {article.title}
          </h2>
        )}

        {effectiveExpanded ? (
          <>
            <h2
              className="text-2xl font-bold text-white mb-1 leading-tight drop-shadow-lg flex-shrink-0"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
            >
              {article.title}
            </h2>
            <div
              className="overflow-y-auto no-scrollbar mt-1 cursor-pointer flex-shrink min-h-0"
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
            className="text-[15px] text-white/80 line-clamp-3 leading-relaxed flex-shrink overflow-hidden min-h-0 cursor-pointer"
            onClick={handleTextTap}
          >
            {article.summary}
          </p>
        )}

        <div className="flex-shrink-0 pt-2 pb-3 space-y-1">
          <a
            href={article.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white/90 transition-colors"
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
