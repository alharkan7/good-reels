/**
 * Scrape 100 random Wikipedia ID articles with thumbnails.
 * Run: node scripts/scrape-articles.mjs
 */

const WIKI_API = 'https://id.wikipedia.org/api/rest_v1/page/random/summary';
const TARGET = 100;
const CONCURRENCY = 5;

async function fetchOne() {
  const res = await fetch(WIKI_API, {
    headers: { 'Api-User-Agent': 'GoodReels/1.0 (scraper)' },
  });
  if (!res.ok) return null;
  const d = await res.json();
  if (d.type !== 'standard') return null;
  if (!d.thumbnail?.source) return null;
  return {
    id: String(d.pageid),
    title: d.title,
    summary: d.extract || '',
    imageUrl: d.thumbnail.source,
    imageWidth: d.thumbnail.width,
    imageHeight: d.thumbnail.height,
    articleUrl: d.content_urls?.mobile?.page || '',
    extract: d.extract || '',
  };
}

async function main() {
  const articles = [];
  const seen = new Set();
  let attempts = 0;
  const MAX = TARGET * 5;

  while (articles.length < TARGET && attempts < MAX) {
    const batch = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }, () => fetchOne())
    );
    for (const r of batch) {
      if (r.status === 'fulfilled' && r.value && !seen.has(r.value.id)) {
        seen.add(r.value.id);
        articles.push(r.value);
        process.stdout.write(`\r  ${articles.length}/${TARGET}`);
        if (articles.length >= TARGET) break;
      }
    }
    attempts += CONCURRENCY;
    await new Promise((r) => setTimeout(r, 200));
  }

  const fs = await import('fs');
  const path = await import('path');
  const outDir = path.join(process.cwd(), 'app', 'lib');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'preloaded-articles.json'),
    JSON.stringify(articles, null, 2)
  );
  console.log(`\nDone — saved ${articles.length} articles to app/lib/preloaded-articles.json`);
}

main().catch(console.error);
