'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Article } from '@/app/lib/types';
import preloadedRaw from '@/app/lib/preloaded-articles.json';

const PRELOADED: Article[] = preloadedRaw as Article[];
const INITIAL_BATCH = 5;
const PREFETCH_BATCH = 3;
const BUFFER_THRESHOLD = 3;

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPreloadedBatch(count: number, exclude: Set<string>): Article[] {
  const pool = PRELOADED.filter((a) => !exclude.has(a.id));
  const source = pool.length >= count ? pool : PRELOADED;
  return shuffled(source).slice(0, count);
}

export function useArticleBuffer() {
  const [articles, setArticles] = useState<Article[]>(() =>
    shuffled(PRELOADED).slice(0, INITIAL_BATCH)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isFetching = useRef(false);
  const preloadedUsed = useRef(new Set<string>());
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBatch = useCallback(async (count: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);

    stallTimer.current = setTimeout(() => {
      if (isFetching.current) {
        const filler = getPreloadedBatch(count, preloadedUsed.current);
        filler.forEach((a) => preloadedUsed.current.add(a.id));
        setArticles((prev) => [...prev, ...filler]);
      }
    }, 4000);

    try {
      const res = await fetch(`/api/articles?count=${count}`);
      if (!res.ok) throw new Error('Failed to fetch articles');
      const newArticles: Article[] = await res.json();
      if (newArticles.length > 0) {
        setArticles((prev) => [...prev, ...newArticles]);
      } else {
        const filler = getPreloadedBatch(count, preloadedUsed.current);
        filler.forEach((a) => preloadedUsed.current.add(a.id));
        setArticles((prev) => [...prev, ...filler]);
      }
    } catch (error) {
      console.error('Article fetch error:', error);
      const filler = getPreloadedBatch(count, preloadedUsed.current);
      filler.forEach((a) => preloadedUsed.current.add(a.id));
      setArticles((prev) => [...prev, ...filler]);
    } finally {
      if (stallTimer.current) clearTimeout(stallTimer.current);
      stallTimer.current = null;
      isFetching.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const remaining = articles.length - currentIndex - 1;
    if (remaining <= BUFFER_THRESHOLD && !isFetching.current) {
      fetchBatch(PREFETCH_BATCH);
    }
  }, [currentIndex, articles.length, fetchBatch]);

  useEffect(() => {
    fetchBatch(INITIAL_BATCH);
  }, [fetchBatch]);

  const refresh = useCallback(async () => {
    preloadedUsed.current.clear();
    const fresh = shuffled(PRELOADED).slice(0, INITIAL_BATCH);
    fresh.forEach((a) => preloadedUsed.current.add(a.id));
    setArticles(fresh);
    setCurrentIndex(0);
    isFetching.current = false;
    fetchBatch(INITIAL_BATCH);
  }, [fetchBatch]);

  const prependArticle = useCallback((article: Article) => {
    setArticles((prev) => [article, ...prev]);
    setCurrentIndex(0);
  }, []);

  return {
    articles,
    currentIndex,
    setCurrentIndex,
    isLoading,
    refresh,
    prependArticle,
  };
}
