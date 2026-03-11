'use client';

import { useState, useCallback, useRef } from 'react';
import { LanguageProvider } from '@/app/contexts/LanguageContext';
import { Article } from '@/app/lib/types';
import ReelsFeed from '@/app/components/ReelsFeed';
import LayoutToggle from '@/app/components/LayoutToggle';
import dynamic from 'next/dynamic';
import NetworkLoader from '@/app/components/NetworkLoader';

const NetworkView = dynamic(() => import('@/app/components/NetworkView'), {
  ssr: false,
  loading: () => <NetworkLoader />,
});

export default function Home() {
  const [layoutMode, setLayoutMode] = useState<'reels' | 'network'>('reels');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [injectedArticle, setInjectedArticle] = useState<Article | null>(null);
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [showInfo, setShowInfo] = useState(false);
  const toggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const toggleLang = () => setLang((prev) => (prev === 'id' ? 'en' : 'id'));

  const handleLayoutToggle = useCallback(
    (mode: 'reels' | 'network') => {
      if (toggleTimeoutRef.current) return;
      if (mode === 'network' && !currentArticle) return;
      setLayoutMode(mode);
      toggleTimeoutRef.current = setTimeout(() => {
        toggleTimeoutRef.current = null;
      }, 300);
    },
    [currentArticle]
  );

  const handleNodeClick = useCallback((title: string) => {
    fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { 'Api-User-Agent': 'GoodReels/1.0 (good-reels prototype)' } }
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        const article: Article = {
          id: data.pageid?.toString() || Date.now().toString(),
          title: data.title,
          summary: data.extract || '',
          imageUrl: data.thumbnail?.source || data.originalimage?.source || '',
          imageWidth: data.thumbnail?.width || 800,
          imageHeight: data.thumbnail?.height || 600,
          articleUrl: data.content_urls?.mobile?.page || '',
          extract: data.extract || '',
        };
        setInjectedArticle(article);
        setCurrentArticle(article);
        setLayoutMode('reels');
      })
      .catch(() => {
        window.open(`https://${lang}.m.wikipedia.org/wiki/${encodeURIComponent(title)}`, '_blank');
      });
  }, [lang]);

  const handleArticleChange = useCallback((article: Article) => {
    setCurrentArticle(article);
  }, []);

  return (
    <LanguageProvider lang={lang} setLang={setLang} toggleLang={toggleLang}>
      <main className="relative w-full h-dvh bg-black overflow-hidden relative">
        {/* Top Bar with Icons constrained to desktop max-width */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-[430px] px-4 z-50 flex justify-between items-center pointer-events-none">
        <div 
          className="pointer-events-auto cursor-pointer p-2 rounded-full text-white/60 hover:text-white transition-colors"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
          onClick={() => setShowInfo(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        
        <div 
          className="pointer-events-auto cursor-pointer p-2 rounded-full text-white/60 hover:text-white transition-colors flex items-center justify-center gap-1.5"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
          onClick={toggleLang}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span className="text-xs font-bold uppercase mr-1">{lang}</span>
        </div>
      </div>

      <LayoutToggle
        mode={layoutMode}
        onToggle={handleLayoutToggle}
        disabled={!currentArticle && layoutMode === 'reels'}
      />

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="bg-[#1a1a1a] p-6 rounded-3xl w-full max-w-sm text-white/90 font-mono text-sm border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 relative">
              <h3 className="text-xl font-bold text-white tracking-tight font-sans text-center w-full">Credits</h3>
              <button onClick={() => setShowInfo(false)} className="absolute right-0 text-white/50 hover:text-white p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-2 items-center">
              <span className="text-white/50 text-right">Created by</span>
              <span className="text-white/50 text-center">:</span>
              <a href="https://instagram.com/alhrkn" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline decoration-white/30 underline-offset-4 text-blue-400 font-medium truncate">@alhrkn</a>

              <span className="text-white/50 text-right">Source Code</span>
              <span className="text-white/50 text-center">:</span>
              <a href="https://github.com/alharkan7/good-reels" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline decoration-white/30 underline-offset-4 text-blue-400 font-medium truncate">GitHub Repo</a>

              <span className="text-white/50 text-right">Website</span>
              <span className="text-white/50 text-center">:</span>
              <a href="https://raihankalla.id" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline decoration-white/30 underline-offset-4 text-blue-400 font-medium truncate">raihankalla.id</a>
            </div>
          </div>
        </div>
      )}

      {/* Always mounted — hidden via CSS to preserve scroll state */}
      <div style={{ display: layoutMode === 'reels' ? 'contents' : 'none' }}>
        <ReelsFeed
          onLayoutToggle={() => handleLayoutToggle('network')}
          onArticleChange={handleArticleChange}
          injectedArticle={injectedArticle}
          lang={lang}
        />
      </div>

      {layoutMode === 'network' && (
        <NetworkView
          articleTitle={currentArticle?.title || ''}
          onNodeClick={handleNodeClick}
          onBack={() => setLayoutMode('reels')}
        />
      )}
      </main>
    </LanguageProvider>
  );
}
