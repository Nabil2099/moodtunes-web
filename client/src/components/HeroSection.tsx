import { motion } from "framer-motion";
import { MessageSquare, ClipboardList, Clock } from "lucide-react";

interface HeroSectionProps {
  onTextEntry: () => void;
  onQuestionnaire: () => void;
  onTimeDetect: () => void;
}

const cards = [
  {
    icon: MessageSquare,
    title: "Tell us how you feel",
    description: "Describe your mood in words and let AI read your soul",
    action: "onTextEntry" as const,
    gradient: "from-mood-calm/20 to-transparent",
  },
  {
    icon: ClipboardList,
    title: "Answer 5 questions",
    description: "A quick questionnaire to uncover your vibe",
    action: "onQuestionnaire" as const,
    gradient: "from-mood-happy/20 to-transparent",
  },
  {
    icon: Clock,
    title: "Let the time decide",
    description: "We'll pick the perfect mood based on the time of day",
    action: "onTimeDetect" as const,
    gradient: "from-mood-energetic/20 to-transparent",
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
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
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
        className="text-muted-foreground text-center text-sm sm:text-base max-w-md mb-12 font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Let AI detect your mood and curate the perfect playlist
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
              className={`glass rounded-2xl p-6 text-left cursor-pointer bg-gradient-to-b ${card.gradient} transition-shadow hover:shadow-lg hover:shadow-primary/10`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <Icon size={24} className="text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                {card.description}
              </p>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}
