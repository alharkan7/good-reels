'use client';

import { Track } from '@/app/lib/types';

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
  const trackArtist = track?.artist || '';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
      className="flex items-center gap-2 py-1"
      aria-label={isMuted ? 'Unmute music' : 'Mute music'}
    >
      <div className="relative flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center ${isPlaying && !isMuted ? 'disc-spinning' : ''}`}
        >
          {isMuted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <div className="w-3 h-3 rounded-full bg-white/60" />
          )}
        </div>
      </div>
      <div className="overflow-hidden max-w-[200px]">
        <div className={`text-xs whitespace-nowrap ${isMuted ? 'text-white/40 line-through' : 'text-white/60'}`}>
          <span className={isMuted ? '' : 'font-medium text-white/80'}>♪ {trackName}</span>
          {trackArtist && ` — ${trackArtist}`}
        </div>
      </div>
    </button>
  );
}
