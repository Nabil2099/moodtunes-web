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
