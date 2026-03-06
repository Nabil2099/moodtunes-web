import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, BarChart3, Music, TrendingUp, Disc3, Play,
  Loader2, Brain, Zap, Heart, Target, Coffee, Moon,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { usePlayerStore } from "@/store";
import { getInsights, getDJPlaylist, getForYou } from "@/lib/api";
import type { MoodInsights, DJJourney, Track, Mood } from "@/types";
import { MOOD_COLORS, MOOD_EMOJIS, MOOD_LABELS } from "@/types";

const MOOD_ICONS: Record<Mood, typeof Heart> = {
  happy: Heart,
  sad: Coffee,
  energetic: Zap,
  calm: Moon,
  focused: Target,
};

type Tab = "insights" | "dj" | "foryou";

interface AIDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIDashboard({ isOpen, onClose }: AIDashboardProps) {
  const { user } = useAuthStore();
  const { play } = usePlayerStore();
  const [tab, setTab] = useState<Tab>("insights");
  const [insights, setInsights] = useState<MoodInsights | null>(null);
  const [djData, setDjData] = useState<DJJourney | null>(null);
  const [forYouTracks, setForYouTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [djMood, setDjMood] = useState<Mood>("calm");

  useEffect(() => {
    if (isOpen && user) {
      loadTab(tab);
    }
  }, [isOpen, user]);

  const loadTab = async (t: Tab) => {
    setTab(t);
    if (!user) return;
    setLoading(true);

    try {
      if (t === "insights" && !insights) {
        const data = await getInsights();
        setInsights(data);
      } else if (t === "foryou") {
        const data = await getForYou();
        setForYouTracks(data.tracks);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleDJ = async () => {
    setLoading(true);
    try {
      const data = await getDJPlaylist(djMood, 5);
      setDjData(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const playAllDJ = () => {
    if (!djData) return;
    const allTracks = djData.steps.flatMap((s) => s.tracks);
    if (allTracks.length > 0) {
      play(allTracks[0], allTracks);
    }
  };

  if (!isOpen) return null;

  const trendEmoji =
    insights?.recentTrend === "improving" ? "📈" :
    insights?.recentTrend === "declining" ? "📉" :
    insights?.recentTrend === "varied" ? "🎭" : "➡️";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
          style={{ background: "#0d0d1a" }}
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <div className="h-1 bg-gradient-to-r from-mood-calm via-mood-happy to-mood-energetic" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Brain size={20} className="text-primary" />
              <h2 className="font-heading font-bold text-lg text-foreground">AI Dashboard</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 py-3 border-b border-white/5">
            {([
              { id: "insights", label: "Insights", icon: BarChart3 },
              { id: "dj", label: "AI DJ", icon: Disc3 },
              { id: "foryou", label: "For You", icon: Sparkles },
            ] as { id: Tab; label: string; icon: typeof BarChart3 }[]).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => loadTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    tab === t.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}

            {!loading && tab === "insights" && (
              <>
                {!user ? (
                  <p className="text-center text-muted-foreground py-8">Sign in to see your mood insights</p>
                ) : insights ? (
                  <>
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <StatCard label="Sessions" value={insights.totalSessions.toString()} />
                      <StatCard label="Top Mood" value={MOOD_EMOJIS[insights.mostFrequentMood] + " " + MOOD_LABELS[insights.mostFrequentMood]} />
                      <StatCard label="Trend" value={`${trendEmoji} ${insights.recentTrend}`} />
                      <StatCard
                        label="Streak"
                        value={
                          insights.currentStreak
                            ? `${MOOD_EMOJIS[insights.currentStreak.mood]} x${insights.currentStreak.count}`
                            : "—"
                        }
                      />
                    </div>

                    {/* Mood distribution */}
                    <div>
                      <h3 className="text-sm font-mono text-muted-foreground mb-3">Mood Distribution</h3>
                      <div className="space-y-2">
                        {(Object.entries(insights.moodDistribution) as [Mood, number][])
                          .sort((a, b) => b[1] - a[1])
                          .map(([mood, count]) => {
                            const total = Object.values(insights.moodDistribution).reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            const Icon = MOOD_ICONS[mood];
                            return (
                              <div key={mood} className="flex items-center gap-3">
                                <div className="flex items-center gap-2 w-24">
                                  <Icon size={14} style={{ color: MOOD_COLORS[mood] }} />
                                  <span className="text-xs font-mono text-muted-foreground capitalize">{mood}</span>
                                </div>
                                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: MOOD_COLORS[mood] }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, delay: 0.1 }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                                  {Math.round(pct)}%
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Listens by day */}
                    <div>
                      <h3 className="text-sm font-mono text-muted-foreground mb-3">Listens by Day</h3>
                      <div className="flex items-end gap-2 h-20">
                        {insights.listensByDay.map((d) => {
                          const max = Math.max(...insights.listensByDay.map((x) => x.count), 1);
                          const h = (d.count / max) * 100;
                          return (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                              <motion.div
                                className="w-full rounded-t bg-primary/30"
                                style={{ minHeight: 4 }}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(h, 5)}%` }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                              />
                              <span className="text-[10px] font-mono text-muted-foreground">{d.day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top artists */}
                    {insights.topArtists.length > 0 && (
                      <div>
                        <h3 className="text-sm font-mono text-muted-foreground mb-3">Top Artists</h3>
                        <div className="flex flex-wrap gap-2">
                          {insights.topArtists.map((a) => (
                            <span key={a.name} className="px-3 py-1.5 rounded-full bg-white/5 text-xs font-mono text-foreground border border-white/5">
                              {a.name} <span className="text-muted-foreground">({a.count})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Start listening to build your mood profile!
                  </p>
                )}
              </>
            )}

            {!loading && tab === "dj" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Disc3 size={32} className="mx-auto text-primary" />
                  <h3 className="font-heading font-bold text-foreground">AI DJ Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a mood journey — the AI picks songs that smoothly transition between moods
                  </p>
                </div>

                {/* Mood picker */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {(["happy", "sad", "energetic", "calm", "focused"] as Mood[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setDjMood(m)}
                      className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                        djMood === m
                          ? "text-white border-2"
                          : "text-muted-foreground border border-white/10 hover:border-white/20"
                      }`}
                      style={djMood === m ? { borderColor: MOOD_COLORS[m], background: MOOD_COLORS[m] + "20" } : {}}
                    >
                      {MOOD_EMOJIS[m]} {MOOD_LABELS[m]}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDJ}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer"
                >
                  <Sparkles size={16} />
                  Generate DJ Playlist
                </motion.button>

                {/* DJ Results */}
                {djData && (
                  <div className="space-y-4">
                    {/* Journey visualization */}
                    <div className="flex items-center justify-center gap-1 py-3">
                      {djData.journey.map((mood, i) => (
                        <div key={i} className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                            style={{ background: MOOD_COLORS[mood] + "30" }}
                          >
                            {MOOD_EMOJIS[mood]}
                          </div>
                          {i < djData.journey.length - 1 && (
                            <div className="w-6 h-0.5 bg-white/10" />
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={playAllDJ}
                      className="w-full py-2 rounded-xl bg-white/5 text-foreground text-sm font-mono flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Play size={14} /> Play Full Journey ({djData.totalTracks} tracks)
                    </button>

                    {/* Steps */}
                    {djData.steps.map((step) => (
                      <div key={step.step} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ background: MOOD_COLORS[step.mood] + "30" }}
                          >
                            {step.step}
                          </div>
                          <span className="text-xs font-mono" style={{ color: MOOD_COLORS[step.mood] }}>
                            {MOOD_EMOJIS[step.mood]} {MOOD_LABELS[step.mood]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {step.tracks.length} tracks
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {step.tracks.slice(0, 4).map((track) => (
                            <button
                              key={track.id}
                              onClick={() => play(track, step.tracks)}
                              className="flex items-center gap-3 p-2 rounded-lg bg-white/3 hover:bg-white/5 transition-colors cursor-pointer text-left"
                            >
                              <img src={track.albumArt} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{track.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                              </div>
                              <Play size={12} className="text-muted-foreground flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!loading && tab === "foryou" && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <Sparkles size={32} className="mx-auto text-primary" />
                  <h3 className="font-heading font-bold text-foreground">For You</h3>
                  <p className="text-sm text-muted-foreground">
                    {user ? "Personalized picks based on your listening history" : "Sign in to get personalized recommendations"}
                  </p>
                </div>

                {forYouTracks.length > 0 ? (
                  <>
                    <button
                      onClick={() => {
                        if (forYouTracks.length > 0) play(forYouTracks[0], forYouTracks);
                      }}
                      className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-mono flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <Play size={14} /> Play All ({forYouTracks.length} tracks)
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {forYouTracks.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => play(track, forYouTracks)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors cursor-pointer text-left group"
                        >
                          <img src={track.albumArt} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>
                          <Play size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : !user ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    Sign in and start listening to get AI recommendations
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/3 border border-white/5">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
