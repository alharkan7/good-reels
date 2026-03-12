'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Track, Article } from '@/app/lib/types';
import { FALLBACK_TRACKS } from '@/app/lib/fallback-tracks';
import { assignReelStyle } from '@/app/lib/variety';
import { useBackgroundMusic } from '@/app/hooks/useBackgroundMusic';
import { useLocalInteractions } from '@/app/hooks/useLocalInteractions';
import { usePullToRefresh } from '@/app/hooks/usePullToRefresh';
import { useAIChat } from '@/app/hooks/useAIChat';
import ReelCard from './ReelCard';
import ActionBar from './ActionBar';
import AIChatSheet from './AIChatSheet';
import PullToRefresh from './PullToRefresh';
import LoadingReel from './LoadingReel';
import SearchModal from './SearchModal';
import CategoryModal from './CategoryModal';

const BUFFER_THRESHOLD = 3;

interface ReelsFeedProps {
  onLayoutToggle: () => void;
  onArticleChange: (article: Article) => void;
  injectedArticle?: Article | null;
  lang: 'id' | 'en';
  layoutMode: 'reels' | 'network' | 'games';
  articles: Article[];
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
  prependArticle: (article: Article) => void;
  activeCategory: string | null;
  setActiveCategory: (cat: string | null) => void;
}

