import { motion } from "framer-motion";
import { Mood, MOOD_COLORS, MOOD_EMOJIS, MOOD_LABELS } from "@/types";

interface MoodBadgeProps {
  mood: Mood;
  confidence?: number;
}

export default function MoodBadge({ mood, confidence }: MoodBadgeProps) {
  const color = MOOD_COLORS[mood];

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full glass"
      style={{
        boxShadow: `0 0 30px ${color}40, 0 0 60px ${color}20`,
        borderColor: `${color}50`,
      }}
    >
      <motion.span
        className="text-3xl"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {MOOD_EMOJIS[mood]}
      </motion.span>
      <div>
        <p className="font-heading font-bold text-lg" style={{ color }}>
          {MOOD_LABELS[mood]}
        </p>
        {confidence !== undefined && (
          <p className="text-xs text-muted-foreground font-mono">
            {Math.round(confidence * 100)}% confidence
          </p>
        )}
      </div>
    </motion.div>
  );
}
