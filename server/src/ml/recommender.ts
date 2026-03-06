import prisma from "../lib/prisma";
import { Mood } from "../types";

// ─── TASTE PROFILE ──────────────────────────────────
interface TasteProfile {
  moodDistribution: Record<Mood, number>;
  topArtists: { name: string; count: number }[];
  totalListens: number;
  favoriteCount: number;
  avgMood: Mood;
  timePreferences: Record<string, Mood>; // "morning" | "afternoon" | "evening" | "night"
}

export async function buildTasteProfile(userId: string): Promise<TasteProfile> {
  const [history, favorites] = await Promise.all([
    prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: 500,
    }),
    prisma.userFavorite.findMany({ where: { userId } }),
  ]);

  // Mood distribution (weighted — recent listens count more)
  const moodDist: Record<Mood, number> = { happy: 0, sad: 0, energetic: 0, calm: 0, focused: 0 };
  history.forEach((h, i) => {
    const recency = 1 + (history.length - i) / history.length; // 1–2x weight
    if (h.mood in moodDist) {
      moodDist[h.mood as Mood] += recency;
    }
  });

  // Boost from favorites
  favorites.forEach((f) => {
    if (f.mood in moodDist) {
      moodDist[f.mood as Mood] += 2;
    }
  });

  // Top artists
  const artistCounts: Record<string, number> = {};
  history.forEach((h) => {
    artistCounts[h.artistName] = (artistCounts[h.artistName] || 0) + 1;
  });
  favorites.forEach((f) => {
    artistCounts[f.artistName] = (artistCounts[f.artistName] || 0) + 3;
  });

  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  // Average mood
  const avgMood = (Object.entries(moodDist) as [Mood, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "calm";

  // Time preferences
  const timeBuckets: Record<string, Record<Mood, number>> = {
    morning: { happy: 0, sad: 0, energetic: 0, calm: 0, focused: 0 },
    afternoon: { happy: 0, sad: 0, energetic: 0, calm: 0, focused: 0 },
    evening: { happy: 0, sad: 0, energetic: 0, calm: 0, focused: 0 },
    night: { happy: 0, sad: 0, energetic: 0, calm: 0, focused: 0 },
  };

  history.forEach((h) => {
    const hour = new Date(h.playedAt).getHours();
    let period = "night";
    if (hour >= 5 && hour < 12) period = "morning";
    else if (hour >= 12 && hour < 17) period = "afternoon";
    else if (hour >= 17 && hour < 21) period = "evening";

    if (h.mood in timeBuckets[period]) {
      timeBuckets[period][h.mood as Mood]++;
    }
  });

  const timePreferences: Record<string, Mood> = {};
  for (const [period, moods] of Object.entries(timeBuckets)) {
    const top = (Object.entries(moods) as [Mood, number][])
      .sort((a, b) => b[1] - a[1])[0];
    timePreferences[period] = top[1] > 0 ? top[0] : "calm";
  }

  return {
    moodDistribution: moodDist,
    topArtists,
    totalListens: history.length,
    favoriteCount: favorites.length,
    avgMood,
    timePreferences,
  };
}

// ─── MOOD INSIGHTS ──────────────────────────────────
export interface MoodInsights {
  currentStreak: { mood: Mood; count: number } | null;
  moodDistribution: Record<Mood, number>;
  totalSessions: number;
  mostFrequentMood: Mood;
  recentTrend: "improving" | "declining" | "stable" | "varied";
  topArtists: { name: string; count: number }[];
  listensByDay: { day: string; count: number }[];
}

export async function getMoodInsights(userId: string): Promise<MoodInsights> {
  const [sessions, history] = await Promise.all([
    prisma.moodSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: 200,
    }),
  ]);

  // Mood distribution from sessions
  const moodDist: Record<Mood, number> = { happy: 0, sad: 0, energetic: 0, calm: 0, focused: 0 };
  sessions.forEach((s) => {
    if (s.mood in moodDist) moodDist[s.mood as Mood]++;
  });

  // Current streak
  let currentStreak: MoodInsights["currentStreak"] = null;
  if (sessions.length > 0) {
    const firstMood = sessions[0].mood as Mood;
    let count = 1;
    for (let i = 1; i < sessions.length; i++) {
      if (sessions[i].mood === firstMood) count++;
      else break;
    }
    currentStreak = { mood: firstMood, count };
  }

  // Most frequent
  const mostFrequentMood = (Object.entries(moodDist) as [Mood, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "calm";

  // Recent trend (last 10 vs previous 10 sessions)
  const positiveScore = (m: string) => (m === "happy" || m === "energetic" ? 1 : m === "calm" || m === "focused" ? 0 : -1);
  const recent10 = sessions.slice(0, 10);
  const prev10 = sessions.slice(10, 20);

  let recentTrend: MoodInsights["recentTrend"] = "stable";
  if (recent10.length >= 5 && prev10.length >= 5) {
    const recentAvg = recent10.reduce((s, m) => s + positiveScore(m.mood), 0) / recent10.length;
    const prevAvg = prev10.reduce((s, m) => s + positiveScore(m.mood), 0) / prev10.length;
    const diff = recentAvg - prevAvg;
    if (diff > 0.3) recentTrend = "improving";
    else if (diff < -0.3) recentTrend = "declining";

    const uniqueMoods = new Set(recent10.map((s) => s.mood));
    if (uniqueMoods.size >= 4) recentTrend = "varied";
  }

  // Top artists from history
  const artistCounts: Record<string, number> = {};
  history.forEach((h) => {
    artistCounts[h.artistName] = (artistCounts[h.artistName] || 0) + 1;
  });
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Listens by day of week
  const dayCounts: Record<string, number> = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach((d) => (dayCounts[d] = 0));
  history.forEach((h) => {
    const day = dayNames[new Date(h.playedAt).getDay()];
    dayCounts[day]++;
  });
  const listensByDay = dayNames.map((day) => ({ day, count: dayCounts[day] }));

  return {
    currentStreak,
    moodDistribution: moodDist,
    totalSessions: sessions.length,
    mostFrequentMood,
    recentTrend,
    topArtists,
    listensByDay,
  };
}

// ─── AI DJ — MOOD JOURNEY GENERATOR ─────────────────
const MOOD_TRANSITIONS: Record<Mood, Mood[]> = {
  sad: ["calm", "focused", "happy"],
  calm: ["focused", "happy", "calm"],
  focused: ["calm", "energetic", "happy"],
  happy: ["energetic", "happy", "calm"],
  energetic: ["happy", "energetic", "focused"],
};

export function generateMoodJourney(startMood: Mood, steps: number = 5): Mood[] {
  const journey: Mood[] = [startMood];
  let current = startMood;

  for (let i = 1; i < steps; i++) {
    const options = MOOD_TRANSITIONS[current];
    // Weighted random — prefer first option (smoother transition)
    const weights = options.map((_, idx) => options.length - idx);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;

    let chosen = options[0];
    for (let j = 0; j < weights.length; j++) {
      rand -= weights[j];
      if (rand <= 0) {
        chosen = options[j];
        break;
      }
    }

    journey.push(chosen);
    current = chosen;
  }

  return journey;
}

// ─── PERSONALIZED SEARCH QUERIES ────────────────────
const RECOMMENDATION_QUERIES: Record<Mood, string[]> = {
  happy: ["feel good hits", "upbeat pop", "sunny day songs", "indie pop happy", "dance party", "summer vibes"],
  sad: ["emotional ballads", "sad piano", "melancholy indie", "rainy day", "acoustic heartbreak", "when you're sad"],
  energetic: ["workout pump", "edm bangers", "rock energy", "hip hop hype", "power songs", "gym motivation"],
  calm: ["lofi chill", "ambient meditation", "soft acoustic", "piano relax", "spa music", "peaceful"],
  focused: ["deep focus beats", "study concentration", "instrumental work", "lo-fi coding", "brain food", "productivity"],
};

export function getRecommendationQueries(
  mood: Mood,
  topArtists: string[],
  count: number = 3
): string[] {
  const queries: string[] = [];

  // 1. Mood-based discovery
  const moodQueries = RECOMMENDATION_QUERIES[mood];
  const shuffled = [...moodQueries].sort(() => Math.random() - 0.5);
  queries.push(...shuffled.slice(0, Math.ceil(count / 2)));

  // 2. Artist-based (if user has favorites)
  if (topArtists.length > 0) {
    const artistPick = topArtists[Math.floor(Math.random() * Math.min(5, topArtists.length))];
    queries.push(`${artistPick} similar`);
  }

  // 3. Cross-mood discovery (occasionally mix in adjacent moods)
  const adjacent = MOOD_TRANSITIONS[mood];
  if (adjacent.length > 0 && Math.random() > 0.5) {
    const adjMood = adjacent[Math.floor(Math.random() * adjacent.length)];
    const adjQueries = RECOMMENDATION_QUERIES[adjMood];
    queries.push(adjQueries[Math.floor(Math.random() * adjQueries.length)]);
  }

  return queries.slice(0, count);
}
