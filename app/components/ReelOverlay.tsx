'use client';

interface ReelOverlayProps {
  title: string;
  summary: string;
  articleUrl: string;
}

export default function ReelOverlay({
  title,
  summary,
  articleUrl,
}: ReelOverlayProps) {
  return (
    <div className="absolute bottom-0 left-0 right-16 z-10 flex flex-col justify-end"
      style={{ height: '30%', padding: '0 20px 20px 20px' }}
    >
      <h2
        className="text-2xl font-bold text-white mb-2 drop-shadow-lg leading-tight"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
      >
        {title}
      </h2>
      <p className="text-base text-white/80 line-clamp-4 mb-4 leading-relaxed">
        {summary}
      </p>
      <a
        href={articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white/90 transition-colors self-start"
        style={{ background: 'var(--accent-chip)' }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = 'var(--accent-chip-hover)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = 'var(--accent-chip)')
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Baca di Wikipedia
      </a>
    </div>
  );
}
