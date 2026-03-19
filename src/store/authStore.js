import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user:        null,
  accessToken: null,
  isLoggedIn:  false,

  login: (userData, token) => {
    set({ user: userData, accessToken: token, isLoggedIn: true });
  },

  logout: () => {
    set({ user: null, accessToken: null, isLoggedIn: false });
  },
}));

export default useAuthStore;