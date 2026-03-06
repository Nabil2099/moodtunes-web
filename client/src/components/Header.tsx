import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ClipboardList, Clock, Menu, X } from "lucide-react";
import SearchBar from "@/components/SearchBar";

interface HeaderProps {
  onTextEntry: () => void;
  onQuestionnaire: () => void;
  onTimeDetect: () => void;
  onArtistSelect?: (artistId: number) => void;
}

export default function Header({
  onTextEntry,
  onQuestionnaire,
  onTimeDetect,
  onArtistSelect,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { icon: MessageSquare, label: "Text", onClick: onTextEntry },
    { icon: ClipboardList, label: "Quiz", onClick: onQuestionnaire },
    { icon: Clock, label: "Auto", onClick: onTimeDetect, accent: true },
  ];

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5 safe-top"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <img src="/logo.svg" alt="MoodTunes" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-heading font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-mood-calm via-mood-happy to-mood-energetic bg-clip-text text-transparent">
              MoodTunes
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-2">
            <SearchBar onArtistSelect={onArtistSelect} />
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={item.onClick}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    item.accent
                      ? "bg-primary/10 text-primary hover:bg-primary/20 rounded-full"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Mobile: search + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <SearchBar onArtistSelect={onArtistSelect} />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="sm:hidden border-t border-white/5"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        item.onClick();
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono transition-colors cursor-pointer ${
                        item.accent
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label === "Text" ? "Tell how you feel" : item.label === "Quiz" ? "Answer 5 questions" : "Auto detect"}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
