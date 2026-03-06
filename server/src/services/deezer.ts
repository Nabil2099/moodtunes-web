import { Mood, Track } from "../types";

const DEEZER_API = "https://api.deezer.com";

// Map moods to search queries that return relevant music
const MOOD_QUERIES: Record<Mood, string[]> = {
  happy: [
    "happy pop hits",
    "feel good summer",
    "upbeat dance pop",
    "good vibes playlist",
    "party anthems",
    "sunshine pop",
    "positive energy",
    "disco funk",
  ],
  sad: [
    "sad songs",
    "heartbreak ballads",
    "melancholy indie",
    "emotional piano",
    "breakup songs",
    "acoustic sad",
    "crying songs",
    "lonely night",
  ],
  energetic: [
    "workout motivation",
    "high energy edm",
    "rock anthems",
    "pump up songs",
    "running playlist",
    "hype rap",
    "power metal",
    "adrenaline rush",
  ],
  calm: [
    "chill lofi",
    "ambient relaxation",
    "peaceful acoustic",
    "meditation music",
    "soft jazz",
    "nature sounds music",
    "slow piano",
    "sleep calm",
  ],
  focused: [
    "deep focus",
    "study music",
    "concentration beats",
    "instrumental focus",
    "coding music",
    "lo-fi beats study",
    "electronic ambient",
    "classical concentration",
  ],
};

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: { id: number; name: string };
  album: {
    title: string;
    cover_medium: string;
    cover_big: string;
  };
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
}

interface DeezerArtist {
  id: number;
  name: string;
  picture_medium: string;
  picture_big: string;
  nb_fan: number;
  nb_album: number;
}

interface DeezerArtistSearchResponse {
  data: DeezerArtist[];
  total: number;
}

interface DeezerArtistDetail {
  id: number;
  name: string;
  picture_big: string;
  picture_medium: string;
  nb_fan: number;
  nb_album: number;
}

interface DeezerLyrics {
  id: number;
  lyrics: string;
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Search Deezer for tracks matching a mood.
 * Uses multiple search queries per mood and deduplicates for variety.
 */
export async function searchByMood(
  mood: Mood,
  limit: number = 30
): Promise<Track[]> {
  const queries = MOOD_QUERIES[mood];
  // Pick 3 random queries to increase variety across requests
  const selectedQueries = shuffle(queries).slice(0, 3);

  const allTracks: Track[] = [];
  const seenIds = new Set<string>();

  for (const query of selectedQueries) {
    try {
      const url = `${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=40`;
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = (await response.json()) as DeezerSearchResponse;

      for (const t of data.data) {
        // Only include tracks with previews
        if (!t.preview || seenIds.has(String(t.id))) continue;
        seenIds.add(String(t.id));

        allTracks.push({
          id: `dz-${t.id}`,
          title: t.title,
          artist: t.artist.name,
          albumArt: t.album.cover_big || t.album.cover_medium,
          duration: t.duration,
          mood,
          previewUrl: t.preview,
          description: `${t.album.title} — ${t.artist.name}`,
        });
      }
    } catch (err) {
      console.error(`Deezer search failed for "${query}":`, err);
    }
  }

  return shuffle(allTracks).slice(0, limit);
}

/**
 * Search Deezer for tracks by a user query string.
 */
export async function searchTracks(
  query: string,
  mood: Mood,
  limit: number = 30
): Promise<Track[]> {
  try {
    const url = `${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = (await response.json()) as DeezerSearchResponse;

    return data.data
      .filter((t) => t.preview)
      .map((t) => ({
        id: `dz-${t.id}`,
        title: t.title,
        artist: t.artist.name,
        albumArt: t.album.cover_big || t.album.cover_medium,
        duration: t.duration,
        mood,
        previewUrl: t.preview,
        description: `${t.album.title} — ${t.artist.name}`,
      }));
  } catch (err) {
    console.error("Deezer search failed:", err);
    return [];
  }
}

/**
 * Search for artists on Deezer.
 */
export async function searchArtists(
  query: string,
  limit: number = 10
): Promise<{
  id: number;
  name: string;
  picture: string;
  fans: number;
  albums: number;
}[]> {
  try {
    const url = `${DEEZER_API}/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = (await response.json()) as DeezerArtistSearchResponse;
    return data.data.map((a) => ({
      id: a.id,
      name: a.name,
      picture: a.picture_big || a.picture_medium,
      fans: a.nb_fan,
      albums: a.nb_album,
    }));
  } catch {
    return [];
  }
}

/**
 * Get an artist's top tracks from Deezer.
 */
export async function getArtistTopTracks(
  artistId: number,
  mood: Mood = "calm",
  limit: number = 50
): Promise<Track[]> {
  try {
    const url = `${DEEZER_API}/artist/${artistId}/top?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = (await response.json()) as DeezerSearchResponse;
    return data.data
      .filter((t) => t.preview)
      .map((t) => ({
        id: `dz-${t.id}`,
        title: t.title,
        artist: t.artist.name,
        albumArt: t.album.cover_big || t.album.cover_medium,
        duration: t.duration,
        mood,
        previewUrl: t.preview,
        description: `${t.album.title} — ${t.artist.name}`,
      }));
  } catch {
    return [];
  }
}

/**
 * Get artist details from Deezer.
 */
export async function getArtistDetail(artistId: number) {
  try {
    const url = `${DEEZER_API}/artist/${artistId}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as DeezerArtistDetail;
    return {
      id: data.id,
      name: data.name,
      picture: data.picture_big || data.picture_medium,
      fans: data.nb_fan,
      albums: data.nb_album,
    };
  } catch {
    return null;
  }
}

/**
 * Get lyrics for a track from Deezer.
 * Track ID should be without the "dz-" prefix.
 */
export async function getTrackLyrics(trackId: number): Promise<string | null> {
  try {
    const url = `${DEEZER_API}/track/${trackId}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const trackData = (await response.json()) as { lyrics?: { writers?: string }; id: number };

    // Deezer's public API doesn't always expose lyrics directly
    // Try the lyrics endpoint
    const lyricsUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(
      (await (await fetch(`${DEEZER_API}/track/${trackId}`)).json() as { artist: { name: string }; title: string }).artist.name
    )}/${encodeURIComponent(
      (trackData as unknown as { title: string }).title
    )}`;

    const lyricsResp = await fetch(lyricsUrl);
    if (!lyricsResp.ok) return null;
    const lyricsData = (await lyricsResp.json()) as { lyrics?: string };
    return lyricsData.lyrics || null;
  } catch {
    return null;
  }
}

/**
 * Get lyrics using artist name and track title (simpler approach).
 */
export async function getLyricsByInfo(
  artist: string,
  title: string
): Promise<string | null> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as { lyrics?: string };
    return data.lyrics || null;
  } catch {
    return null;
  }
}
