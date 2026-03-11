'use client';

export default function NetworkLoader() {
  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-6 fade-in">
      <div className="relative w-20 h-20">
        {/* Center node */}
        <div
          className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 rounded-full pulse-dot"
          style={{ background: 'var(--node-center)' }}
        />
        {/* Orbiting nodes */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <div
            key={deg}
            className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -mt-1.5 -ml-1.5 rounded-full pulse-dot"
            style={{
              background: 'var(--node-linked)',
              transform: `rotate(${deg}deg) translateX(32px)`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
        {/* Connecting lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 80 80"
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x = 40 + 32 * Math.cos(rad);
            const y = 40 + 32 * Math.sin(rad);
            return (
              <line
                key={deg}
                x1="40"
                y1="40"
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
      <p className="text-white/60 text-sm">Memuat jaringan artikel...</p>
    </div>
  );
}
