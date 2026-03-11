'use client';

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
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'var(--accent-like)' : 'none'} stroke={isLiked ? 'var(--accent-like)' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill={isBookmarked ? 'white' : 'none'} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      </button>
    </>
  );
}