export default function ReelsFeed({
  onArticleChange,
  injectedArticle,
  layoutMode,
  articles,
  currentIndex,
  setCurrentIndex,
  isLoading,
  refresh,
  prependArticle,
  activeCategory,
  setActiveCategory,
}: ReelsFeedProps) {


  const injectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (injectedArticle && injectedArticle.id !== injectedRef.current) {
      injectedRef.current = injectedArticle.id;
      prependArticle(injectedArticle);
    }
  }, [injectedArticle, prependArticle]);

  const [tracks, setTracks] = useState<Track[]>(FALLBACK_TRACKS);
  const [chatSheetOpen, setChatSheetOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string, searchLang: 'id' | 'en') => {
    const searchRes = await fetch(
      `https://${searchLang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`
    );
    if (!searchRes.ok) throw new Error('Search failed');
    const searchData = await searchRes.json();
    
    if (!searchData[1] || searchData[1].length === 0) {
      throw new Error(searchLang === 'id' ? 'Tidak ada hasil. Coba kata kunci lain.' : 'No results found. Please try another term.');
    }
    const matchTitle = searchData[1][0];

    const summaryRes = await fetch(
      `https://${searchLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(matchTitle)}`,
      { headers: { 'Api-User-Agent': 'GoodReels/1.0 (good-reels prototype)' } }
    );
    if (!summaryRes.ok) throw new Error('Failed to fetch summary');
    const data = await summaryRes.json();

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

    prependArticle(article);
    setCurrentIndex(0);
  };

  const {
    isLiked,
    toggleLike,
    getLikeCount,
    isBookmarked,
    toggleBookmark,
    getComments,
    isMuted,
    toggleMute,
  } = useLocalInteractions();

  const currentArticle = articles[currentIndex];

  useEffect(() => {
    fetch('/api/tracks?count=20')
      .then((res) => res.json())
      .then((data: Track[]) => {
        if (Array.isArray(data) && data.length > 0) setTracks(data);
      })
      .catch(() => {});
  }, []);

  const styles = useMemo(() => {
    if (articles.length === 0) return [];
    const totalTracks = tracks.length || 1;
    const result: ReturnType<typeof assignReelStyle>[] = [];
    for (let i = 0; i < articles.length; i++) {
      const prev = i > 0 ? result[i - 1] : undefined;
      result.push(assignReelStyle(i, totalTracks, prev));
    }
    return result;
  }, [articles, tracks.length]);

  const currentStyle = styles[currentIndex] || {
    motionPreset: 0,
    filterPreset: 0,
    trackIndex: 0,
  };

  const effectiveIsMuted = isMuted || layoutMode !== 'reels';

  const { isPlaying, tryPlay } = useBackgroundMusic(
    currentIndex,
    tracks,
    currentStyle.trackIndex,
    effectiveIsMuted
  );

  const {
    messages: chatMessages,
    sendMessage: sendChatMessage,
    isStreaming: isChatStreaming,
  } = useAIChat(
    currentArticle?.id || '',
    currentArticle?.title || '',
    currentArticle?.extract || ''
  );

  const { pullDistance, isRefreshing, handlers: pullHandlers } =
    usePullToRefresh(feedRef, refresh);

  useEffect(() => {
    if (!feedRef.current || layoutMode !== 'reels') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) {
              setCurrentIndex(idx);
              setChatSheetOpen(false);
            }
          }
        }
      },
      { root: feedRef.current, threshold: 0.6 }
    );

    const cards = feedRef.current.querySelectorAll('[data-index]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [articles.length, setCurrentIndex, layoutMode]);

  useEffect(() => {
    if (currentArticle) {
      onArticleChange(currentArticle);
    }
  }, [currentArticle, onArticleChange]);

  useEffect(() => {
    if (layoutMode === 'reels' && feedRef.current) {
      const el = feedRef.current.querySelector(`[data-index="${currentIndex}"]`);
      if (el) {
        el.scrollIntoView();
      }
    }
  }, [layoutMode, currentIndex]);

  const handleShare = useCallback(async () => {
    if (!currentArticle) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentArticle.title,
          url: currentArticle.articleUrl,
        });
      } else {
        await navigator.clipboard.writeText(currentArticle.articleUrl);
      }
    } catch {
      // user cancelled
    }
  }, [currentArticle]);

  return (
    <div
      ref={feedRef}
      className="reels-feed relative"
      onClick={tryPlay}
      {...pullHandlers}
    >
      <PullToRefresh
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
      />

      {articles.map((article, index) => {
        const style = styles[index] || {
          motionPreset: 0,
          filterPreset: 0,
          trackIndex: 0,
        };
        const track =
          tracks.length > 0
            ? tracks[style.trackIndex % tracks.length]
            : null;

        return (
          <div key={`${article.id}-${index}`} data-index={index}>
            <ReelCard
              article={article}
              style={style}
              track={track}
              isActive={index === currentIndex}
              isMusicPlaying={isPlaying && !effectiveIsMuted}
              isMuted={effectiveIsMuted}
              onToggleMute={() => {
                tryPlay();
                if (!isPlaying && !effectiveIsMuted) {
                  return;
                }
                toggleMute();
              }}
              isPriority={index <= currentIndex + 1}
              actionBar={
                <ActionBar
                  articleId={article.id}
                  isLiked={isLiked(article.id)}
                  likeCount={getLikeCount(article.id)}
                  isBookmarked={isBookmarked(article.id)}
                  commentCount={getComments(article.id).length}
                  onLike={() => toggleLike(article.id)}
                  onBookmark={() => toggleBookmark(article.id)}
                  onAIChat={() => setChatSheetOpen(true)}
                  onSearch={() => setSearchModalOpen(true)}
                  onCategory={() => setCategoryModalOpen(true)}
                  onShare={handleShare}
                  articleTitle={article.title}
                  articleUrl={article.articleUrl}
                />
              }
            />
          </div>
        );
      })}

      {/* Loading indicator at the end of the feed */}
      {(isLoading || articles.length - currentIndex <= BUFFER_THRESHOLD + 1) && (
        <LoadingReel />
      )}

      {currentArticle && (
        <AIChatSheet
          isOpen={chatSheetOpen}
          onClose={() => setChatSheetOpen(false)}
          messages={chatMessages}
          isStreaming={isChatStreaming}
          onSendMessage={sendChatMessage}
        />
      )}

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={handleSearch}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />
    </div>
  );
}
