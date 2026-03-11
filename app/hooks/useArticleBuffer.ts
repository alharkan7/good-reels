'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Article } from '@/app/lib/types';

const INITIAL_BATCH = 5;
const PREFETCH_BATCH = 3;
const BUFFER_THRESHOLD = 3;

export function useArticleBuffer() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isFetching = useRef(false);

  const fetchBatch = useCallback(async (count: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch(`/api/articles?count=${count}`);
      if (!res.ok) throw new Error('Failed to fetch articles');
      const newArticles: Article[] = await res.json();
      setArticles((prev) => [...prev, ...newArticles]);
    } catch (error) {
      console.error('Article fetch error:', error);
    } finally {
      isFetching.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const remaining = articles.length - currentIndex - 1;
    if (remaining <= BUFFER_THRESHOLD && !isFetching.current && articles.length > 0) {
      fetchBatch(PREFETCH_BATCH);
    }
  }, [currentIndex, articles.length, fetchBatch]);

  useEffect(() => {
    fetchBatch(INITIAL_BATCH);
  }, [fetchBatch]);

  const refresh = useCallback(async () => {
    setArticles([]);
    setCurrentIndex(0);
    setIsLoading(true);
    isFetching.current = false;
    await fetchBatch(INITIAL_BATCH);
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
    isFetching: isFetching.current,
  };
}
