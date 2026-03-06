import { create } from "zustand";
import { Mood, MoodResult, Track, MOOD_COLORS } from "@/types";
import {
  loadTrack,
  playAudio,
  pauseAudio,
  seekTo,
  setVolume as setAudioVolume,
  getVolume,
  onTimeUpdate,
  onEnded,
} from "@/lib/audio";

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
  duration: number;
  volume: number;
  isExpanded: boolean;
  queue: Track[];
  play: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  seek: (time: number) => void;
  setExpanded: (v: boolean) => void;
  stop: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Wire up audio engine callbacks
  onTimeUpdate((time) => set({ progress: time }));
  onEnded(() => get().next());

  return {
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: getVolume(),
    isExpanded: false,
    queue: [],
    play: (track, queue) => {
      loadTrack(track.previewUrl);
      playAudio();
      set({
        currentTrack: track,
        isPlaying: true,
        progress: 0,
        duration: track.duration,
        queue: queue || get().queue,
      });
    },
    togglePlay: () => {
      const { isPlaying } = get();
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
      set({ isPlaying: !isPlaying });
    },
    next: () => {
      const { queue, currentTrack } = get();
      if (!currentTrack || queue.length === 0) return;
      const idx = queue.findIndex((t) => t.id === currentTrack.id);
      const nextTrack = queue[(idx + 1) % queue.length];
      loadTrack(nextTrack.previewUrl);
      playAudio();
      set({ currentTrack: nextTrack, isPlaying: true, progress: 0, duration: nextTrack.duration });
    },
    previous: () => {
      const { queue, currentTrack, progress } = get();
      if (!currentTrack || queue.length === 0) return;
      if (progress > 3) {
        seekTo(0);
        set({ progress: 0 });
        return;
      }
      const idx = queue.findIndex((t) => t.id === currentTrack.id);
      const prevTrack = queue[(idx - 1 + queue.length) % queue.length];
      loadTrack(prevTrack.previewUrl);
      playAudio();
      set({ currentTrack: prevTrack, isPlaying: true, progress: 0, duration: prevTrack.duration });
    },
    setProgress: (progress) => set({ progress }),
    setDuration: (duration) => set({ duration }),
    setVolume: (vol) => {
      setAudioVolume(vol);
      set({ volume: vol });
    },
    seek: (time) => {
      seekTo(time);
      set({ progress: time });
    },
    setExpanded: (isExpanded) => set({ isExpanded }),
    stop: () => {
      pauseAudio();
      set({ currentTrack: null, isPlaying: false, progress: 0, duration: 0 });
    },
  };
});
