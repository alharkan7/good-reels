'use client';

interface LayoutToggleProps {
  mode: 'reels' | 'network';
  onToggle: (mode: 'reels' | 'network') => void;
  disabled?: boolean;
}

export default function LayoutToggle({
  mode,
  onToggle,
  disabled,
}: LayoutToggleProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-full backdrop-blur-md"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      {/* Reels mode */}
      <button
        onClick={() => onToggle('reels')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
          mode === 'reels'
            ? 'text-black'
            : 'text-white/60 hover:text-white'
        }`}
        style={{
          background:
            mode === 'reels' ? 'var(--toggle-active)' : 'transparent',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
        </svg>
        Reels
      </button>

      {/* Network mode */}
      <button
        onClick={() => onToggle('network')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
          mode === 'network'
            ? 'text-black'
            : 'text-white/60 hover:text-white'
        }`}
        style={{
          background:
            mode === 'network' ? 'var(--toggle-active)' : 'transparent',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="5" r="3" />
          <circle cx="5" cy="19" r="3" />
          <circle cx="19" cy="19" r="3" />
          <line x1="12" y1="8" x2="5" y2="16" />
          <line x1="12" y1="8" x2="19" y2="16" />
        </svg>
        Graph
      </button>
    </div>
  );
}
