import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useMoodStore, useTracksStore } from "@/store";
import { submitQuestionnaire, getTracks } from "@/lib/api";
import toast from "react-hot-toast";

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const questions = [
  {
    question: "How does your body feel right now?",
    options: [
      { emoji: "⚡", label: "Buzzing with energy" },
      { emoji: "😌", label: "Relaxed and loose" },
      { emoji: "💪", label: "Strong and ready" },
      { emoji: "😴", label: "Heavy and tired" },
    ],
  },
  {
    question: "What's the weather in your mind?",
    options: [
      { emoji: "☀️", label: "Bright sunshine" },
      { emoji: "🌧️", label: "Rainy and grey" },
      { emoji: "🔥", label: "Like a wildfire" },
      { emoji: "🌊", label: "Calm ocean waves" },
    ],
  },
  {
    question: "What would you rather do right now?",
    options: [
      { emoji: "🎉", label: "Dance at a party" },
      { emoji: "📚", label: "Read a book" },
      { emoji: "🏃", label: "Go for a run" },
      { emoji: "🧘", label: "Meditate quietly" },
    ],
  },
  {
    question: "Pick a color that calls to you:",
    options: [
      { emoji: "😊", label: "Warm green" },
      { emoji: "😢", label: "Cool cyan" },
      { emoji: "🎯", label: "Golden yellow" },
      { emoji: "🧠", label: "Deep purple" },
    ],
  },
  {
    question: "How would you describe your thoughts?",
    options: [
      { emoji: "🌅", label: "Fresh and new" },
      { emoji: "🌙", label: "Dreamy and soft" },
      { emoji: "❤️", label: "Full of love" },
      { emoji: "🎵", label: "Like a melody" },
    ],
  },
];

export default function QuestionnaireModal({
  isOpen,
  onClose,
}: QuestionnaireModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const { setMoodResult, setAnalyzing } = useMoodStore();
  const { setTracks, setLoading } = useTracksStore();

  const handleAnswer = async (emoji: string) => {
    const newAnswers = [...answers, emoji];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Submit
      setAnalyzing(true);
      try {
        const result = await submitQuestionnaire(newAnswers);
        setMoodResult(result, "questionnaire");
        toast.success(`Mood detected: ${result.mood}`);

        setLoading(true);
        const tracks = await getTracks(result.mood);
        setTracks(tracks);
        onClose();

        setTimeout(() => {
          document
            .getElementById("recommendations")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      } catch {
        toast.error("Failed to process questionnaire");
        setAnalyzing(false);
      }
      setStep(0);
      setAnswers([]);
    }
  };

  const handleClose = () => {
    setStep(0);
    setAnswers([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative glass rounded-3xl p-6 sm:p-8 w-full max-w-md z-10"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <p className="text-xs text-muted-foreground font-mono mb-2">
              Question {step + 1} of {questions.length}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-heading text-xl font-bold mb-6">
                  {questions[step].question}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {questions[step].options.map((opt) => (
                    <motion.button
                      key={opt.emoji}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleAnswer(opt.emoji)}
                      className="glass rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="text-xs font-mono text-muted-foreground text-center">
                        {opt.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
