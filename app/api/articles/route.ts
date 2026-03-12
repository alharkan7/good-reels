import { NextRequest } from 'next/server';
import { fetchRandomArticle, fetchArticleSummary } from '@/app/lib/wikipedia';
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
  const langParam = url.searchParams.get('lang');
  const lang = langParam === 'en' ? 'en' : 'id';
  const category = url.searchParams.get('category');
  const articles: Article[] = [];
  let attempts = 0;
  const MAX_ATTEMPTS = count * 3;

  let categoryMembers: string[] = [];
  if (category) {
    try {
      const catRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(category)}&cmnamespace=0&cmlimit=500&format=json`);
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.query?.categorymembers) {
          categoryMembers = catData.query.categorymembers.map((member: { title: string }) => member.title);
        }
      }
    } catch {
      // ignore fetching error
    }
  }

  while (articles.length < count && attempts < MAX_ATTEMPTS) {
    const batchSize = Math.min(5, count - articles.length + 2);
    const candidates = await Promise.allSettled(
      Array.from({ length: batchSize }, () => {
        if (category && categoryMembers.length > 0) {
          const randomIndex = Math.floor(Math.random() * categoryMembers.length);
          const title = categoryMembers[randomIndex];
          return fetchArticleSummary(title, lang);
        } else {
          return fetchRandomArticle(lang);
        }
      })
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
