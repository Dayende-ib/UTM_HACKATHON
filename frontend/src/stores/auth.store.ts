import { create } from 'zustand';
import type { User, UserRole } from '@/types/auth';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    telephone?: string;
    role: UserRole;
  }) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

function loadUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('auth-user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('auth-user', JSON.stringify(user));
  } else {
    localStorage.removeItem('auth-user');
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  isLoading: false,
  isAuthenticated: loadUser() !== null,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.login(email, password);
      saveUser(user);
      set({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.register(data);
      saveUser(user);
      set({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    saveUser(null);
    set({ user: null, isAuthenticated: false });
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true });
    await authService.resetPassword(email);
    set({ isLoading: false });
  },

  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...partial };
      saveUser(user);
      return { user };
    });
  },
}));
