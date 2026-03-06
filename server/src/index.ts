import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import moodRoutes from "./routes/mood";
import trackRoutes from "./routes/tracks";
import authRoutes from "./routes/auth";
import aiRoutes from "./routes/ai";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({ origin: isProduction ? undefined : "http://localhost:5173" }));
app.use(express.json());
app.use(authMiddleware); // Attach user to req if token present

app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// In production, serve the built client files
if (isProduction) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🎵 MoodTunes server running on http://localhost:${PORT}`);
});
