import { NextRequest } from 'next/server';
import { fetchRandomArticle } from '@/app/lib/wikipedia';
import { isContentSafe } from '@/app/lib/gemini';
import { Article, WikipediaSummary } from '@/app/lib/types';

export const maxDuration = 30;

function transformToArticle(summary: WikipediaSummary): Article {
  const imageSource =
    summary.originalimage?.source || summary.thumbnail?.source || '';
  const imageWidth = summary.originalimage?.width || summary.thumbnail?.width || 800;
  const imageHeight = summary.originalimage?.height || summary.thumbnail?.height || 600;

  return {
    id: summary.pageid.toString(),
    title: summary.title,
    summary: summary.extract,
    imageUrl: imageSource,
    imageWidth,
    imageHeight,
    articleUrl: summary.content_urls.mobile.page,
    extract: summary.extract,
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const count = Math.min(parseInt(url.searchParams.get('count') || '5'), 10);
  const articles: Article[] = [];
  let attempts = 0;
  const MAX_ATTEMPTS = count * 4;

  while (articles.length < count && attempts < MAX_ATTEMPTS) {
    const batchSize = Math.min(3, count - articles.length);
    const candidates = await Promise.allSettled(
      Array.from({ length: batchSize }, () => fetchRandomArticle())
    );

    const valid = candidates
      .filter(
        (r): r is PromiseFulfilledResult<WikipediaSummary> =>
          r.status === 'fulfilled' && r.value !== null
      )
      .map((r) => r.value);

    const moderated = await Promise.allSettled(
      valid.map(async (article) => {
        const safe = await isContentSafe(article.title, article.extract);
        return safe ? article : null;
      })
    );

    for (const result of moderated) {
      if (
        result.status === 'fulfilled' &&
        result.value !== null &&
        articles.length < count
      ) {
        articles.push(transformToArticle(result.value));
      }
    }

    attempts += batchSize;
  }

  return Response.json(articles);
}
