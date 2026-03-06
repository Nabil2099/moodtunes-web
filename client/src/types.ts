export type Mood = "happy" | "sad" | "energetic" | "calm" | "focused";

export interface MoodResult {
  mood: Mood;
  confidence: number;
  color: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  mood: Mood;
  previewUrl: string;
  description: string;
}

export interface Artist {
  id: number;
  name: string;
  picture: string;
  fans: number;
  albums: number;
}

export interface ArtistDetail extends Artist {
  topTracks: Track[];
}

// ─── Auth types ───
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
  _count?: {
    listeningHistory: number;
    favorites: number;
    moodSessions: number;
  };
}

// ─── AI types ───
export interface TasteProfile {
  moodDistribution: Record<Mood, number>;
  topArtists: { name: string; count: number }[];
  totalListens: number;
  favoriteCount: number;
  avgMood: Mood;
  timePreferences: Record<string, Mood>;
}

export interface MoodInsights {
  currentStreak: { mood: Mood; count: number } | null;
  moodDistribution: Record<Mood, number>;
  totalSessions: number;
  mostFrequentMood: Mood;
  recentTrend: "improving" | "declining" | "stable" | "varied";
  topArtists: { name: string; count: number }[];
  listensByDay: { day: string; count: number }[];
}

export interface DJJourney {
  journey: Mood[];
  steps: { step: number; mood: Mood; tracks: Track[] }[];
  totalTracks: number;
}

export interface ForYouResponse {
  mood: Mood;
  tracks: Track[];
  profile: {
    topArtists: { name: string; count: number }[];
    avgMood: Mood;
    totalListens: number;
  };
}

export const MOOD_COLORS: Record<Mood, string> = {
  happy: "#4fd6a0",
  sad: "#6af1f7",
  energetic: "#f7836a",
  calm: "#7c6af7",
  focused: "#f7c96a",
};

export const MOOD_EMOJIS: Record<Mood, string> = {
  happy: "😊",
  sad: "😢",
  energetic: "⚡",
  calm: "🧘",
  focused: "🎯",
};

export const MOOD_LABELS: Record<Mood, string> = {
  happy: "Happy",
  sad: "Sad",
  energetic: "Energetic",
  calm: "Calm",
  focused: "Focused",
};
