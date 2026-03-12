'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Article } from '@/app/lib/types';
import preloadedRawId from '@/app/lib/preloaded-articles.json';
import preloadedRawEn from '@/app/lib/preloaded-articles-en.json';

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

function getPreloadedBatch(count: number, exclude: Set<string>, lang: 'id' | 'en'): Article[] {
  const sourceRaw = lang === 'en' ? preloadedRawEn : preloadedRawId;
  const PRELOADED = sourceRaw as Article[];
  
  const pool = PRELOADED.filter((a) => !exclude.has(a.id));
  const source = pool.length >= count ? pool : PRELOADED;
  return shuffled(source).slice(0, count);
}

const translateSingleArticle = async (article: Article, targetLang: 'id' | 'en'): Promise<Article> => {
  const sourceLang = targetLang === 'en' ? 'id' : 'en';
  try {
    const url = `https://${sourceLang}.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=${targetLang}&titles=${encodeURIComponent(article.title)}&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0] as { langlinks?: { '*': string }[] };
      if (page && page.langlinks && page.langlinks.length > 0) {
        const counterpartTitle = page.langlinks[0]['*'];
        const summaryRes = await fetch(`https://${targetLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(counterpartTitle)}`);
        if (summaryRes.ok) {
          const sm = await summaryRes.json();
          return {
            id: sm.pageid?.toString() || Date.now().toString(),
            title: sm.title,
            summary: sm.extract || '',
            imageUrl: sm.thumbnail?.source || sm.originalimage?.source || article.imageUrl,
            imageWidth: sm.thumbnail?.width || 800,
            imageHeight: sm.thumbnail?.height || 600,
            articleUrl: sm.content_urls?.mobile?.page || '',
            extract: sm.extract || ''
          };
        }
      }
    }
  } catch { /* ignore */ }
  return article; // fallback
};

export function useArticleBuffer(lang: 'id' | 'en' = 'id', category: string | null = null) {
  const [articles, setArticles] = useState<Article[]>([]);
  const isHydrated = useRef(false);
  const prevLang = useRef(lang);
  const prevCategory = useRef(category);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isFetching = useRef(false);
  const preloadedUsed = useRef(new Set<string>());
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Eliminate Hydration Mismatch
  useEffect(() => {
    if (!isHydrated.current) {
      if (!category) {
        const initial = shuffled((lang === 'en' ? preloadedRawEn : preloadedRawId) as Article[]).slice(0, INITIAL_BATCH);
        initial.forEach(a => preloadedUsed.current.add(a.id));
        setArticles(initial);
      }
      isHydrated.current = true;
    }
  }, [lang, category]);

  // Handle language changes dynamically
  useEffect(() => {
    if (!isHydrated.current) return;
    if (prevLang.current === lang) return;
    const targetLang = lang;
    prevLang.current = targetLang;

    // 1. Instantly swap preloaded articles to prevent visual lag
    setArticles(current => {
      const fromRaw = targetLang === 'en' ? preloadedRawId : preloadedRawEn;
      const toRaw = targetLang === 'en' ? preloadedRawEn : preloadedRawId;
      
      return current.map(a => {
        const preloadedIdx = (fromRaw as Article[]).findIndex(x => x.id === a.id);
        if (preloadedIdx !== -1 && toRaw[preloadedIdx]) {
           return toRaw[preloadedIdx] as Article;
        }
        return a;
      });
    });

    // 2. Safely translate remaining non-preloaded articles via API
    const translateRest = async () => {
      setArticles(current => [...current]); // force refresh
      // get latest articles ref
      setArticles(currentArticles => {
        const mapped = [...currentArticles];
        const fromRaw = targetLang === 'en' ? preloadedRawId : preloadedRawEn;
        
        mapped.forEach(async (a, i) => {
          const preloadedIdx = (fromRaw as Article[]).findIndex(x => x.id === a.id);
          const toRaw = targetLang === 'en' ? preloadedRawEn : preloadedRawId;
          const isTranslatedPreloaded = preloadedIdx !== -1 || (toRaw as Article[]).some(x => x.id === a.id);
          
          if (!isTranslatedPreloaded) {
            const tr = await translateSingleArticle(a, targetLang);
            setArticles(latest => {
              const c = [...latest];
              c[i] = tr;
              return c;
            });
          }
        });
        return mapped;
      });
    };
    translateRest();

  }, [lang]);

  const fetchBatch = useCallback(async (count: number, fetchLang: 'id' | 'en') => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);

    stallTimer.current = setTimeout(() => {
      if (isFetching.current && !category) {
        const filler = getPreloadedBatch(count, preloadedUsed.current, fetchLang);
        filler.forEach((a) => preloadedUsed.current.add(a.id));
        setArticles((prev) => [...prev, ...filler]);
      }
    }, 4000);

    try {
      const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`/api/articles?count=${count}&lang=${fetchLang}${categoryParam}`);
      if (!res.ok) throw new Error('Failed to fetch articles');
      const newArticles: Article[] = await res.json();
      if (newArticles.length > 0) {
        setArticles((prev) => [...prev, ...newArticles]);
      } else if (!category) {
        const filler = getPreloadedBatch(count, preloadedUsed.current, fetchLang);
        filler.forEach((a) => preloadedUsed.current.add(a.id));
        setArticles((prev) => [...prev, ...filler]);
      }
    } catch (error) {
      console.error('Article fetch error:', error);
      if (!category) {
        const filler = getPreloadedBatch(count, preloadedUsed.current, fetchLang);
        filler.forEach((a) => preloadedUsed.current.add(a.id));
        setArticles((prev) => [...prev, ...filler]);
      }
    } finally {
      if (stallTimer.current) clearTimeout(stallTimer.current);
      stallTimer.current = null;
      isFetching.current = false;
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (!isHydrated.current) return;
    const remaining = articles.length - currentIndex - 1;
    if (remaining <= BUFFER_THRESHOLD && !isFetching.current) {
      if (articles.length === 0 && !category) {
        // Just let it load normally, but if it has no category we definitely want a fetch.
      }
      fetchBatch(articles.length === 0 ? INITIAL_BATCH : PREFETCH_BATCH, lang);
    }
  }, [currentIndex, articles.length, fetchBatch, lang, category]);

  const refresh = useCallback(async () => {
    preloadedUsed.current.clear();
    let fresh: Article[] = [];
    if (!category) {
      const sourceRaw = lang === 'en' ? preloadedRawEn : preloadedRawId;
      fresh = shuffled(sourceRaw as Article[]).slice(0, INITIAL_BATCH);
      fresh.forEach((a) => preloadedUsed.current.add(a.id));
    }
    setArticles(fresh);
    setCurrentIndex(0);
    isFetching.current = false;
    fetchBatch(INITIAL_BATCH, lang);
  }, [fetchBatch, lang, category]);

  // Handle category changes
  useEffect(() => {
    if (!isHydrated.current) return;
    if (prevCategory.current !== category) {
      prevCategory.current = category;
      refresh();
    }
  }, [category, refresh]);

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
