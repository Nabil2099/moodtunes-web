import { useEffect } from "react";
import { usePlayerStore } from "@/store";

export default function useKeyboardShortcuts() {
  const { currentTrack, togglePlay, next, previous, isExpanded, setExpanded } =
    usePlayerStore();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't intercept when user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.code) {
        case "Space":
          if (currentTrack) {
            e.preventDefault();
            togglePlay();
          }
          break;
        case "ArrowRight":
          if (currentTrack) {
            e.preventDefault();
            next();
          }
          break;
        case "ArrowLeft":
          if (currentTrack) {
            e.preventDefault();
            previous();
          }
          break;
        case "Escape":
          if (isExpanded) {
            e.preventDefault();
            setExpanded(false);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentTrack, togglePlay, next, previous, isExpanded, setExpanded]);
}
