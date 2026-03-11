'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage } from '@/app/lib/types';

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  lines.forEach((line, li) => {
    if (li > 0) result.push(<br key={`br-${li}`} />);

    const parts: React.ReactNode[] = [];
    let remaining = line;
    let ki = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(<strong key={`b-${li}-${ki++}`}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        const italicMatch = remaining.match(/\*(.+?)\*/);
        if (italicMatch && italicMatch.index !== undefined) {
          if (italicMatch.index > 0) {
            parts.push(remaining.slice(0, italicMatch.index));
          }
          parts.push(<em key={`i-${li}-${ki++}`}>{italicMatch[1]}</em>);
          remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        } else {
          parts.push(remaining);
          remaining = '';
        }
      }
    }

    result.push(...parts);
  });

  return result;
}

function MarkdownText({ text }: { text: string }) {
  const rendered = useMemo(() => renderMarkdown(text), [text]);
  return <>{rendered}</>;
}

interface AIChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
}

export default function AIChatSheet({
  isOpen,
  onClose,
  messages,
  isStreaming,
  onSendMessage,
}: AIChatSheetProps) {
  const [text, setText] = useState('');
  const [closing, setClosing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
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
          height: '78vh',
          maxWidth: '430px',
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--ai-sparkle)' }}>✨</span>
            <h3 className="text-base font-semibold text-white">
              Tanya AI tentang artikel ini
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white p-1"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="text-center mt-8">
              <p className="text-2xl mb-2">🤔</p>
              <p className="text-white/50 text-sm">
                Tanya apa saja tentang artikel ini!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`msg-appear flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-md text-white'
                      : 'rounded-bl-md text-white/90'
                  }`}
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'var(--user-bubble)'
                        : 'var(--ai-bubble)',
                  }}
                >
                  <MarkdownText text={msg.text} />
                  {msg.isStreaming && (
                    <span className="streaming-cursor" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ketik pertanyaan..."
            disabled={isStreaming}
            className="flex-1 bg-white/10 text-white text-sm px-4 py-2.5 rounded-full outline-none placeholder:text-white/40 focus:ring-1 focus:ring-white/20 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isStreaming}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ background: 'var(--ai-sparkle)' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="black"
              stroke="none"
            >
              <path d="M5 12l-2 7 19-7-19-7 2 7zm0 0h8" />
            </svg>
          </button>
          {text.length > 400 && (
            <span className="absolute right-20 bottom-5 text-[10px] text-white/30">
              {text.length}/500
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
