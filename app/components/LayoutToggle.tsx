'use client';

import { Server, Share2, Box } from 'lucide-react';

interface LayoutToggleProps {
  mode: 'reels' | 'network' | 'games';
  onToggle: (mode: 'reels' | 'network' | 'games') => void;
  disabled?: boolean;
}

export default function LayoutToggle({
  mode,
  onToggle,
  disabled,
}: LayoutToggleProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 rounded-full backdrop-blur-md"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      {/* Reels mode */}
      <button
        onClick={() => onToggle('reels')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${mode === 'reels'
            ? 'text-black'
            : 'text-white/60 hover:text-white'
          }`}
        style={{
          background:
            mode === 'reels' ? 'var(--toggle-active)' : 'transparent',
        }}
      >
        <Server size={14} strokeWidth={2} />
        Wiki
      </button>

      {/* Network mode */}
      <button
        onClick={() => onToggle('network')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${mode === 'network'
            ? 'text-black'
            : 'text-white/60 hover:text-white'
          }`}
        style={{
          background:
            mode === 'network' ? 'var(--toggle-active)' : 'transparent',
        }}
      >
        <Share2 size={14} strokeWidth={2} />
        Graph
      </button>

      {/* Games mode */}
      <button
        onClick={() => onToggle('games')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${mode === 'games'
            ? 'text-black'
            : 'text-white/60 hover:text-white'
          }`}
        style={{
          background:
            mode === 'games' ? 'var(--toggle-active)' : 'transparent',
        }}
      >
        <Box size={14} strokeWidth={2} />
        Games
      </button>
    </div>
  );
}
