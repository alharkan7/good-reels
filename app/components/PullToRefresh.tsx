'use client';

interface PullToRefreshProps {
  pullDistance: number;
  isRefreshing: boolean;
}

export default function PullToRefresh({
  pullDistance,
  isRefreshing,
}: PullToRefreshProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / 80, 1);

  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: pullDistance === 0 ? 'transform 300ms ease-out' : 'none',
      }}
    >
      <div
        className={`w-10 h-10 rounded-full border-2 border-white/40 border-t-white flex items-center justify-center ${isRefreshing ? 'ptr-spinner' : ''}`}
        style={{
          opacity: progress,
          transform: `rotate(${pullDistance * 3}deg) scale(${0.5 + progress * 0.5})`,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </div>
    </div>
  );
}
