import { useState, useCallback, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import FloatingNotes from "@/components/FloatingNotes";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MoodInput from "@/components/MoodInput";
import QuestionnaireModal from "@/components/QuestionnaireModal";
import RecommendationsGrid from "@/components/RecommendationsGrid";
import MiniPlayer from "@/components/MiniPlayer";
import MoodHistory from "@/components/MoodHistory";
import type { MoodEntry } from "@/components/MoodHistory";
import { useMoodStore, useTracksStore } from "@/store";
import { getTimeMood, getTracks } from "@/lib/api";
import { MOOD_COLORS } from "@/types";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";

export default function App() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const { setMoodResult, setAnalyzing, moodResult, method, currentMood } = useMoodStore();
  const { setTracks, setLoading } = useTracksStore();

  useKeyboardShortcuts();

  // Track mood history
  useEffect(() => {
    if (moodResult && method) {
      setMoodHistory((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          mood: moodResult.mood,
          method,
          confidence: moodResult.confidence,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 19), // keep last 20
      ]);
    }
  }, [moodResult, method]);

  const handleTextEntry = useCallback(() => {
    document.getElementById("mood-input")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleQuestionnaire = useCallback(() => {
    setShowQuestionnaire(true);
  }, []);

  const handleTimeDetect = useCallback(async () => {
    setAnalyzing(true);
    try {
      const result = await getTimeMood();
      setMoodResult(result, "time");
      toast.success(`Mood detected: ${result.mood}`);

      setLoading(true);
      const tracks = await getTracks(result.mood);
      setTracks(tracks);

      setTimeout(() => {
        document
          .getElementById("recommendations")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch {
      toast.error("Failed to detect mood from time");
      setAnalyzing(false);
    }
  }, [setAnalyzing, setMoodResult, setLoading, setTracks]);

  const moodColor = currentMood ? MOOD_COLORS[currentMood] : null;

  return (
    <div className="relative min-h-screen">
      {/* Ambient mood background glow */}
      {moodColor && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${moodColor}12 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, ${moodColor}08 0%, transparent 50%)`,
          }}
        />
      )}

      <FloatingNotes />

      <Header
        onTextEntry={handleTextEntry}
        onQuestionnaire={handleQuestionnaire}
        onTimeDetect={handleTimeDetect}
      />

      <HeroSection
        onTextEntry={handleTextEntry}
        onQuestionnaire={handleQuestionnaire}
        onTimeDetect={handleTimeDetect}
      />

      {/* Always visible — user can type anytime */}
      <MoodInput />

      <QuestionnaireModal
        isOpen={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
      />

      <RecommendationsGrid />

      <MoodHistory
        entries={moodHistory}
        onClear={() => setMoodHistory([])}
      />

      <MiniPlayer />

      {/* Spacer for mini player */}
      <div className="h-20" />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(20, 20, 30, 0.95)",
            color: "#f0f0f5",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}
