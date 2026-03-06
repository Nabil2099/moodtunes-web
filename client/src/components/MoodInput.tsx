import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { useMoodStore } from "@/store";
import { analyzeMood, getTracks } from "@/lib/api";
import { useTracksStore } from "@/store";
import WaveformLoader from "./WaveformLoader";
import MoodBadge from "./MoodBadge";
import toast from "react-hot-toast";

export default function MoodInput() {
  const [text, setText] = useState("");
  const { isAnalyzing, setAnalyzing, setMoodResult, moodResult } =
    useMoodStore();
  const { setTracks, setLoading } = useTracksStore();

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("Please tell us how you're feeling");
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeMood(text);
      setMoodResult(result, "text");
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
      toast.error("Failed to analyze mood. Please try again.");
      setAnalyzing(false);
    }
  };

  return (
    <section
      id="mood-input"
      className="min-h-[50vh] sm:min-h-[60vh] flex flex-col items-center justify-center px-4 py-8 sm:py-16"
    >
      <motion.h2
        className="font-heading text-2xl sm:text-3xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        How are you feeling right now?
      </motion.h2>

      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I'm feeling peaceful and grateful today..."
            className="w-full h-28 sm:h-36 p-4 sm:p-6 rounded-2xl glass resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm sm:text-base transition-shadow"
            style={{
              boxShadow: text
                ? "0 0 40px rgba(124, 106, 247, 0.15)"
                : "none",
            }}
            maxLength={1000}
            disabled={isAnalyzing}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={isAnalyzing || !text.trim()}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {isAnalyzing && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WaveformLoader />
            </motion.div>
          )}

          {moodResult && !isAnalyzing && (
            <motion.div
              key="result"
              className="flex justify-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MoodBadge
                mood={moodResult.mood}
                confidence={moodResult.confidence}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
