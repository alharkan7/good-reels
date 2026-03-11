'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Track, Article } from '@/app/lib/types';
import { assignReelStyle } from '@/app/lib/variety';
import { useArticleBuffer } from '@/app/hooks/useArticleBuffer';
import { useBackgroundMusic } from '@/app/hooks/useBackgroundMusic';
import { useLocalInteractions } from '@/app/hooks/useLocalInteractions';
import { usePullToRefresh } from '@/app/hooks/usePullToRefresh';
import { useAIChat } from '@/app/hooks/useAIChat';
import ReelCard from './ReelCard';
import ActionBar from './ActionBar';
import CommentSheet from './CommentSheet';
import AIChatSheet from './AIChatSheet';
import PullToRefresh from './PullToRefresh';
import LoadingReel from './LoadingReel';

interface ReelsFeedProps {
  onLayoutToggle: () => void;
  onArticleChange: (article: Article) => void;
}

export default function ReelsFeed({
  onArticleChange,
}: ReelsFeedProps) {
  const {
    articles,
    currentIndex,
    setCurrentIndex,
    isLoading,
    refresh,
  } = useArticleBuffer();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [chatSheetOpen, setChatSheetOpen] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);

  const {
    isLiked,
    toggleLike,
    getLikeCount,
    isBookmarked,
    toggleBookmark,
    getComments,
    addComment,
    isMuted,
    toggleMute,
  } = useLocalInteractions();

  const currentArticle = articles[currentIndex];

  // Fetch tracks
  useEffect(() => {
    fetch('/api/tracks?count=20')
      .then((res) => res.json())
      .then((data: Track[]) => {
        if (Array.isArray(data)) setTracks(data);
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

  const { isPlaying, tryPlay } = useBackgroundMusic(
    currentIndex,
    tracks,
    currentStyle.trackIndex,
    isMuted
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

  // Track current visible reel via Intersection Observer
  useEffect(() => {
    if (!feedRef.current) return;
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
  }, [articles.length, setCurrentIndex]);

  // Notify parent of article change
  useEffect(() => {
    if (currentArticle) {
      onArticleChange(currentArticle);
    }
  }, [currentArticle, onArticleChange]);

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
      // user cancelled share
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
          <div key={article.id} data-index={index}>
            <ReelCard
              article={article}
              style={style}
              track={track}
              isActive={index === currentIndex}
              isMusicPlaying={isPlaying && !isMuted}
              isPriority={index <= currentIndex + 1}
              actionBar={
                <ActionBar
                  articleId={article.id}
                  isLiked={isLiked(article.id)}
                  likeCount={getLikeCount(article.id)}
                  isBookmarked={isBookmarked(article.id)}
                  commentCount={getComments(article.id).length}
                  isMuted={isMuted}
                  onLike={() => toggleLike(article.id)}
                  onBookmark={() => toggleBookmark(article.id)}
                  onComment={() => setCommentSheetOpen(true)}
                  onShare={handleShare}
                  onMuteToggle={toggleMute}
                  onAIChat={() => setChatSheetOpen(true)}
                  articleTitle={article.title}
                  articleUrl={article.articleUrl}
                />
              }
            />
          </div>
        );
      })}

      {(isLoading || articles.length === 0) && <LoadingReel />}

      {/* Comment Sheet */}
      {currentArticle && (
        <CommentSheet
          isOpen={commentSheetOpen}
          onClose={() => setCommentSheetOpen(false)}
          comments={getComments(currentArticle.id)}
          onAddComment={(text) => addComment(currentArticle.id, text)}
        />
      )}

      {/* AI Chat Sheet */}
      {currentArticle && (
        <AIChatSheet
          isOpen={chatSheetOpen}
          onClose={() => setChatSheetOpen(false)}
          messages={chatMessages}
          isStreaming={isChatStreaming}
          onSendMessage={sendChatMessage}
        />
      )}
    </div>
  );
}
