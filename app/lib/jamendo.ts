import { JamendoTrack } from './types';

const JAMENDO_API = 'https://api.jamendo.com/v3.0/tracks';

export async function fetchChillTracks(limit = 50): Promise<JamendoTrack[]> {
  if (!process.env.JAMENDO_CLIENT_ID) {
    return [];
  }

  const params = new URLSearchParams({
    client_id: process.env.JAMENDO_CLIENT_ID,
    format: 'json',
    limit: limit.toString(),
    tags: 'chillout+relaxation+lounge',
    featured: '1',
    include: 'musicinfo',
    audioformat: 'mp32',
    order: 'popularity_total',
  });

  try {
    const response = await fetch(`${JAMENDO_API}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Jamendo fetch error:', error);
    return [];
  }
}
