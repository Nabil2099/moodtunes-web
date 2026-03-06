import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight, Loader2, CheckCircle, Music } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { sendOTP, verifyOTP } from "@/lib/api";
import toast from "react-hot-toast";

type Step = "email" | "otp" | "name";

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, login } = useAuthStore();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAuthModal && step === "email") {
      setTimeout(() => emailRef.current?.focus(), 100);
    }
  }, [showAuthModal, step]);

  const handleClose = () => {
    setShowAuthModal(false);
    setTimeout(() => {
      setStep("email");
      setEmail("");
      setOtp(["", "", "", "", "", ""]);
      setName("");
    }, 300);
  };

  const handleSendOTP = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const result = await sendOTP(email);
      setIsNewUser(result.isNewUser);
      setStep("otp");
      toast.success("Verification code sent!");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      toast.error("Failed to send code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((d) => d !== "") && value) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
      handleVerifyOTP(pasted);
    }
  };

  const handleVerifyOTP = async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    if (isNewUser) {
      setStep("name");
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await verifyOTP(email, otpCode);
      login(token, user);
      toast.success(`Welcome back, ${user.name || "friend"}!`);
      handleClose();
    } catch {
      toast.error("Invalid or expired code");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { token, user } = await verifyOTP(email, otp.join(""), name || undefined);
      login(token, user);
      toast.success(`Welcome to MoodTunes, ${user.name}! 🎵`);
      handleClose();
    } catch {
      toast.error("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!showAuthModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: "#0d0d1a" }}
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          {/* Header gradient */}
          <div className="h-1 bg-gradient-to-r from-mood-calm via-mood-happy to-mood-energetic" />

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors z-10"
          >
            <X size={18} />
          </button>

          <div className="p-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Music size={24} className="text-primary" />
              <span className="font-heading font-bold text-xl bg-gradient-to-r from-mood-calm via-mood-happy to-mood-energetic bg-clip-text text-transparent">
                MoodTunes
              </span>
            </div>

            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                      Sign in to MoodTunes
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      We'll send a verification code to your email
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 font-mono text-sm transition-all"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight size={18} />
                        </>
                      )}
                    </motion.button>
                  </div>

                  <p className="text-xs text-muted-foreground/50 text-center">
                    No password needed — we use secure email verification
                  </p>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                      Check your email
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to{" "}
                      <span className="text-primary font-mono">{email}</span>
                    </p>
                  </div>

                  <div className="flex justify-center gap-2" onPaste={handleOTPPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(i, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(i, e)}
                        className="w-12 h-14 text-center text-xl font-mono rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all"
                      />
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVerifyOTP()}
                    disabled={loading || otp.some((d) => !d)}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Verify
                      </>
                    )}
                  </motion.button>

                  <button
                    onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    ← Use a different email
                  </button>
                </motion.div>
              )}

              {step === "name" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                      Welcome! What's your name?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      This is how you'll appear in MoodTunes
                    </p>
                  </div>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                    placeholder="Your name"
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 font-mono text-sm transition-all"
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Get Started
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
