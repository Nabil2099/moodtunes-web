import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, ChevronUp, X } from "lucide-react";
import { usePlayerStore, useMoodStore } from "@/store";
import { MOOD_COLORS } from "@/types";
import { formatDuration } from "@/lib/utils";

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    isExpanded,
    togglePlay,
    next,
    setProgress,
    setExpanded,
  } = usePlayerStore();
  const { currentMood } = useMoodStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const color = currentMood ? MOOD_COLORS[currentMood] : "#7c6af7";

  // Simulate playback progress
  useEffect(() => {
    if (isPlaying && currentTrack) {
      intervalRef.current = setInterval(() => {
        setProgress(
          usePlayerStore.getState().progress + 1
        );
        if (usePlayerStore.getState().progress >= currentTrack.duration) {
          next();
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentTrack, next, setProgress]);

  if (!currentTrack) return null;

  const progressPercent = Math.min(
    (progress / currentTrack.duration) * 100,
    100
  );

  return (
    <>
      {/* Mini player bar */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Progress bar */}
            <div className="h-0.5 bg-white/10 w-full">
              <motion.div
                className="h-full"
                style={{ backgroundColor: color, width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 max-w-6xl mx-auto">
              {/* Album art */}
              <motion.img
                src={currentTrack.albumArt}
                alt={currentTrack.title}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  isPlaying
                    ? { duration: 8, repeat: Infinity, ease: "linear" }
                    : { duration: 0.3 }
                }
              />

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-bold truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  {isPlaying ? (
                    <Pause size={18} className="text-white" />
                  ) : (
                    <Play size={18} className="text-white ml-0.5" />
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={next}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <SkipForward size={16} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpanded(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${color}30 0%, #080810 60%)`,
              }}
            />

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
              <button
                onClick={() => setExpanded(false)}
                className="absolute -top-2 right-0 text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>

              {/* Album art */}
              <motion.div
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl mb-8"
                style={{ boxShadow: `0 20px 60px ${color}30` }}
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={
                  isPlaying
                    ? { duration: 20, repeat: Infinity, ease: "linear" }
                    : { duration: 0 }
                }
              >
                <img
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Track info */}
              <h3 className="font-heading text-2xl font-bold text-center mb-1">
                {currentTrack.title}
              </h3>
              <p className="text-muted-foreground font-mono text-sm mb-8">
                {currentTrack.artist}
              </p>

              {/* Progress bar */}
              <div className="w-full mb-2">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: color,
                      width: `${progressPercent}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
                  <span>{formatDuration(progress)}</span>
                  <span>{formatDuration(currentTrack.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-8 mt-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  {isPlaying ? (
                    <Pause size={28} className="text-white" />
                  ) : (
                    <Play size={28} className="text-white ml-1" />
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={next}
                  className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground"
                >
                  <SkipForward size={22} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
