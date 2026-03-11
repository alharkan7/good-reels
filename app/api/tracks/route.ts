import { fetchChillTracks } from '@/app/lib/jamendo';

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const count = parseInt(url.searchParams.get('count') || '20');

  const tracks = await fetchChillTracks(count);

  const simplified = tracks.map((t) => ({
    id: t.id,
    name: t.name,
    artist: t.artist_name,
    audioUrl: t.audio,
    duration: t.duration,
  }));

  return Response.json(simplified, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
