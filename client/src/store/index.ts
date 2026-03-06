import { create } from "zustand";
import { Mood, MoodResult, Track, MOOD_COLORS } from "@/types";

// ─── Mood Slice ───
interface MoodState {
  currentMood: Mood | null;
  moodResult: MoodResult | null;
  isAnalyzing: boolean;
  method: "text" | "questionnaire" | "time" | null;
  setMoodResult: (result: MoodResult, method: MoodState["method"]) => void;
  setAnalyzing: (v: boolean) => void;
  setMood: (mood: Mood) => void;
  reset: () => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  currentMood: null,
  moodResult: null,
  isAnalyzing: false,
  method: null,
  setMoodResult: (result, method) =>
    set({ moodResult: result, currentMood: result.mood, method, isAnalyzing: false }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setMood: (mood) =>
    set({
      currentMood: mood,
      moodResult: { mood, confidence: 1, color: MOOD_COLORS[mood] },
    }),
  reset: () =>
    set({ currentMood: null, moodResult: null, isAnalyzing: false, method: null }),
}));

// ─── Tracks Slice ───
interface TracksState {
  tracks: Track[];
  isLoading: boolean;
  setTracks: (tracks: Track[]) => void;
  setLoading: (v: boolean) => void;
}

export const useTracksStore = create<TracksState>((set) => ({
  tracks: [],
  isLoading: false,
  setTracks: (tracks) => set({ tracks, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ─── Player Slice ───
interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  isExpanded: boolean;
  queue: Track[];
  play: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setProgress: (p: number) => void;
  setExpanded: (v: boolean) => void;
  stop: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  isExpanded: false,
  queue: [],
  play: (track, queue) =>
    set({
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      queue: queue || get().queue,
    }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  next: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = queue[(idx + 1) % queue.length];
    set({ currentTrack: nextTrack, isPlaying: true, progress: 0 });
  },
  previous: () => {
    const { queue, currentTrack, progress } = get();
    if (!currentTrack || queue.length === 0) return;
    // If more than 3 seconds in, restart current track
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevTrack = queue[(idx - 1 + queue.length) % queue.length];
    set({ currentTrack: prevTrack, isPlaying: true, progress: 0 });
  },
  setProgress: (progress) => set({ progress }),
  setExpanded: (isExpanded) => set({ isExpanded }),
  stop: () => set({ currentTrack: null, isPlaying: false, progress: 0 }),
}));
