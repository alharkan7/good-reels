'use client';

import { useState, useRef, useEffect } from 'react';
import { Comment } from '@/app/lib/types';
import { X, Send } from 'lucide-react';

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (text: string) => void;
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}

export default function CommentSheet({
  isOpen,
  onClose,
  comments,
  onAddComment,
}: CommentSheetProps) {
  const [text, setText] = useState('');
  const [closing, setClosing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [isOpen, comments.length]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setText('');
  };

  if (!isOpen && !closing) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={handleClose}>
      <div className="absolute inset-0 sheet-backdrop" />
      <div
        className={`absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden flex flex-col ${closing ? 'sheet-exit' : 'sheet-enter'}`}
        style={{
          background: 'var(--sheet-bg)',
          height: '50vh',
          maxWidth: '430px',
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">Komentar</h3>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white p-1"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Comments list */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar"
        >
          {comments.length === 0 ? (
            <p className="text-white/40 text-sm text-center mt-8">
              Belum ada komentar. Jadilah yang pertama!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="msg-appear">
                <p className="text-sm text-white/90">{comment.text}</p>
                <p className="text-xs text-white/40 mt-1">
                  {formatTime(comment.timestamp)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Tulis komentar..."
            className="flex-1 bg-white/10 text-white text-sm px-4 py-2.5 rounded-full outline-none placeholder:text-white/40 focus:ring-1 focus:ring-white/20"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ background: 'var(--toggle-active)' }}
          >
            <Send size={18} color="white" fill="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
