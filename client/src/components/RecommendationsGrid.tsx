import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Shuffle, Heart, Music, Share2, RefreshCw, ExternalLink } from "lucide-react";
import { useTracksStore, usePlayerStore, useMoodStore } from "@/store";
import { Mood, Track, MOOD_COLORS, MOOD_LABELS, MOOD_EMOJIS } from "@/types";
import { formatDuration } from "@/lib/utils";
import { getTracks } from "@/lib/api";
import toast from "react-hot-toast";

const allMoods: Mood[] = ["happy", "sad", "energetic", "calm", "focused"];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

function AlbumArt({ track, color, isCurrentTrack, isPlaying }: {
  track: Track;
  color: string;
  isCurrentTrack: boolean;
  isPlaying: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative aspect-square overflow-hidden">
      {imgError ? (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}
        >
          <Music size={40} className="text-white/20" />
        </div>
      ) : (
        <img
          src={track.albumArt}
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
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
      {isCurrentTrack && isPlaying && (
        <div className="absolute bottom-2 left-2 flex items-center gap-0.5">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-0.5 rounded-full"
              style={{ backgroundColor: color }}
              animate={{ height: [4, 12, 4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsGrid() {
  const { tracks, setTracks, setLoading } = useTracksStore();
  const { currentMood, setMood } = useMoodStore();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("moodtunes-favorites");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem(
      "moodtunes-favorites",
      JSON.stringify([...favorites])
    );
  }, [favorites]);

  if (!currentMood || tracks.length === 0) return null;

  const displayTracks = tracks.slice(0, 16);
  const color = MOOD_COLORS[currentMood];
  // Unique key from first track ID to force re-animation on fresh data
  const gridKey = `${currentMood}-${tracks[0]?.id ?? ""}`;

  const handleMoodFilter = async (mood: Mood) => {
    setMood(mood);
    setLoading(true);
    try {
      const newTracks = await getTracks(mood);
      setTracks(newTracks);
    } catch {
      toast.error("Failed to load tracks");
      setLoading(false);
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

  const handleShuffle = () => {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setTracks(shuffled);
    if (shuffled.length > 0) {
      play(shuffled[0], shuffled);
    }
    toast.success("Queue shuffled!");
  };

  const toggleFavorite = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
        toast("Removed from favorites", { icon: "💔" });
      } else {
        next.add(trackId);
        toast("Added to favorites!", { icon: "❤️" });
      }
      return next;
    });
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      play(tracks[0], tracks);
      toast.success(`Playing ${tracks.length} tracks`);
    }
  };

  const handleRefresh = async () => {
    if (!currentMood) return;
    setLoading(true);
    try {
      const newTracks = await getTracks(currentMood);
      setTracks(newTracks);
      toast.success("Fresh tracks loaded!");
    } catch {
      toast.error("Failed to refresh tracks");
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const emoji = MOOD_EMOJIS[currentMood];
    const label = MOOD_LABELS[currentMood];
    const trackList = displayTracks
      .slice(0, 5)
      .map((t) => `  🎵 ${t.title} — ${t.artist}`)
      .join("\n");
    const text = `${emoji} I'm feeling ${label} right now!\n\nMy MoodTunes playlist:\n${trackList}\n\n🎧 moodtunes.app`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Playlist copied to clipboard!");
    } catch {
      toast("Couldn't copy to clipboard", { icon: "📋" });
    }
  };

  return (
    <section className="px-4 py-8 sm:py-16 relative" id="recommendations">
      {/* Background mood gradient */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at center top, ${color}40, transparent 70%)`,
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.h2
          className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Your{" "}
          <span style={{ color }}>{MOOD_LABELS[currentMood]}</span>{" "}
          Playlist
        </motion.h2>

        {/* Mood filter chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {allMoods.map((mood) => (
            <motion.button
              key={mood}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMoodFilter(mood)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-mono transition-all cursor-pointer ${
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

        {/* Actions bar */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8 px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs text-muted-foreground font-mono">
            {tracks.length} tracks
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full text-xs font-mono glass text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Get new tracks"
            >
              <RefreshCw size={14} />
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full text-xs font-mono glass text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Share your playlist"
            >
              <Share2 size={14} />
              Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full text-xs font-mono glass text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Shuffle size={14} />
              Shuffle
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full text-xs font-mono text-white cursor-pointer"
              style={{ backgroundColor: color }}
            >
              <Play size={14} />
              Play All
            </motion.button>
          </div>
        </motion.div>

        {/* Track grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={gridKey}
        >
          <AnimatePresence mode="popLayout">
            {displayTracks.map((track) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const isFav = favorites.has(track.id);
              return (
                <motion.div
                  key={track.id}
                  variants={cardVariants}
                  layout
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl overflow-hidden group cursor-pointer relative"
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
                  {/* Favorite button */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => toggleFavorite(e, track.id)}
                    className="absolute top-2 right-2 z-20 w-9 h-9 sm:w-8 sm:h-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Heart
                      size={14}
                      className={isFav ? "text-red-400 fill-red-400" : "text-white/70"}
                    />
                  </motion.button>

                  <AlbumArt
                    track={track}
                    color={color}
                    isCurrentTrack={isCurrentTrack}
                    isPlaying={isPlaying}
                  />

                  <div className="p-3 sm:p-4">
                    <h3 className="font-heading font-bold text-xs sm:text-sm truncate">
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
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs font-mono" style={{ color }}>
                        {formatDuration(track.duration)}
                      </p>
                      {track.id.startsWith("dz-") && (
                        <a
                          href={`https://www.deezer.com/track/${track.id.slice(3)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                          title="Listen full song on Deezer"
                        >
                          <ExternalLink size={10} />
                          Full Song
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
