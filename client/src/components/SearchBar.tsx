import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Music, Play, Pause, Loader2 } from "lucide-react";
import { searchTracks } from "@/lib/api";
import { usePlayerStore, useMoodStore, useTracksStore } from "@/store";
import { Track, MOOD_COLORS } from "@/types";
import toast from "react-hot-toast";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentMood } = useMoodStore();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { setTracks } = useTracksStore();

  const color = currentMood ? MOOD_COLORS[currentMood] : "#7c6af7";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    try {
      const tracks = await searchTracks(trimmed, currentMood || undefined);
      setResults(tracks);
      if (tracks.length === 0) {
        toast("No results found", { icon: "🔍" });
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      play(track, results);
    }
  };

  const handlePlayAll = () => {
    if (results.length > 0) {
      setTracks(results);
      play(results[0], results);
      toast.success(`Playing ${results.length} search results`);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResults([]);
    setQuery("");
  };

  return (
    <>
      {/* Search trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <Search size={14} />
        Search songs...
      </motion.button>

      {/* Search overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={handleClose}
            />

            <div className="relative z-10 w-full max-w-2xl mx-auto mt-20 px-4">
              {/* Search input */}
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-3 glass rounded-2xl px-5 py-4">
                  {isSearching ? (
                    <Loader2 size={20} className="text-muted-foreground animate-spin" />
                  ) : (
                    <Search size={20} className="text-muted-foreground" />
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for songs, artists..."
                    className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none font-mono text-sm"
                  />
                  {query && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                        inputRef.current?.focus();
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X size={18} />
                    </motion.button>
                  )}
                </div>
              </form>

              {/* Results */}
              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div
                    className="mt-3 glass rounded-2xl overflow-hidden max-h-[60vh] overflow-y-auto"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {/* Play all header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                      <span className="text-xs text-muted-foreground font-mono">
                        {results.length} results
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-white cursor-pointer"
                        style={{ backgroundColor: color }}
                      >
                        <Play size={12} />
                        Play All
                      </motion.button>
                    </div>

                    {results.map((track) => {
                      const isCurrentTrack = currentTrack?.id === track.id;
                      return (
                        <motion.div
                          key={track.id}
                          className={`flex items-center gap-3 px-5 py-3 hover:bg-white/5 cursor-pointer transition-colors ${isCurrentTrack ? "bg-white/5" : ""}`}
                          onClick={() => handlePlayTrack(track)}
                          whileTap={{ scale: 0.99 }}
                        >
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
                                style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}
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
                              {track.artist}
                            </p>
                          </div>

                          {/* Play indicator */}
                          <div className="flex-shrink-0">
                            {isCurrentTrack && isPlaying ? (
                              <div className="flex items-center gap-0.5">
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
                            ) : (
                              <Play size={14} className="text-muted-foreground" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close hint */}
              <p className="text-center text-xs text-muted-foreground/50 font-mono mt-4">
                Press <kbd className="px-1.5 py-0.5 glass rounded text-[10px]">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
