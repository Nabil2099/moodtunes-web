import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import OpenAI from "openai";
import prisma from "../lib/prisma";
import { Mood, MoodResult, MOOD_COLORS } from "../types";

const router = Router();

const VALID_MOODS: Mood[] = ["happy", "sad", "energetic", "calm", "focused"];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/mood/analyze
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

      let mood: Mood = "calm";
      let confidence = 0.85;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Analyze the mood of this text and return ONLY one of: happy, sad, energetic, calm, focused. Text: ${text}`,
            },
          ],
          max_tokens: 10,
          temperature: 0.3,
        });

        const result = completion.choices[0]?.message?.content
          ?.trim()
          .toLowerCase() as Mood;
        if (VALID_MOODS.includes(result)) {
          mood = result;
          confidence = 0.92;
        }
      } catch {
        // Fallback: simple keyword-based mood detection
        const lower = text.toLowerCase();
        if (/happy|joy|great|amazing|wonderful|excited|love/.test(lower)) {
          mood = "happy";
        } else if (/sad|depressed|down|lonely|miss|cry|hurt/.test(lower)) {
          mood = "sad";
        } else if (/energy|pump|workout|run|fast|power|strong/.test(lower)) {
          mood = "energetic";
        } else if (/focus|work|study|concentrate|productive|think/.test(lower)) {
          mood = "focused";
        } else {
          mood = "calm";
        }
        confidence = 0.75;
      }

      await prisma.moodSession.create({
        data: { mood, method: "text", confidence },
      });

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

      await prisma.moodSession.create({
        data: { mood, method: "questionnaire", confidence },
      });

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

    await prisma.moodSession.create({
      data: { mood, method: "time", confidence },
    });

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
