// Auth Store - Global authentication state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types';

interface AuthState {
    user: AuthUser | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    hasPasscode: boolean;

    // Actions
    setUser: (user: AuthUser | null) => void;
    setLoading: (loading: boolean) => void;
    setHasPasscode: (has: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoggedIn: false,
            isLoading: true,
            hasPasscode: false,

            setUser: (user) => set({
                user,
                isLoggedIn: !!user,
                isLoading: false
            }),

            setLoading: (isLoading) => set({ isLoading }),

            setHasPasscode: (hasPasscode) => set({ hasPasscode }),

            logout: () => set({
                user: null,
                isLoggedIn: false,
                hasPasscode: false
            }),
        }),
        {
            name: 'bb-auth-storage',
            partialize: (state) => ({
                user: state.user,
                isLoggedIn: state.isLoggedIn,
                hasPasscode: state.hasPasscode
            }),
        }
    )
);
