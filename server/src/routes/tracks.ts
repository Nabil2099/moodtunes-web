import { Router, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { mockTracks } from "../data/tracks";
import { Mood } from "../types";

const router = Router();

const VALID_MOODS: Mood[] = ["happy", "sad", "energetic", "calm", "focused"];

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
      res.json(filtered);
    } else {
      res.json(mockTracks);
    }
  }
);

export default router;
