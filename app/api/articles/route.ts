import { NextRequest } from 'next/server';
import { fetchRandomArticle } from '@/app/lib/wikipedia';
import { Article, WikipediaSummary } from '@/app/lib/types';

export const maxDuration = 30;

function transformToArticle(summary: WikipediaSummary): Article {
  const imageSource = summary.thumbnail?.source || summary.originalimage?.source || '';
  const imageWidth = summary.thumbnail?.width || summary.originalimage?.width || 800;
  const imageHeight = summary.thumbnail?.height || summary.originalimage?.height || 600;

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
  const MAX_ATTEMPTS = count * 3;

  while (articles.length < count && attempts < MAX_ATTEMPTS) {
    const batchSize = Math.min(5, count - articles.length + 2);
    const candidates = await Promise.allSettled(
      Array.from({ length: batchSize }, () => fetchRandomArticle())
    );

    for (const r of candidates) {
      if (
        r.status === 'fulfilled' &&
        r.value !== null &&
        articles.length < count
      ) {
        articles.push(transformToArticle(r.value));
      }
    }

    attempts += batchSize;
  }

  return Response.json(articles);
}
