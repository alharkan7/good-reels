'use client';

import { Track } from '@/app/lib/types';
import { VolumeX, Music } from 'lucide-react';

interface MusicIndicatorProps {
  track: Track | null;
  isPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function MusicIndicator({
  track,
  isPlaying,
  isMuted,
  onToggleMute,
}: MusicIndicatorProps) {
  const trackName = track?.name || 'Musik latar';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
      className="flex items-center justify-end gap-1.5 py-1 min-w-0"
      aria-label={isMuted ? 'Unmute music' : 'Mute music'}
    >
      <div className="flex-shrink-0 flex items-center justify-center text-white/80">
        {isMuted ? (
          <VolumeX size={14} strokeWidth={2} />
        ) : (
          <Music size={14} strokeWidth={2} className={isPlaying ? 'animate-pulse' : ''} />
        )}
      </div>
      <div className="overflow-hidden w-full text-right">
        <div className={`text-[12px] truncate ${isMuted ? 'text-white/40 line-through' : 'text-white/80 font-medium'}`}>
          {trackName}
        </div>
      </div>
    </button>
  );
}
