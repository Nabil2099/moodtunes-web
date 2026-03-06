import { motion, AnimatePresence } from "framer-motion";
import { History, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { Mood, MOOD_COLORS, MOOD_EMOJIS, MOOD_LABELS } from "@/types";
import { useMoodStore, useTracksStore } from "@/store";
import { getTracks } from "@/lib/api";
import toast from "react-hot-toast";

export interface MoodEntry {
  id: string;
  mood: Mood;
  method: "text" | "questionnaire" | "time";
  confidence: number;
  timestamp: number;
}

interface MoodHistoryProps {
  entries: MoodEntry[];
  onClear: () => void;
}

const methodLabels: Record<string, string> = {
  text: "Text",
  questionnaire: "Quiz",
  time: "Auto",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MoodHistory({ entries, onClear }: MoodHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setMood } = useMoodStore();
  const { setTracks, setLoading } = useTracksStore();

  const handleReplay = async (entry: MoodEntry) => {
    setMood(entry.mood);
    setLoading(true);
    try {
      const tracks = await getTracks(entry.mood);
      setTracks(tracks);
      setIsOpen(false);
      document.getElementById("recommendations")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      toast.error("Failed to load tracks");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {entries.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full glass flex items-center justify-center cursor-pointer group"
        >
          <History size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-mono">
            {entries.length}
          </span>
        </motion.button>
      )}

      {/* Slide-out panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-sm h-full glass border-l border-white/10 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="sticky top-0 glass border-b border-white/10 px-4 py-4 flex items-center justify-between z-10">
                <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                  <History size={18} />
                  Mood History
                </h3>
                <div className="flex items-center gap-2">
                  {entries.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onClear}
                      className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                      title="Clear history"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <AnimatePresence>
                  {entries.map((entry, i) => (
                    <motion.button
                      key={entry.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleReplay(entry)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ backgroundColor: `${MOOD_COLORS[entry.mood]}20` }}
                      >
                        {MOOD_EMOJIS[entry.mood]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-sm" style={{ color: MOOD_COLORS[entry.mood] }}>
                          {MOOD_LABELS[entry.mood]}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {methodLabels[entry.method]} · {Math.round(entry.confidence * 100)}% · {timeAgo(entry.timestamp)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        Replay →
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
                {entries.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm font-mono py-8">
                    No mood history yet
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
