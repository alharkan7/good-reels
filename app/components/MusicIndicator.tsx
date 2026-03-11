'use client';

import { Track } from '@/app/lib/types';

interface MusicIndicatorProps {
  track: Track | null;
  isPlaying: boolean;
}

export default function MusicIndicator({
  track,
  isPlaying,
}: MusicIndicatorProps) {
  if (!track) return null;

  return (
    <div className="flex items-center gap-2 mt-3">
      <div
        className={`w-8 h-8 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center flex-shrink-0 ${isPlaying ? 'disc-spinning' : ''}`}
      >
        <div className="w-3 h-3 rounded-full bg-white/60" />
      </div>
      <div className="overflow-hidden max-w-[180px]">
        <div className="text-xs text-white/60 whitespace-nowrap">
          <span className="font-medium text-white/80">♪ {track.name}</span>
          {' — '}
          {track.artist}
        </div>
      </div>
    </div>
  );
}
