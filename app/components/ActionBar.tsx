'use client';

import { Heart, MessageSquare, Bookmark, Send } from 'lucide-react';

interface ActionBarProps {
  articleId: string;
  isLiked: boolean;
  likeCount: number;
  isBookmarked: boolean;
  commentCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onAIChat: () => void;
  onShare: () => void;
  articleTitle: string;
  articleUrl: string;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function ActionBar({
  isLiked,
  likeCount,
  isBookmarked,
  commentCount,
  onLike,
  onBookmark,
  onAIChat,
  onShare,
}: ActionBarProps) {
  return (
    <>
      {/* Like */}
      <button
        onClick={onLike}
        className="action-btn flex flex-col items-center gap-1"
        aria-label="Like"
      >
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center ${isLiked ? 'like-animate' : ''}`}
          style={{ background: 'var(--action-bg)' }}
        >
          <Heart size={24} fill={isLiked ? 'var(--accent-like)' : 'none'} stroke={isLiked ? 'var(--accent-like)' : 'white'} strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold text-white/80">
          {formatCount(likeCount)}
        </span>
      </button>

      {/* AI Chat (comment icon with "AI" label) */}
      <button
        onClick={onAIChat}
        className="action-btn flex flex-col items-center gap-1"
        aria-label="AI Chat"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center relative"
          style={{ background: 'var(--action-bg)' }}
        >
          <MessageSquare size={22} stroke="white" strokeWidth={2} />
          <span className="absolute text-[8px] font-black" style={{ color: 'var(--ai-sparkle)', top: '15px', letterSpacing: '-0.5px' }}>AI</span>
        </div>
        <span className="text-xs font-semibold text-white/80">
          {commentCount > 0 ? commentCount : ''}
        </span>
      </button>

      {/* Bookmark */}
      <button
        onClick={onBookmark}
        className="action-btn flex flex-col items-center gap-1"
        aria-label="Bookmark"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'var(--action-bg)' }}
        >
          <Bookmark size={22} fill={isBookmarked ? 'white' : 'none'} stroke="white" strokeWidth={2} />
        </div>
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="action-btn flex flex-col items-center gap-1"
        aria-label="Share"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'var(--action-bg)' }}
        >
          <Send size={22} stroke="white" strokeWidth={2} />
        </div>
      </button>
    </>
  );
}
