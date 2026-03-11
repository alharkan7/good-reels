import { WikipediaSummary } from './types';

const WIKI_API = 'https://id.wikipedia.org/api/rest_v1/page/random/summary';

export async function fetchRandomArticle(): Promise<WikipediaSummary | null> {
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

export async function fetchArticleSummary(title: string): Promise<WikipediaSummary | null> {
  const response = await fetch(
    `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
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
