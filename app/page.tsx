'use client';

import { useState, useCallback, useRef } from 'react';
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
  const toggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
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
        window.open(`https://id.m.wikipedia.org/wiki/${encodeURIComponent(title)}`, '_blank');
      });
  }, []);

  const handleArticleChange = useCallback((article: Article) => {
    setCurrentArticle(article);
  }, []);

  return (
    <main className="relative w-full h-dvh bg-black overflow-hidden">
      <LayoutToggle
        mode={layoutMode}
        onToggle={handleLayoutToggle}
        disabled={!currentArticle && layoutMode === 'reels'}
      />

      {/* Always mounted — hidden via CSS to preserve scroll state */}
      <div style={{ display: layoutMode === 'reels' ? 'contents' : 'none' }}>
        <ReelsFeed
          onLayoutToggle={() => handleLayoutToggle('network')}
          onArticleChange={handleArticleChange}
          injectedArticle={injectedArticle}
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
  );
}
