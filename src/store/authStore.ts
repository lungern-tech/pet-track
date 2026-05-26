import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '../storage/secureStore';

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  displayName: string | null;
  email: string | null;
  hydrated: boolean;

  setSession: (session: {
    accessToken: string | null;
    refreshToken?: string | null;
    userId?: string | null;
    displayName?: string | null;
    email?: string | null;
  }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      displayName: null,
      email: null,
      hydrated: false,

      setSession: (session) => {
        set((prev) => ({
          accessToken: session.accessToken ?? null,
          refreshToken:
            session.refreshToken !== undefined ? session.refreshToken : prev.refreshToken,
          userId: session.userId !== undefined ? session.userId : prev.userId,
          displayName:
            session.displayName !== undefined ? session.displayName : prev.displayName,
          email: session.email !== undefined ? session.email : prev.email,
        }));
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          displayName: null,
          email: null,
        });
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        userId: s.userId,
        displayName: s.displayName,
        email: s.email,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          state.setSession({
            accessToken: state.accessToken ?? null,
            refreshToken: state.refreshToken ?? null,
            userId: state.userId ?? null,
            displayName: state.displayName ?? null,
            email: state.email ?? null,
          });
        }
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);

