import axios from "axios";
import { MoodResult, Track, Artist, ArtistDetail, User, ForYouResponse, DJJourney, MoodInsights, TasteProfile, Mood } from "@/types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("moodtunes_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Mood ───
export async function analyzeMood(text: string): Promise<MoodResult> {
  const { data } = await api.post<MoodResult>("/mood/analyze", { text });
  return data;
}

export async function submitQuestionnaire(
  answers: string[]
): Promise<MoodResult> {
  const { data } = await api.post<MoodResult>("/mood/questionnaire", {
    answers,
  });
  return data;
}

export async function getTimeMood(): Promise<MoodResult> {
  const { data } = await api.get<MoodResult>("/mood/time");
  return data;
}

// ─── Tracks ───
export async function getTracks(mood?: string): Promise<Track[]> {
  const { data } = await api.get<Track[]>("/tracks", {
    params: {
      ...(mood ? { mood } : {}),
      _t: Date.now(),
    },
  });
  return data;
}

export async function searchTracks(
  query: string,
  mood?: string
): Promise<Track[]> {
  const { data } = await api.get<Track[]>("/tracks/search", {
    params: {
      q: query,
      ...(mood ? { mood } : {}),
    },
  });
  return data;
}

export async function searchArtists(query: string): Promise<Artist[]> {
  const { data } = await api.get<Artist[]>("/tracks/artists", {
    params: { q: query },
  });
  return data;
}

export async function getArtistDetail(artistId: number): Promise<ArtistDetail> {
  const { data } = await api.get<ArtistDetail>(`/tracks/artist/${artistId}`);
  return data;
}

export async function getLyrics(
  artist: string,
  title: string
): Promise<string | null> {
  const { data } = await api.get<{ lyrics: string | null }>("/tracks/lyrics", {
    params: { artist, title },
  });
  return data.lyrics;
}

// ─── Auth ───
export async function sendOTP(email: string, signal?: AbortSignal): Promise<{ message: string; isNewUser: boolean }> {
  const { data } = await api.post("/auth/send-otp", { email }, { signal });
  return data;
}

export async function verifyOTP(email: string, code: string, name?: string, signal?: AbortSignal): Promise<{ token: string; user: User }> {
  const { data } = await api.post("/auth/verify-otp", { email, code, name }, { signal });
  return data;
}

export async function googleAuth(credential: string): Promise<{ token: string; user: User }> {
  const { data } = await api.post("/auth/google", { credential });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function updateProfile(updates: { name?: string; avatar?: string }): Promise<User> {
  const { data } = await api.put<User>("/auth/profile", updates);
  return data;
}

export async function logListeningHistory(track: { trackId: string; trackTitle: string; artistName: string; mood: string; duration?: number }): Promise<void> {
  await api.post("/auth/history", track);
}

export async function addFavorite(track: { trackId: string; trackTitle: string; artistName: string; albumArt?: string; mood: string }): Promise<void> {
  await api.post("/auth/favorites", track);
}

export async function removeFavorite(trackId: string): Promise<void> {
  await api.delete(`/auth/favorites/${encodeURIComponent(trackId)}`);
}

export async function getFavorites(): Promise<any[]> {
  const { data } = await api.get("/auth/favorites");
  return data;
}

// ─── AI ───
export async function getForYou(): Promise<ForYouResponse> {
  const { data } = await api.get<ForYouResponse>("/ai/for-you");
  return data;
}

export async function getDJPlaylist(mood?: Mood, steps?: number): Promise<DJJourney> {
  const { data } = await api.get<DJJourney>("/ai/dj", {
    params: { ...(mood ? { mood } : {}), ...(steps ? { steps } : {}) },
  });
  return data;
}

export async function getInsights(): Promise<MoodInsights> {
  const { data } = await api.get<MoodInsights>("/ai/insights");
  return data;
}

export async function getTasteProfile(): Promise<TasteProfile> {
  const { data } = await api.get<TasteProfile>("/ai/taste-profile");
  return data;
}
