import { Router, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { mockTracks } from "../data/tracks";
import { Mood } from "../types";
import { searchByMood, searchTracks } from "../services/deezer";

const router = Router();

const VALID_MOODS: Mood[] = ["happy", "sad", "energetic", "calm", "focused"];

// Fisher-Yates shuffle — returns a new shuffled array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/tracks?mood=calm
router.get(
  "/",
  [query("mood").optional().isIn(VALID_MOODS)],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const mood = req.query.mood as Mood | undefined;

    if (mood) {
      try {
        // Try Deezer first for real music with previews
        const deezerTracks = await searchByMood(mood, 30);
        if (deezerTracks.length >= 10) {
          res.json(deezerTracks);
          return;
        }
      } catch {
        // Fall through to mock tracks
      }

      // Fallback to mock tracks
      const filtered = mockTracks.filter((t) => t.mood === mood);
      res.json(shuffle(filtered));
    } else {
      res.json(shuffle(mockTracks));
    }
  }
);

// GET /api/tracks/search?q=...&mood=calm
router.get(
  "/search",
  [
    query("q").isString().trim().isLength({ min: 1, max: 200 }),
    query("mood").optional().isIn(VALID_MOODS),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const q = req.query.q as string;
    const mood = (req.query.mood as Mood) || "calm";

    try {
      const tracks = await searchTracks(q, mood, 30);
      res.json(tracks);
    } catch {
      res.status(500).json({ error: "Search failed" });
    }
  }
);

export default router;
