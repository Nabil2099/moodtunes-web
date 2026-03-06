import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Music, Play, Pause, Loader2, Users, Disc3, ExternalLink } from "lucide-react";
import { searchTracks, searchArtists } from "@/lib/api";
import { usePlayerStore, useMoodStore, useTracksStore } from "@/store";
import { Track, Artist, MOOD_COLORS } from "@/types";
import toast from "react-hot-toast";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface SearchBarProps {
  onArtistSelect?: (artistId: number) => void;
}

export default function SearchBar({ onArtistSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"songs" | "artists">("songs");
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentMood } = useMoodStore();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { setTracks } = useTracksStore();

  const color = currentMood ? MOOD_COLORS[currentMood] : "#7c6af7";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setArtistResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const [tracks, artists] = await Promise.all([
        searchTracks(q.trim(), currentMood || undefined),
        searchArtists(q.trim()),
      ]);
      setResults(tracks);
      setArtistResults(artists);
    } catch {
      // silent fail for suggestions
    } finally {
      setIsSearching(false);
    }
  }, [currentMood]);

  // Debounced auto-search as user types
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setArtistResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, doSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(query);
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
    setArtistResults([]);
    setQuery("");
    setActiveTab("songs");
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
        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full glass text-xs sm:text-sm font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search songs...</span>
        <span className="sm:hidden">Search</span>
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
              className="absolute inset-0 bg-[#0a0a14]/95 backdrop-blur-2xl"
              onClick={handleClose}
            />

            <div className="relative z-10 w-full max-w-2xl mx-auto mt-4 sm:mt-20 px-4 safe-top">
              {/* Search input */}
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-3 bg-[#12121e] border border-white/10 rounded-2xl px-4 sm:px-5 py-3 sm:py-4">
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
                        setArtistResults([]);
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
                {(results.length > 0 || artistResults.length > 0) && (
                  <motion.div
                    className="mt-3 bg-[#12121e] border border-white/10 rounded-2xl overflow-hidden max-h-[70vh] sm:max-h-[60vh] flex flex-col"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                      <button
                        onClick={() => setActiveTab("songs")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono transition-colors ${
                          activeTab === "songs"
                            ? "text-foreground border-b-2"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={
                          activeTab === "songs"
                            ? { borderBottomColor: color }
                            : {}
                        }
                      >
                        <Music size={14} />
                        Songs ({results.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("artists")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono transition-colors ${
                          activeTab === "artists"
                            ? "text-foreground border-b-2"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={
                          activeTab === "artists"
                            ? { borderBottomColor: color }
                            : {}
                        }
                      >
                        <Users size={14} />
                        Artists ({artistResults.length})
                      </button>
                    </div>

                    <div className="overflow-y-auto">
                      {activeTab === "songs" ? (
                        <>
                    {/* Play all header */}
                    {results.length > 0 && (
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
                    )}

                    {results.map((track) => {
                      const isCurrentTrack = currentTrack?.id === track.id;
                      return (
                        <motion.div
                          key={track.id}
                          className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-3 hover:bg-white/5 cursor-pointer transition-colors ${isCurrentTrack ? "bg-white/5" : ""}`}
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

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {track.id.startsWith("dz-") && (
                              <a
                                href={`https://www.deezer.com/track/${track.id.slice(3)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                title="Listen full song on Deezer"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
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
                        </>
                      ) : (
                        /* Artists tab */
                        artistResults.length > 0 ? (
                          artistResults.map((artist) => (
                            <motion.div
                              key={artist.id}
                              className="flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-3 hover:bg-white/5 cursor-pointer transition-colors"
                              onClick={() => {
                                onArtistSelect?.(artist.id);
                                handleClose();
                              }}
                              whileTap={{ scale: 0.99 }}
                            >
                              {/* Artist picture */}
                              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                {artist.picture ? (
                                  <img
                                    src={artist.picture}
                                    alt={artist.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}
                                  >
                                    <Users size={18} className="text-white/25" />
                                  </div>
                                )}
                              </div>

                              {/* Artist info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-heading font-bold truncate">
                                  {artist.name}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                                  <span className="flex items-center gap-1">
                                    <Users size={10} />
                                    {formatNumber(artist.fans)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Disc3 size={10} />
                                    {artist.albums} albums
                                  </span>
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="flex-shrink-0 text-muted-foreground">
                                <Music size={14} />
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center py-12 text-muted-foreground font-mono text-sm">
                            No artists found
                          </div>
                        )
                      )}
                    </div>
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
