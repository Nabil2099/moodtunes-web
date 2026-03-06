import { motion } from "framer-motion";
import { MessageSquare, ClipboardList, Clock } from "lucide-react";
import SearchBar from "@/components/SearchBar";

interface HeaderProps {
  onTextEntry: () => void;
  onQuestionnaire: () => void;
  onTimeDetect: () => void;
}

export default function Header({
  onTextEntry,
  onQuestionnaire,
  onTimeDetect,
}: HeaderProps) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <img src="/logo.svg" alt="MoodTunes" className="w-8 h-8" />
          <span className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-mood-calm via-mood-happy to-mood-energetic bg-clip-text text-transparent">
            MoodTunes
          </span>
        </a>

        {/* Search + Quick access buttons */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <SearchBar />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTextEntry}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all cursor-pointer"
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">Text</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onQuestionnaire}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all cursor-pointer"
          >
            <ClipboardList size={14} />
            <span className="hidden sm:inline">Quiz</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTimeDetect}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer rounded-full"
          >
            <Clock size={14} />
            <span className="hidden sm:inline">Auto</span>
          </motion.button>
        </nav>
      </div>
    </motion.header>
  );
}
