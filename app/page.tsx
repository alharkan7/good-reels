'use client';

import { useState, useCallback, useRef } from 'react';
import { LanguageProvider } from '@/app/contexts/LanguageContext';
import { Article } from '@/app/lib/types';
import ReelsFeed from '@/app/components/ReelsFeed';
import GamesFeed from '@/app/components/GamesFeed';
import LayoutToggle from '@/app/components/LayoutToggle';
import { useArticleBuffer } from '@/app/hooks/useArticleBuffer';
import { Info, Globe, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import NetworkLoader from '@/app/components/NetworkLoader';

const NetworkView = dynamic(() => import('@/app/components/NetworkView'), {
  ssr: false,
  loading: () => <NetworkLoader />,
});

export default function Home() {
  const [layoutMode, setLayoutMode] = useState<'reels' | 'network' | 'games'>('reels');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [injectedArticle, setInjectedArticle] = useState<Article | null>(null);
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [showInfo, setShowInfo] = useState(false);
  const toggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const bufferProps = useArticleBuffer(lang);
  
  const toggleLang = () => setLang((prev) => (prev === 'id' ? 'en' : 'id'));

  const handleLayoutToggle = useCallback(
    (mode: 'reels' | 'network' | 'games') => {
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

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Do not trigger page swipe if touching a game card, cytoscape graph, or interactive element
    if (target.closest('[data-swipe-ignore="true"], canvas, button, a, input, [role="button"], [role="slider"]')) {
      return;
    }
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchStart.x - touchEndX;
    const dy = touchStart.y - touchEndY;

    // Must be a predominantly horizontal swipe of at least 50px
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 50) {
      const modes: ('reels' | 'network' | 'games')[] = ['reels', 'network', 'games'];
      const currentIndex = modes.indexOf(layoutMode);
      
      let nextIndex = dx > 0 ? currentIndex + 1 : currentIndex - 1; // dx > 0 means swiped left
      
      if (nextIndex >= 0 && nextIndex < modes.length) {
        let nextMode = modes[nextIndex];
        // Skip network mode if it's unavailable
        if (nextMode === 'network' && !currentArticle) {
          nextIndex = dx > 0 ? nextIndex + 1 : nextIndex - 1;
          if (nextIndex >= 0 && nextIndex < modes.length) {
            nextMode = modes[nextIndex];
          } else {
            setTouchStart(null);
            return;
          }
        }
        handleLayoutToggle(nextMode);
      }
    }
    setTouchStart(null);
  };

  return (
    <LanguageProvider lang={lang} setLang={setLang} toggleLang={toggleLang}>
      <main 
        className="relative w-full h-dvh bg-black overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Top Bar with Icons constrained to desktop max-width */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-[430px] px-4 z-50 flex justify-between items-center h-[36px] pointer-events-none">
        <div 
          className="pointer-events-auto cursor-pointer p-1 text-white/60 hover:text-white transition-colors drop-shadow-md"
          onClick={() => setShowInfo(true)}
        >
          <Info size={18} strokeWidth={2} />
        </div>
        
        <div 
          className="pointer-events-auto cursor-pointer p-1 text-white/60 hover:text-white transition-colors flex items-center justify-center gap-1 drop-shadow-md"
          onClick={toggleLang}
        >
          <Globe size={18} strokeWidth={2} />
          <span className="text-[10px] font-bold uppercase">{lang}</span>
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
                <X size={20} strokeWidth={2} />
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
          layoutMode={layoutMode}
          {...bufferProps}
        />
      </div>

      <div style={{ display: layoutMode === 'games' ? 'contents' : 'none' }}>
        <GamesFeed
          onLayoutToggle={() => handleLayoutToggle('network')}
          onArticleChange={handleArticleChange}
          lang={lang}
          layoutMode={layoutMode}
          {...bufferProps}
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
