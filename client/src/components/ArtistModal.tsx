import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  Music,
  Users,
  Disc3,
  Loader2,
} from "lucide-react";
import { getArtistDetail } from "@/lib/api";
import { usePlayerStore, useMoodStore } from "@/store";
import { Track, ArtistDetail, MOOD_COLORS } from "@/types";
import toast from "react-hot-toast";

interface ArtistModalProps {
  artistId: number | null;
  onClose: () => void;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function ArtistModal({ artistId, onClose }: ArtistModalProps) {
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { currentMood } = useMoodStore();

  const color = currentMood ? MOOD_COLORS[currentMood] : "#7c6af7";

  useEffect(() => {
    if (!artistId) return;
    setLoading(true);
    setArtist(null);
    getArtistDetail(artistId)
      .then(setArtist)
      .catch(() => toast.error("Failed to load artist"))
      .finally(() => setLoading(false));
  }, [artistId]);

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      play(track, artist?.topTracks || []);
    }
  };

  const handlePlayAll = () => {
    if (artist && artist.topTracks.length > 0) {
      play(artist.topTracks[0], artist.topTracks);
      toast.success(`Playing ${artist.name}'s top tracks`);
    }
  };

  return (
    <AnimatePresence>
      {artistId && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-2xl mx-auto mt-4 sm:mt-12 px-4 safe-top max-h-[90vh] flex flex-col"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="glass rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Close button */}
              <div className="flex justify-end p-4 pb-0">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </motion.button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-muted-foreground" />
                </div>
              ) : artist ? (
                <>
                  {/* Artist header */}
                  <div className="flex flex-col items-center px-6 pb-4">
                    <div
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden mb-4 shadow-2xl"
                      style={{ boxShadow: `0 10px 40px ${color}30` }}
                    >
                      {artist.picture ? (
                        <img
                          src={artist.picture}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${color}40, ${color}15)` }}
                        >
                          <Music size={40} className="text-white/25" />
                        </div>
                      )}
                    </div>

                    <h2 className="font-heading text-xl sm:text-2xl font-bold text-center mb-2">
                      {artist.name}
                    </h2>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono mb-4">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {formatNumber(artist.fans)} fans
                      </span>
                      <span className="flex items-center gap-1">
                        <Disc3 size={12} />
                        {artist.albums} albums
                      </span>
                    </div>

                    {artist.topTracks.length > 0 && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayAll}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-mono text-white cursor-pointer"
                        style={{ backgroundColor: color }}
                      >
                        <Play size={14} />
                        Play All ({artist.topTracks.length})
                      </motion.button>
                    )}
                  </div>

                  {/* Track list */}
                  <div className="flex-1 overflow-y-auto border-t border-white/10">
                    <div className="px-4 sm:px-5 py-3">
                      <h3 className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
                        Top Tracks
                      </h3>
                    </div>
                    {artist.topTracks.map((track, i) => {
                      const isCurrentTrack = currentTrack?.id === track.id;
                      return (
                        <motion.div
                          key={track.id}
                          className={`flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-white/5 cursor-pointer transition-colors ${isCurrentTrack ? "bg-white/5" : ""}`}
                          onClick={() => handlePlayTrack(track)}
                          whileTap={{ scale: 0.99 }}
                        >
                          {/* Track number */}
                          <span className="w-6 text-right text-xs text-muted-foreground font-mono flex-shrink-0">
                            {i + 1}
                          </span>

                          {/* Album art */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            {track.albumArt ? (
                              <img
                                src={track.albumArt}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                                }}
                              >
                                <Music size={16} className="text-white/25" />
                              </div>
                            )}
                          </div>

                          {/* Track info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-heading font-bold truncate">
                              {track.title}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {track.description}
                            </p>
                          </div>

                          {/* Play indicator */}
                          <div className="flex-shrink-0">
                            {isCurrentTrack && isPlaying ? (
                              <div className="flex items-center gap-0.5">
                                {[...Array(3)].map((_, j) => (
                                  <motion.div
                                    key={j}
                                    className="w-0.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: Infinity,
                                      delay: j * 0.15,
                                    }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <Play
                                size={14}
                                className="text-muted-foreground"
                              />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-20 text-muted-foreground font-mono text-sm">
                  Artist not found
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
