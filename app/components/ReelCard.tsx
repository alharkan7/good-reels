'use client';

import Image from 'next/image';
import { Article, Track, ReelStyle } from '@/app/lib/types';
import { MOTION_PRESETS, FILTER_PRESETS } from '@/app/lib/variety';
import ReelOverlay from './ReelOverlay';
import MusicIndicator from './MusicIndicator';

interface ReelCardProps {
  article: Article;
  style: ReelStyle;
  track: Track | null;
  isActive: boolean;
  isMusicPlaying: boolean;
  isPriority: boolean;
  actionBar: React.ReactNode;
}

export default function ReelCard({
  article,
  style,
  track,
  isActive,
  isMusicPlaying,
  isPriority,
  actionBar,
}: ReelCardProps) {
  const motion = MOTION_PRESETS[style.motionPreset];
  const filter = FILTER_PRESETS[style.filterPreset];

  return (
    <div className="reel-card bg-black">
      {/* Background image with Ken Burns + filter */}
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

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 reel-overlay-gradient z-[5]" />

      {/* Action bar on right */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-5">
        {actionBar}
      </div>

      {/* Text overlay at bottom */}
      <div className="relative z-10 h-full flex flex-col justify-end">
        <ReelOverlay
          title={article.title}
          summary={article.summary}
          articleUrl={article.articleUrl}
        />
        <div className="px-5 pb-5">
          <MusicIndicator track={track} isPlaying={isActive && isMusicPlaying} />
        </div>
      </div>
    </div>
  );
}
