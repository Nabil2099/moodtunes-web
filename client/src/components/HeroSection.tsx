import { motion } from "framer-motion";
import { MessageSquare, ClipboardList, Clock, ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onTextEntry: () => void;
  onQuestionnaire: () => void;
  onTimeDetect: () => void;
}

const cards = [
  {
    icon: MessageSquare,
    title: "Tell us how you feel",
    description: "Describe your mood in words and let our ML read your soul",
    action: "onTextEntry" as const,
    gradient: "from-mood-calm/20 to-transparent",
    color: "#7c6af7",
  },
  {
    icon: ClipboardList,
    title: "Answer 5 questions",
    description: "A quick questionnaire to uncover your vibe",
    action: "onQuestionnaire" as const,
    gradient: "from-mood-happy/20 to-transparent",
    color: "#4fd6a0",
  },
  {
    icon: Clock,
    title: "Let the time decide",
    description: "We'll pick the perfect mood based on the time of day",
    action: "onTimeDetect" as const,
    gradient: "from-mood-energetic/20 to-transparent",
    color: "#f7836a",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function HeroSection({
  onTextEntry,
  onQuestionnaire,
  onTimeDetect,
}: HeroSectionProps) {
  const actions = { onTextEntry, onQuestionnaire, onTimeDetect };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-10 pb-10 sm:pt-24 sm:pb-20">
      {/* Logo mark */}
      <motion.img
        src="/logo.svg"
        alt=""
        className="w-12 h-12 sm:w-16 sm:h-16 mb-4 sm:mb-6"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      <motion.h1
        className="font-heading text-4xl sm:text-5xl md:text-7xl font-extrabold text-center mb-4 leading-tight"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Music that matches
        <br />
        <motion.span
          className="bg-gradient-to-r from-mood-calm via-mood-happy to-mood-energetic bg-clip-text text-transparent"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{ backgroundSize: "200% 200%" }}
        >
          your soul
        </motion.span>
      </motion.h1>

      <motion.p
        className="text-muted-foreground text-center text-sm sm:text-base max-w-md mb-4 font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Let our custom ML detect your mood and curate the perfect playlist
      </motion.p>

      {/* CTA hint */}
      <motion.p
        className="text-xs text-muted-foreground/60 font-mono mb-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        Choose how you want to discover your mood ↓
      </motion.p>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.title}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={actions[card.action]}
              className={`glass rounded-2xl p-4 sm:p-6 text-left cursor-pointer bg-gradient-to-b ${card.gradient} transition-shadow hover:shadow-lg hover:shadow-primary/10 group`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <Icon size={24} style={{ color: card.color }} />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                {card.description}
              </p>
              <div
                className="mt-4 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: card.color }}
              >
                Get started →
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={20} className="text-muted-foreground/40" />
      </motion.div>
    </section>
  );
}
