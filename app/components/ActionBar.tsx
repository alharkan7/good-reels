'use client';

interface ActionBarProps {
  articleId: string;
  isLiked: boolean;
  likeCount: number;
  isBookmarked: boolean;
  commentCount: number;
  isMuted: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onMuteToggle: () => void;
  onAIChat: () => void;
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
  isMuted,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onMuteToggle,
  onAIChat,
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
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isLiked ? 'var(--accent-like)' : 'none'}
            stroke={isLiked ? 'var(--accent-like)' : 'white'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-white/80">
          {formatCount(likeCount)}
        </span>
      </button>

      {/* Comment */}
      <button
        onClick={onComment}
        className="action-btn flex flex-col items-center gap-1"
        aria-label="Comment"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'var(--action-bg)' }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={isBookmarked ? 'white' : 'none'}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      </button>

      {/* Mute/Unmute */}
      <button
        onClick={onMuteToggle}
        className="action-btn flex flex-col items-center gap-1"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'var(--action-bg)' }}
        >
          {isMuted ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </div>
      </button>

      {/* AI Chat Sparkle */}
      <button
        onClick={onAIChat}
        className="action-btn flex flex-col items-center gap-1"
        aria-label="Ask AI"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center sparkle-glow"
          style={{ background: 'var(--action-bg)' }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="var(--ai-sparkle)"
            stroke="none"
          >
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
            <path
              d="M18 14l1.05 3.15L22 18l-2.95.85L18 22l-1.05-3.15L14 18l2.95-.85L18 14z"
              opacity="0.7"
            />
          </svg>
        </div>
        <span className="text-[10px] font-medium" style={{ color: 'var(--ai-sparkle)' }}>
          AI
        </span>
      </button>
    </>
  );
}
