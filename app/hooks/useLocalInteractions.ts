'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Comment } from '@/app/lib/types';

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn('localStorage write failed');
  }
}

function loadJson<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs((hash % 4900) + 100);
}

function useLazyLocalStorage<T>(key: string, fallback: T): [T, (updater: (prev: T) => T) => void] {
  const subscribe = useCallback(
    (cb: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) cb();
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    return safeGetItem(key) ?? JSON.stringify(fallback);
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => JSON.stringify(fallback), [fallback]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value: T = (() => { try { return JSON.parse(raw); } catch { return fallback; } })();

  const setValue = useCallback(
    (updater: (prev: T) => T) => {
      const current = loadJson<T>(key, fallback);
      const next = updater(current);
      safeSetItem(key, JSON.stringify(next));
      window.dispatchEvent(new StorageEvent('storage', { key }));
    },
    [key, fallback]
  );

  return [value, setValue];
}

export function useLocalInteractions() {
  const [likes, setLikes] = useLazyLocalStorage<Record<string, boolean>>('goodreels_likes', {});
  const [bookmarks, setBookmarks] = useLazyLocalStorage<Record<string, boolean>>('goodreels_bookmarks', {});
  const [comments, setComments] = useLazyLocalStorage<Record<string, Comment[]>>('goodreels_comments', {});
  const [muteState, setMuteState] = useLazyLocalStorage<boolean>('goodreels_muted', false);

  const isLiked = useCallback(
    (articleId: string) => !!likes[articleId],
    [likes]
  );

  const toggleLike = useCallback((articleId: string) => {
    setLikes((prev) => ({ ...prev, [articleId]: !prev[articleId] }));
  }, [setLikes]);

  const getLikeCount = useCallback(
    (articleId: string) => {
      const base = seededRandom(articleId);
      return likes[articleId] ? base + 1 : base;
    },
    [likes]
  );

  const isBookmarked = useCallback(
    (articleId: string) => !!bookmarks[articleId],
    [bookmarks]
  );

  const toggleBookmark = useCallback((articleId: string) => {
    setBookmarks((prev) => ({ ...prev, [articleId]: !prev[articleId] }));
  }, [setBookmarks]);

  const getComments = useCallback(
    (articleId: string): Comment[] => comments[articleId] || [],
    [comments]
  );

  const addComment = useCallback((articleId: string, text: string) => {
    const comment: Comment = {
      id: Date.now().toString(),
      text,
      timestamp: Date.now(),
    };
    setComments((prev) => ({
      ...prev,
      [articleId]: [...(prev[articleId] || []), comment],
    }));
  }, [setComments]);

  const isMuted = muteState;

  const toggleMute = useCallback(() => {
    setMuteState((prev) => !prev);
  }, [setMuteState]);

  return {
    isLiked,
    toggleLike,
    getLikeCount,
    isBookmarked,
    toggleBookmark,
    getComments,
    addComment,
    isMuted,
    toggleMute,
  };
}
