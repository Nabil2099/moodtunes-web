import { useState, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import FloatingNotes from "@/components/FloatingNotes";
import HeroSection from "@/components/HeroSection";
import MoodInput from "@/components/MoodInput";
import QuestionnaireModal from "@/components/QuestionnaireModal";
import RecommendationsGrid from "@/components/RecommendationsGrid";
import MiniPlayer from "@/components/MiniPlayer";
import { useMoodStore, useTracksStore } from "@/store";
import { getTimeMood, getTracks } from "@/lib/api";

export default function App() {
  const [showMoodInput, setShowMoodInput] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const { setMoodResult, setAnalyzing } = useMoodStore();
  const { setTracks, setLoading } = useTracksStore();

  const handleTextEntry = useCallback(() => {
    setShowMoodInput(true);
    setTimeout(() => {
      document.getElementById("mood-input")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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

      setShowMoodInput(true);
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

  return (
    <div className="relative min-h-screen">
      <FloatingNotes />

      <HeroSection
        onTextEntry={handleTextEntry}
        onQuestionnaire={handleQuestionnaire}
        onTimeDetect={handleTimeDetect}
      />

      {showMoodInput && <MoodInput />}

      <QuestionnaireModal
        isOpen={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
      />

      <RecommendationsGrid />

      <MiniPlayer />

      {/* Spacer for mini player */}
      <div className="h-20" />

      <Toaster
        position="top-right"
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
