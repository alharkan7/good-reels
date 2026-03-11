'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '@/app/lib/types';

export function useAIChat(
  articleId: string,
  articleTitle: string,
  articleExtract: string
) {
  const [sessions, setSessions] = useState<Record<string, ChatMessage[]>>({});
  const [isStreaming, setIsStreaming] = useState(false);

  const fullExtractCache = useRef<Record<string, string>>({});
  const fetchingArticle = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!articleId || !articleTitle) return;
    if (fullExtractCache.current[articleId] || fetchingArticle.current[articleId]) return;

    fetchingArticle.current[articleId] = true;
    fetch(
      `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`,
      { headers: { 'Api-User-Agent': 'GoodReels/1.0' } }
    )
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.extract) {
          fullExtractCache.current[articleId] = data.extract;
        }
      })
      .catch(() => {})
      .finally(() => { fetchingArticle.current[articleId] = false; });
  }, [articleId, articleTitle]);

  const messages = sessions[articleId] || [];

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return;

      const trimmedText = userText.slice(0, 500);
      const bestExtract = fullExtractCache.current[articleId] || articleExtract;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: trimmedText,
      };

      const updatedMessages = [...(sessions[articleId] || []), userMsg];
      setSessions((prev) => ({ ...prev, [articleId]: updatedMessages }));

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: '',
        isStreaming: true,
      };
      setSessions((prev) => ({
        ...prev,
        [articleId]: [...updatedMessages, aiMsg],
      }));

      setIsStreaming(true);

      try {
        const contextMessages = updatedMessages.slice(-20);

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleTitle,
            articleExtract: bestExtract.slice(0, 4000),
            messages: contextMessages.map((m) => ({
              role: m.role,
              text: m.text,
            })),
          }),
        });

        if (!res.ok) throw new Error('Chat request failed');

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setSessions((prev) => ({
                  ...prev,
                  [articleId]: (prev[articleId] || []).map((m) =>
                    m.id === aiMsg.id ? { ...m, text: fullText } : m
                  ),
                }));
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        setSessions((prev) => ({
          ...prev,
          [articleId]: (prev[articleId] || []).map((m) =>
            m.id === aiMsg.id ? { ...m, isStreaming: false } : m
          ),
        }));
      } catch (error) {
        console.error('AI chat error:', error);
        setSessions((prev) => ({
          ...prev,
          [articleId]: (prev[articleId] || []).map((m) =>
            m.id === aiMsg.id
              ? {
                  ...m,
                  text: m.text || 'Gagal mendapat jawaban. Coba lagi.',
                  isStreaming: false,
                }
              : m
          ),
        }));
      } finally {
        setIsStreaming(false);
      }
    },
    [articleId, articleTitle, articleExtract, isStreaming, sessions]
  );

  const clearSession = useCallback(() => {
    setSessions((prev) => {
      const next = { ...prev };
      delete next[articleId];
      return next;
    });
  }, [articleId]);

  return { messages, sendMessage, isStreaming, clearSession };
}
