import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      isLoggedIn:  false,

      login: (userData, token) => {
        set({ user: userData, accessToken: token, isLoggedIn: true });
      },

      logout: () => {
        set({ user: null, accessToken: null, isLoggedIn: false });
      },
    }),
    {
      name:    "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAuthStore;