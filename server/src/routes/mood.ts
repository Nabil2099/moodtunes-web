import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { Mood, MoodResult, MOOD_COLORS } from "../types";
import { classifyMood } from "../ml/classifier";

const router = Router();

// POST /api/mood/analyze — uses custom ML classifier (no external APIs)
router.post(
  "/analyze",
  [body("text").isString().trim().isLength({ min: 1, max: 1000 })],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { text } = req.body;

      const classification = classifyMood(text);
      const mood: Mood = classification.mood;
      const confidence = classification.confidence;

      // Fire-and-forget: don't block response if DB is unavailable
      prisma.moodSession.create({
        data: { mood, method: "text", confidence },
      }).catch(() => {});

      const result: MoodResult = {
        mood,
        confidence,
        color: MOOD_COLORS[mood],
      };

      res.json(result);
    } catch (error) {
      console.error("Mood analysis error:", error);
      res.status(500).json({ error: "Failed to analyze mood" });
    }
  }
);

// POST /api/mood/questionnaire
router.post(
  "/questionnaire",
  [body("answers").isArray({ min: 5, max: 5 })],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { answers } = req.body as { answers: string[] };

      // Map answers to mood scores
      const moodScores: Record<Mood, number> = {
        happy: 0,
        sad: 0,
        energetic: 0,
        calm: 0,
        focused: 0,
      };

      // Each answer maps to a mood
      const answerMoodMap: Record<string, Mood> = {
        "😊": "happy",
        "😢": "sad",
        "⚡": "energetic",
        "🧘": "calm",
        "🎯": "focused",
        "🌅": "energetic",
        "🌙": "calm",
        "☀️": "happy",
        "🌧️": "sad",
        "🎉": "happy",
        "📚": "focused",
        "🎵": "calm",
        "🏃": "energetic",
        "😴": "sad",
        "💪": "energetic",
        "🧠": "focused",
        "❤️": "happy",
        "😌": "calm",
        "🔥": "energetic",
        "🌊": "calm",
      };

      answers.forEach((answer: string) => {
        const mood = answerMoodMap[answer] || "calm";
        moodScores[mood]++;
      });

      const mood = (Object.entries(moodScores) as [Mood, number][]).sort(
        (a, b) => b[1] - a[1]
      )[0][0];

      const confidence = Math.min(0.95, 0.6 + moodScores[mood] * 0.1);

      prisma.moodSession.create({
        data: { mood, method: "questionnaire", confidence },
      }).catch(() => {});

      const result: MoodResult = {
        mood,
        confidence,
        color: MOOD_COLORS[mood],
      };

      res.json(result);
    } catch (error) {
      console.error("Questionnaire error:", error);
      res.status(500).json({ error: "Failed to process questionnaire" });
    }
  }
);

// GET /api/mood/time
router.get("/time", async (_req: Request, res: Response): Promise<void> => {
  try {
    const hour = new Date().getHours();
    let mood: Mood;

    if (hour >= 5 && hour < 12) {
      mood = "energetic"; // morning
    } else if (hour >= 12 && hour < 17) {
      mood = "focused"; // afternoon
    } else if (hour >= 17 && hour < 21) {
      mood = "calm"; // evening
    } else {
      mood = "sad"; // night
    }

    const confidence = 0.8;

    prisma.moodSession.create({
      data: { mood, method: "time", confidence },
    }).catch(() => {});

    const result: MoodResult = {
      mood,
      confidence,
      color: MOOD_COLORS[mood],
    };

    res.json(result);
  } catch (error) {
    console.error("Time mood error:", error);
    res.status(500).json({ error: "Failed to detect time-based mood" });
  }
});

export default router;
