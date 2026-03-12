/**
 * Scrape random Wikipedia articles with high-quality thumbnails.
 * Run: node scripts/scrape-articles.mjs
 */

const TARGET = 100;
const CONCURRENCY = 1; // Conservative to avoid persistent rate limits
const INITIAL_DELAY = 1000;

// Increase thumbnail resolution from the default (~320px) to 800px for clarity
function getHigherResImage(url) {
  if (!url || !url.includes('/thumb/')) return url;
  // Replaces e.g. /320px- or langid-220px- with 800px-
  return url.replace(/\b\d+px-/g, '800px-');
}

async function fetchOne(lang = 'id') {
  const WIKI_API = `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`;
  let backoff = 2000;
  
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(WIKI_API, {
        headers: { 
          'Api-User-Agent': 'GoodReels/1.1 (https://github.com/alharkan7/good-reels; contact: alharkan@example.com)',
          'Accept': 'application/json'
        },
      });

      if (res.status === 429) {
        process.stdout.write('!'); // Rate limit indicator
        await new Promise(r => setTimeout(r, backoff));
        backoff *= 2;
        continue;
      }

      if (!res.ok) return null;

      const d = await res.json();
      if (d.type !== 'standard') return null;
      if (!d.thumbnail?.source) return null;
      
      return {
        id: String(d.pageid),
        title: d.title,
        summary: d.extract || '',
        imageUrl: getHigherResImage(d.thumbnail.source),
        imageWidth: 800,
        imageHeight: Math.round(800 * (d.thumbnail.height / d.thumbnail.width)),
        articleUrl: d.content_urls?.mobile?.page || '',
        extract: d.extract || '',
      };
    } catch (err) {
      return null;
    }
  }
  return null;
}

async function scrapeForLang(lang, filename) {
  const articles = [];
  const seen = new Set();
  const fs = await import('fs');
  const path = await import('path');
  const outDir = path.join(process.cwd(), 'app', 'lib');
  const fullPath = path.join(outDir, filename);

  // Resume logic: Load existing valid articles to avoid restarting from scratch
  if (fs.existsSync(fullPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (Array.isArray(data)) {
        for (const a of data) {
          if (a.id && !seen.has(a.id)) {
            // Re-apply image enhancement to existing if needed
            a.imageUrl = getHigherResImage(a.imageUrl);
            articles.push(a);
            seen.add(a.id);
          }
        }
      }
    } catch (e) {
      console.log(`Could not resume ${filename}, starting fresh.`);
    }
  }

  console.log(`\nScraping ${lang} articles for ${filename}... (Current: ${articles.length}/${TARGET})`);
  
  while (articles.length < TARGET) {
    const r = await fetchOne(lang);
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      articles.push(r);
      process.stdout.write(`\r  ${articles.length}/${TARGET}`);
      
      // Save progress every 5 iterations
      if (articles.length % 5 === 0) {
        fs.writeFileSync(fullPath, JSON.stringify(articles, null, 2));
      }
    }
    // Respectful delay between requests
    await new Promise((r) => setTimeout(r, 800));
  }

  fs.writeFileSync(fullPath, JSON.stringify(articles, null, 2));
  console.log(`\nDone — saved ${articles.length} articles to ${filename}`);
}

async function main() {
  // Scrape English version first as it's the current priority for improvement
  await scrapeForLang('en', 'preloaded-articles-en.json');
  await scrapeForLang('id', 'preloaded-articles.json');
}

main().catch(console.error);
