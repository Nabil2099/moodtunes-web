import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useTracksStore, usePlayerStore, useMoodStore } from "@/store";
import { Mood, MOOD_COLORS, MOOD_LABELS } from "@/types";
import { formatDuration } from "@/lib/utils";
import { getTracks } from "@/lib/api";
import toast from "react-hot-toast";

const allMoods: Mood[] = ["happy", "sad", "energetic", "calm", "focused"];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function RecommendationsGrid() {
  const { tracks, setTracks, setLoading } = useTracksStore();
  const { currentMood, setMood } = useMoodStore();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  if (!currentMood || tracks.length === 0) return null;

  const displayTracks = tracks.slice(0, 12);
  const color = MOOD_COLORS[currentMood];

  const handleMoodFilter = async (mood: Mood) => {
    setMood(mood);
    setLoading(true);
    try {
      const newTracks = await getTracks(mood);
      setTracks(newTracks);
    } catch {
      toast.error("Failed to load tracks");
    }
  };

  const handlePlay = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    if (currentTrack?.id === trackId) {
      togglePlay();
    } else {
      play(track, tracks);
    }
  };

  return (
    <section className="px-4 py-16 relative" id="recommendations">
      {/* Background mood gradient */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at center top, ${color}40, transparent 70%)`,
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.h2
          className="font-heading text-2xl sm:text-3xl font-bold text-center mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Your{" "}
          <span style={{ color }}>{MOOD_LABELS[currentMood]}</span>{" "}
          Playlist
        </motion.h2>

        {/* Mood filter chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {allMoods.map((mood) => (
            <motion.button
              key={mood}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMoodFilter(mood)}
              className={`px-4 py-2 rounded-full text-sm font-mono transition-all cursor-pointer ${
                currentMood === mood
                  ? "text-white"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
              style={
                currentMood === mood
                  ? {
                      backgroundColor: MOOD_COLORS[mood],
                      boxShadow: `0 0 20px ${MOOD_COLORS[mood]}40`,
                    }
                  : {}
              }
            >
              {MOOD_LABELS[mood]}
            </motion.button>
          ))}
        </motion.div>

        {/* Track grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {displayTracks.map((track) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            return (
              <motion.div
                key={track.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl overflow-hidden group cursor-pointer"
                style={
                  isCurrentTrack
                    ? {
                        borderColor: `${color}60`,
                        boxShadow: `0 0 20px ${color}20`,
                      }
                    : {}
                }
                onClick={() => handlePlay(track.id)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      {isCurrentTrack && isPlaying ? (
                        <Pause size={24} className="text-white" />
                      ) : (
                        <Play size={24} className="text-white ml-1" />
                      )}
                    </motion.div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-heading font-bold text-sm truncate">
                    {track.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                    {track.artist}
                  </p>
                  {track.description && (
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed">
                      {track.description}
                    </p>
                  )}
                  <p className="text-xs font-mono mt-2" style={{ color }}>
                    {formatDuration(track.duration)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
