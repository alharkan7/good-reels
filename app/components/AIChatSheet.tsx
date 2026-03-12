'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage } from '@/app/lib/types';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { Sparkles, X, MessageCircleQuestion, Send } from 'lucide-react';

function inlineMarkdown(text: string, lineKey: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let ki = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/`(.+?)`/);
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

    type Match = { idx: number; len: number; node: React.ReactNode };
    const candidates: Match[] = [];
    if (codeMatch?.index !== undefined)
      candidates.push({ idx: codeMatch.index, len: codeMatch[0].length, node: <code key={`c-${lineKey}-${ki++}`} className="bg-white/10 px-1 py-0.5 rounded text-[13px]">{codeMatch[1]}</code> });
    if (boldMatch?.index !== undefined)
      candidates.push({ idx: boldMatch.index, len: boldMatch[0].length, node: <strong key={`b-${lineKey}-${ki++}`}>{boldMatch[1]}</strong> });
    if (italicMatch?.index !== undefined)
      candidates.push({ idx: italicMatch.index, len: italicMatch[0].length, node: <em key={`i-${lineKey}-${ki++}`}>{italicMatch[1]}</em> });

    if (candidates.length === 0) {
      result.push(remaining);
      break;
    }

    candidates.sort((a, b) => a.idx - b.idx);
    const best = candidates[0];
    if (best.idx > 0) result.push(remaining.slice(0, best.idx));
    result.push(best.node);
    remaining = remaining.slice(best.idx + best.len);
  }

  return result;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let li = 0;

  while (li < lines.length) {
    const line = lines[li];

    if (line.match(/^#{1,3}\s+/)) {
      const content = line.replace(/^#{1,3}\s+/, '');
      elements.push(<p key={`h-${li}`} className="font-bold mt-2 mb-1">{inlineMarkdown(content, `h${li}`)}</p>);
      li++;
      continue;
    }

    if (line.match(/^[\*\-]\s+/)) {
      const items: React.ReactNode[] = [];
      while (li < lines.length && lines[li].match(/^[\*\-]\s+/)) {
        const content = lines[li].replace(/^[\*\-]\s+/, '');
        items.push(<li key={`ul-${li}`} className="ml-4 list-disc">{inlineMarkdown(content, `ul${li}`)}</li>);
        li++;
      }
      elements.push(<ul key={`uls-${li}`} className="my-1 space-y-0.5">{items}</ul>);
      continue;
    }

    if (line.match(/^\d+\.\s+/)) {
      const items: React.ReactNode[] = [];
      while (li < lines.length && lines[li].match(/^\d+\.\s+/)) {
        const content = lines[li].replace(/^\d+\.\s+/, '');
        items.push(<li key={`ol-${li}`} className="ml-4 list-decimal">{inlineMarkdown(content, `ol${li}`)}</li>);
        li++;
      }
      elements.push(<ol key={`ols-${li}`} className="my-1 space-y-0.5">{items}</ol>);
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={`sp-${li}`} className="h-2" />);
      li++;
      continue;
    }

    elements.push(<span key={`p-${li}`}>{inlineMarkdown(line, `p${li}`)}<br /></span>);
    li++;
  }

  return elements;
}

function MarkdownText({ text }: { text: string }) {
  const rendered = useMemo(() => renderMarkdown(text), [text]);
  return <div className="markdown-content">{rendered}</div>;
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
  const { lang } = useLanguage();
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
            <Sparkles size={18} strokeWidth={2} style={{ color: 'var(--ai-sparkle)' }} />
            <h3 className="text-base font-semibold text-white">
              {lang === 'id' ? 'Tanya AI' : 'Ask AI'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white p-1"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center pb-4">
              <MessageCircleQuestion size={36} strokeWidth={1.5} className="mb-4 text-white/40" />
              <p className="text-white/50 text-sm">
                {lang === 'id' ? 'Tanya apa saja tentang artikel ini!' : 'Ask anything about this article!'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`msg-appear flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
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
            placeholder={lang === 'id' ? 'Ketik pertanyaan...' : 'Type a question...'}
            disabled={isStreaming}
            className="flex-1 bg-white/10 text-white text-sm px-4 py-2.5 rounded-full outline-none placeholder:text-white/40 focus:ring-1 focus:ring-white/20 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isStreaming}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ background: 'var(--ai-sparkle)' }}
          >
            <Send size={18} color="black" fill="black" />
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
