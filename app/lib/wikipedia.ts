import { WikipediaSummary } from './types';

export async function fetchRandomArticle(lang: 'id' | 'en' = 'id'): Promise<WikipediaSummary | null> {
  const WIKI_API = `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`;
  const response = await fetch(WIKI_API, {
    headers: {
      'Api-User-Agent': 'GoodReels/1.0 (good-reels prototype)',
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data: WikipediaSummary = await response.json();

  if (!data.thumbnail && !data.originalimage) return null;
  if (data.type !== 'standard') return null;

  return data;
}

export async function fetchArticleSummary(title: string, lang: 'id' | 'en' = 'id'): Promise<WikipediaSummary | null> {
  const response = await fetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    {
      headers: {
        'Api-User-Agent': 'GoodReels/1.0 (good-reels prototype)',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) return null;

  const data: WikipediaSummary = await response.json();
  return data;
}
