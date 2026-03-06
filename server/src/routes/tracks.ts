import { Router, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { mockTracks } from "../data/tracks";
import { Mood } from "../types";

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
  (req: Request, res: Response): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const mood = req.query.mood as Mood | undefined;

    if (mood) {
      const filtered = mockTracks.filter((t) => t.mood === mood);
      // Shuffle so each request returns a different order
      res.json(shuffle(filtered));
    } else {
      res.json(shuffle(mockTracks));
    }
  }
);

export default router;
