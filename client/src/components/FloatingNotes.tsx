import { motion } from "framer-motion";
import { useMemo } from "react";

function Note({ delay, x, size }: { delay: number; x: number; size: number }) {
  const notes = ["♪", "♫", "♬", "♩", "🎵", "🎶"];
  const note = notes[Math.floor(Math.random() * notes.length)];

  return (
    <motion.span
      className="absolute text-white/10 pointer-events-none select-none"
      style={{ fontSize: size, left: `${x}%` }}
      initial={{ y: "100vh", opacity: 0, rotate: 0 }}
      animate={{
        y: "-20vh",
        opacity: [0, 0.15, 0.1, 0],
        rotate: [0, 15, -10, 20],
      }}
      transition={{
        duration: 12 + Math.random() * 8,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {note}
    </motion.span>
  );
}

export default function FloatingNotes() {
  const notes = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: Math.random() * 10,
        x: Math.random() * 100,
        size: 16 + Math.random() * 32,
      })),
    []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {notes.map((n) => (
        <Note key={n.id} delay={n.delay} x={n.x} size={n.size} />
      ))}
    </div>
  );
}
