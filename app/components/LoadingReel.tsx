'use client';

export default function LoadingReel() {
  return (
    <div className="reel-card flex items-center justify-center bg-black">
      <div className="absolute inset-0 skeleton-shimmer" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full ptr-spinner" />
        <p className="text-white/60 text-sm">Memuat artikel...</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        <div className="h-5 w-3/4 rounded bg-white/10 skeleton-shimmer" />
        <div className="h-3 w-full rounded bg-white/10 skeleton-shimmer" />
        <div className="h-3 w-5/6 rounded bg-white/10 skeleton-shimmer" />
        <div className="h-3 w-2/3 rounded bg-white/10 skeleton-shimmer" />
      </div>
    </div>
  );
}
