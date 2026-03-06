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
  artist: { name: string };
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
