import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronUp,
  ChevronDown,
  Music,
  ListMusic,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayerStore, useMoodStore } from "@/store";
import { MOOD_COLORS } from "@/types";
import { formatDuration } from "@/lib/utils";

function PlayerAlbumArt({
  src,
  alt,
  color,
  className,
}: {
  src: string;
  alt: string;
  color: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: `linear-gradient(135deg, ${color}40, ${color}15)` }}
      >
        <Music size={48} className="text-white/25" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isExpanded,
    queue,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    setExpanded,
  } = usePlayerStore();
  const { currentMood } = useMoodStore();
  const [prevVolume, setPrevVolume] = useState(0.8);

  const color = currentMood ? MOOD_COLORS[currentMood] : "#7c6af7";

  if (!currentTrack) return null;

  const trackDuration = duration || currentTrack.duration || 30;
  const progressPercent = Math.min((progress / trackDuration) * 100, 100);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * trackDuration);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.8);
    }
  };

  return (
    <>
      {/* Mini player bar */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10 safe-bottom"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Progress bar — clickable to seek */}
            <div
              className="h-1 bg-white/10 w-full cursor-pointer group/bar"
              onClick={handleSeek}
            >
              <motion.div
                className="h-full"
                style={{ backgroundColor: color, width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 max-w-6xl mx-auto">
              {/* Album art */}
              <motion.div
                className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  isPlaying
                    ? { duration: 8, repeat: Infinity, ease: "linear" }
                    : { duration: 0.3 }
                }
              >
                <PlayerAlbumArt
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  color={color}
                  className="w-full h-full"
                />
              </motion.div>

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
              <div className="flex items-center gap-1 sm:gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={previous}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <SkipBack size={16} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
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
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <SkipForward size={16} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpanded(true)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
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
            className="fixed inset-0 z-50 flex flex-col"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Background */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${color}25 0%, #080810 50%, #080810 100%)`,
              }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 safe-top">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setExpanded(false)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <ChevronDown size={20} />
              </motion.button>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <ListMusic size={14} />
                <span>
                  {queue.length > 0
                    ? `${queue.findIndex((t) => t.id === currentTrack.id) + 1} / ${queue.length}`
                    : "1 / 1"}
                </span>
              </div>
              <div className="w-10" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
              {/* Album art */}
              <motion.div
                className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden shadow-2xl mb-6 sm:mb-8"
                style={{ boxShadow: `0 20px 60px ${color}30` }}
                animate={
                  isPlaying
                    ? { scale: [1, 1.02, 1], rotate: [0, 1, -1, 0] }
                    : { scale: 0.95 }
                }
                transition={
                  isPlaying
                    ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.3 }
                }
              >
                <PlayerAlbumArt
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  color={color}
                  className="w-full h-full"
                />
              </motion.div>

              {/* Track info */}
              <motion.div
                className="w-full max-w-sm text-center mb-4 sm:mb-6 px-2"
                key={currentTrack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-heading text-xl sm:text-2xl font-bold mb-1 truncate">
                  {currentTrack.title}
                </h3>
                <p className="text-muted-foreground font-mono text-sm mb-2">
                  {currentTrack.artist}
                </p>
                {currentTrack.description && (
                  <p className="text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed">
                    {currentTrack.description}
                  </p>
                )}
              </motion.div>

              {/* Progress bar — clickable to seek */}
              <div className="w-full max-w-sm mb-4 sm:mb-6 px-2">
                <div
                  className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                  onClick={handleSeek}
                >
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
                  <span>{formatDuration(trackDuration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 sm:gap-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={previous}
                  className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground"
                >
                  <SkipBack size={22} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 30px ${color}40`,
                  }}
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

              {/* Volume control */}
              <div className="flex items-center gap-3 mt-4 sm:mt-6 w-full max-w-[200px] safe-bottom">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </motion.button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-current"
                  style={{ accentColor: color }}
                />
              </div>

              {/* Equalizer visualization when playing */}
              {isPlaying && (
                <motion.div
                  className="flex items-end gap-1 mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full"
                      style={{ backgroundColor: `${color}80` }}
                      animate={{
                        height: [
                          4 + Math.random() * 8,
                          12 + Math.random() * 16,
                          4 + Math.random() * 8,
                        ],
                      }}
                      transition={{
                        duration: 0.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.08,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
