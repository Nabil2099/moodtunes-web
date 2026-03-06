import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, BarChart3, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface UserMenuProps {
  onInsightsClick: () => void;
}

export default function UserMenu({ onInsightsClick }: UserMenuProps) {
  const { user, logout, setShowAuthPage } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAuthPage(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
      >
        <User size={14} />
        <span>Sign in</span>
      </motion.button>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono cursor-pointer border border-primary/30 hover:bg-primary/30 transition-colors"
      >
        {initials}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 overflow-hidden shadow-2xl z-50"
            style={{ background: "#12121e" }}
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name || "MoodTunes User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => {
                  onInsightsClick();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
              >
                <BarChart3 size={16} />
                <span>Mood Insights</span>
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Sparkles size={16} />
                <span>AI Features</span>
              </button>
            </div>

            <div className="border-t border-white/5 py-1">
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
