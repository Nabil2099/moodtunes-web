import { create } from "zustand";
import { User } from "@/types";
import { getMe } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  showAuthPage: boolean;

  setUser: (user: User | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setShowAuthPage: (show: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("moodtunes_token"),
  isLoading: true,
  showAuthPage: false,

  setUser: (user) => set({ user }),

  login: (token, user) => {
    localStorage.setItem("moodtunes_token", token);
    set({ token, user, showAuthPage: false });
  },

  logout: () => {
    localStorage.removeItem("moodtunes_token");
    set({ token: null, user: null });
  },

  setShowAuthPage: (showAuthPage) => set({ showAuthPage }),

  initialize: async () => {
    const token = localStorage.getItem("moodtunes_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await getMe();
      set({ user, token, isLoading: false });
    } catch {
      localStorage.removeItem("moodtunes_token");
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
