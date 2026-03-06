import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Music, ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { googleAuth } from "@/lib/api";
import toast from "react-hot-toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: { theme?: string; size?: string; width?: number; shape?: string; text?: string }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = "261079379032-41jbu406n87qo2rminl4ik6h917ee591.apps.googleusercontent.com";

export default function AuthPage() {
  const { login, setShowAuthPage } = useAuthStore();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setLoading(true);
      try {
        const { token, user } = await googleAuth(response.credential);
        login(token, user);
        toast.success(`Welcome, ${user.name || "friend"}! 🎵`);
      } catch {
        toast.error("Sign in failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_black",
        size: "large",
        width: 360,
        shape: "pill",
        text: "continue_with",
      });
    };

    // GSI script might already be loaded or still loading
    if (window.google) {
      initGoogle();
    } else {
      const check = setInterval(() => {
        if (window.google) {
          clearInterval(check);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(check);
    }
  }, [handleGoogleResponse]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#0a0a14" }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-mood-happy/5 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAuthPage(false)}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
      >
        <ArrowLeft size={18} />
        <span className="font-mono">Back</span>
      </motion.button>

      {/* Auth card */}
      <motion.div
        className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "#0d0d1a" }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {/* Header gradient */}
        <div className="h-1 bg-gradient-to-r from-mood-calm via-mood-happy to-mood-energetic" />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Music size={24} className="text-primary" />
            <span className="font-heading font-bold text-xl bg-gradient-to-r from-mood-calm via-mood-happy to-mood-energetic bg-clip-text text-transparent">
              MoodTunes
            </span>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                Sign in to MoodTunes
              </h2>
              <p className="text-sm text-muted-foreground">
                Continue with your Google account
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex justify-center">
                <div ref={googleBtnRef} />
              </div>
            )}

            <p className="text-xs text-muted-foreground/50 text-center">
              We only access your name, email &amp; profile picture
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
