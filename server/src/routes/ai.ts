import { Router, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { requireAuth, AuthPayload } from "../middleware/auth";
import { Mood } from "../types";
import {
  buildTasteProfile,
  getMoodInsights,
  generateMoodJourney,
  getRecommendationQueries,
} from "../ml/recommender";
import { searchTracks, searchByMood } from "../services/deezer";

const router = Router();
const VALID_MOODS: Mood[] = ["happy", "sad", "energetic", "calm", "focused"];

// GET /api/ai/for-you — personalized recommendations
router.get(
  "/for-you",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;
      const profile = await buildTasteProfile(userId);

      // Determine mood based on time + user preferences
      const hour = new Date().getHours();
      let period = "night";
      if (hour >= 5 && hour < 12) period = "morning";
      else if (hour >= 12 && hour < 17) period = "afternoon";
      else if (hour >= 17 && hour < 21) period = "evening";

      const personalMood = profile.totalListens > 5
        ? profile.timePreferences[period]
        : (["calm", "happy", "focused"] as Mood[])[Math.floor(Math.random() * 3)];

      const topArtistNames = profile.topArtists.map((a) => a.name);
      const queries = getRecommendationQueries(personalMood, topArtistNames, 4);

      // Fetch tracks from multiple queries for variety
      const trackSets = await Promise.all(
        queries.map((q) => searchTracks(q, personalMood, 10).catch(() => []))
      );

      // Merge, deduplicate, shuffle
      const seen = new Set<string>();
      const allTracks = trackSets.flat().filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      // Shuffle
      for (let i = allTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
      }

      res.json({
        mood: personalMood,
        tracks: allTracks.slice(0, 30),
        profile: {
          topArtists: profile.topArtists.slice(0, 5),
          avgMood: profile.avgMood,
          totalListens: profile.totalListens,
        },
      });
    } catch (error) {
      console.error("For You error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  }
);

// GET /api/ai/dj?mood=happy&steps=5 — AI DJ mood journey playlist
router.get(
  "/dj",
  [
    query("mood").optional().isIn(VALID_MOODS),
    query("steps").optional().isInt({ min: 3, max: 8 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const startMood = (req.query.mood as Mood) || "calm";
      const steps = parseInt(req.query.steps as string) || 5;

      const journey = generateMoodJourney(startMood, steps);

      // Fetch tracks for each step of the journey
      const journeyTracks = await Promise.all(
        journey.map(async (mood, i) => {
          const tracks = await searchByMood(mood, 8).catch(() => []);
          return { step: i + 1, mood, tracks };
        })
      );

      res.json({
        journey,
        steps: journeyTracks,
        totalTracks: journeyTracks.reduce((s, j) => s + j.tracks.length, 0),
      });
    } catch (error) {
      console.error("DJ error:", error);
      res.status(500).json({ error: "Failed to generate DJ playlist" });
    }
  }
);

// GET /api/ai/insights — mood & listening insights (requires auth)
router.get(
  "/insights",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;
      const insights = await getMoodInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Insights error:", error);
      res.status(500).json({ error: "Failed to get insights" });
    }
  }
);

// GET /api/ai/taste-profile — get taste profile (requires auth)
router.get(
  "/taste-profile",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;
      const profile = await buildTasteProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Taste profile error:", error);
      res.status(500).json({ error: "Failed to build taste profile" });
    }
  }
);

export default router;
