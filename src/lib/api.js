import axios from 'axios';

const API_URL = 'http://192.168.29.166:5000/api';

const api = axios.create({ baseURL: API_URL });

// Token baad mein set karenge — circular dependency avoid karne ke liye
api.interceptors.request.use((config) => {
  try {
    const { useAuthStore } = require('../store/authStore');
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
});

export default api;