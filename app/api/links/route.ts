export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  const lang = url.searchParams.get('lang') || 'id'; // default to id
  if (!title) {
    return Response.json({ error: 'title required' }, { status: 400 });
  }

  const linksUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=links&pllimit=max&plnamespace=0&format=json`;
  const linksRes = await fetch(linksUrl, {
    headers: { 'Api-User-Agent': 'GoodReels/1.0' },
  });

  if (!linksRes.ok) {
    return Response.json({ center: title, links: [], totalLinksInArticle: 0 });
  }

  const linksData = await linksRes.json();

  const pages = Object.values(linksData.query?.pages || {}) as Record<string, unknown>[];
  const rawLinks = (pages[0] as Record<string, unknown>)?.links as Array<{ title: string }> | undefined;
  const links: string[] = rawLinks?.map((l) => l.title) || [];

  const limitedLinks = links.slice(0, 40);
  const summaries = await Promise.allSettled(
    limitedLinks.map(async (linkTitle) => {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(linkTitle)}`,
        { headers: { 'Api-User-Agent': 'GoodReels/1.0' } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        title: data.title as string,
        description: (data.description || '') as string,
        thumbnailUrl: (data.thumbnail?.source || null) as string | null,
        articleUrl: (data.content_urls?.mobile?.page || '') as string,
        pageid: data.pageid as number,
      };
    })
  );

  interface LinkNode {
    title: string;
    description: string;
    thumbnailUrl: string | null;
    articleUrl: string;
    pageid: number;
  }

  const nodes: LinkNode[] = [];
  for (const result of summaries) {
    if (result.status === 'fulfilled' && result.value !== null) {
      nodes.push(result.value as LinkNode);
    }
  }

  return Response.json({
    center: title,
    links: nodes,
    totalLinksInArticle: links.length,
  });
}
