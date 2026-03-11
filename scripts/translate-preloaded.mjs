import fs from 'fs';
import path from 'path';

const PRELOADED_FILE = path.join(process.cwd(), 'app', 'lib', 'preloaded-articles.json');
const OUT_FILE = path.join(process.cwd(), 'app', 'lib', 'preloaded-articles-en.json');

async function getEnTitle(idTitle) {
  const url = `https://id.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=en&titles=${encodeURIComponent(idTitle)}&format=json`;
  const res = await fetch(url, { headers: { 'Api-User-Agent': 'GoodReels/1.0 (good-reels prototype)' }});
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (page && page.langlinks && page.langlinks.length > 0) {
    return page.langlinks[0]['*'];
  }
  return null;
}

async function getEnSummary(enTitle) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(enTitle)}`;
  const res = await fetch(url, { headers: { 'Api-User-Agent': 'GoodReels/1.0 (good-reels prototype)' }});
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: data.pageid?.toString() || Date.now().toString(),
    title: data.title,
    summary: data.extract || '',
    imageUrl: data.thumbnail?.source || data.originalimage?.source || '',
    imageWidth: data.thumbnail?.width || 800,
    imageHeight: data.thumbnail?.height || 600,
    articleUrl: data.content_urls?.mobile?.page || '',
    extract: data.extract || ''
  };
}

async function run() {
  const raw = fs.readFileSync(PRELOADED_FILE, 'utf-8');
  const idArticles = JSON.parse(raw);
  const enArticles = [];

  for (let i = 0; i < idArticles.length; i++) {
    const orig = idArticles[i];
    
    console.log(`Processing ${i+1}/${idArticles.length}: ${orig.title}`);
    const enTitle = await getEnTitle(orig.title);
    let enArticle = null;
    if (enTitle) {
      enArticle = await getEnSummary(enTitle);
    }
    
    if (enArticle && enArticle.summary) {
       enArticle.id = orig.id;
       enArticles.push(enArticle);
    } else {
       // fallback: just keep original
       const fallback = { ...orig };
       enArticles.push(fallback);
    }
    fs.writeFileSync(OUT_FILE, JSON.stringify(enArticles, null, 2));
    await new Promise(r => setTimeout(r, 100)); // sleep
  }
  console.log('Done!');
}

run();
