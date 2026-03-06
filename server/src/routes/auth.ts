import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { generateOTP, sendOTPEmail } from "../services/email";
import { signToken, requireAuth, AuthPayload } from "../middleware/auth";

const router = Router();

// POST /api/auth/send-otp — send OTP to email (for both signup & login)
router.post(
  "/send-otp",
  [body("email").isEmail().normalizeEmail()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { email } = req.body;
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // Invalidate previous unused OTPs for this email
      await prisma.otpCode.updateMany({
        where: { email, used: false },
        data: { used: true },
      });

      // Create new OTP
      await prisma.otpCode.create({
        data: { email, code: otp, expiresAt },
      });

      // Send email
      await sendOTPEmail(email, otp);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });

      res.json({
        message: "OTP sent to your email",
        isNewUser: !existingUser,
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  }
);

// POST /api/auth/verify-otp — verify OTP and return JWT
router.post(
  "/verify-otp",
  [
    body("email").isEmail().normalizeEmail(),
    body("code").isString().isLength({ min: 6, max: 6 }),
    body("name").optional().isString().trim().isLength({ min: 1, max: 100 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { email, code, name } = req.body;

      // Find valid OTP
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          email,
          code,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!otpRecord) {
        res.status(400).json({ error: "Invalid or expired OTP" });
        return;
      }

      // Mark OTP as used
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });

      // Find or create user
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split("@")[0],
          },
        });
      } else if (name && !user.name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
        });
      }

      const token = signToken({ userId: user.id, email: user.email });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  }
);

// GET /api/auth/me — get current user
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              listeningHistory: true,
              favorites: true,
              moodSessions: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  }
);

// PUT /api/auth/profile — update profile
router.put(
  "/profile",
  requireAuth,
  [
    body("name").optional().isString().trim().isLength({ min: 1, max: 100 }),
    body("avatar").optional().isString().trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { userId } = (req as any).user as AuthPayload;
      const { name, avatar } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(avatar !== undefined ? { avatar } : {}),
        },
      });

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// POST /api/auth/history — log a track play
router.post(
  "/history",
  requireAuth,
  [
    body("trackId").isString(),
    body("trackTitle").isString(),
    body("artistName").isString(),
    body("mood").isString(),
    body("duration").optional().isInt({ min: 0 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;
      const { trackId, trackTitle, artistName, mood, duration } = req.body;

      await prisma.listeningHistory.create({
        data: { userId, trackId, trackTitle, artistName, mood, duration: duration || 0 },
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Log history error:", error);
      res.status(500).json({ error: "Failed to log history" });
    }
  }
);

// GET /api/auth/history — get listening history
router.get(
  "/history",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

      const history = await prisma.listeningHistory.findMany({
        where: { userId },
        orderBy: { playedAt: "desc" },
        take: limit,
      });

      res.json(history);
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({ error: "Failed to get history" });
    }
  }
);

// POST /api/auth/favorites — add a favorite
router.post(
  "/favorites",
  requireAuth,
  [
    body("trackId").isString(),
    body("trackTitle").isString(),
    body("artistName").isString(),
    body("albumArt").optional().isString(),
    body("mood").isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;
      const { trackId, trackTitle, artistName, albumArt, mood } = req.body;

      const fav = await prisma.userFavorite.upsert({
        where: { userId_trackId: { userId, trackId } },
        create: { userId, trackId, trackTitle, artistName, albumArt: albumArt || "", mood },
        update: {},
      });

      res.json(fav);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  }
);

// DELETE /api/auth/favorites/:trackId — remove a favorite
router.delete(
  "/favorites/:trackId",
  requireAuth,
  async (req: Request<{ trackId: string }>, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;
      const trackId = req.params.trackId;

      await prisma.userFavorite.deleteMany({
        where: { userId, trackId },
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  }
);

// GET /api/auth/favorites — get favorites
router.get(
  "/favorites",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user as AuthPayload;

      const favorites = await prisma.userFavorite.findMany({
        where: { userId },
        orderBy: { addedAt: "desc" },
      });

      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ error: "Failed to get favorites" });
    }
  }
);

export default router;
