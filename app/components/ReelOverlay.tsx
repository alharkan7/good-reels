'use client';

import { useLanguage } from '@/app/contexts/LanguageContext';
import { ExternalLink } from 'lucide-react';

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
  const { lang } = useLanguage();
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
        <ExternalLink size={14} strokeWidth={2} />
        {lang === 'id' ? 'Baca di Wikipedia' : 'Read on Wikipedia'}
      </a>
    </div>
  );
}
