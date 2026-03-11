'use client';

import Image from 'next/image';
import { Article, Track, ReelStyle } from '@/app/lib/types';
import { MOTION_PRESETS, FILTER_PRESETS } from '@/app/lib/variety';
import MusicIndicator from './MusicIndicator';

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

      <div className="absolute inset-0 reel-overlay-gradient z-[5]" />

      <div className="absolute right-3 z-20 flex flex-col items-center gap-5"
        style={{ bottom: 'calc(25dvh + 16px)' }}
      >
        {actionBar}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pr-16"
        style={{ height: '28dvh' }}
      >
        <div className="h-full flex flex-col">
          {/* Title — fixed size */}
          <h2
            className="text-2xl font-bold text-white mb-1 leading-tight drop-shadow-lg flex-shrink-0 mt-auto"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {article.title}
          </h2>
          {/* Summary — takes available space, truncates with overflow */}
          <p className="text-[15px] text-white/80 line-clamp-3 leading-relaxed flex-shrink overflow-hidden min-h-0">
            {article.summary}
          </p>
          {/* Footer — always visible at bottom */}
          <div className="flex-shrink-0 mt-auto pt-2 pb-3 space-y-1">
            <a
              href={article.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white/90 transition-colors"
              style={{ background: 'var(--accent-chip)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Baca di Wikipedia
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
    </div>
  );
}
