import api from './api';

// ── PRODUCTS ──
export const getProducts  = async (filters = {}) => {
  const res = await api.get('/products', { params: filters });
  return res.data;
};
export const getProduct   = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

// ── USED PHONES ──
export const getUsedPhones = async (filters = {}) => {
  const res = await api.get('/used-phones', { params: filters });
  return res.data;
};
export const getUsedPhone  = async (id) => {
  const res = await api.get(`/used-phones/${id}`);
  return res.data;
};

// ── BANNERS ──
export const getBanners = async () => {
  const res = await api.get('/banners');
  return res.data;
};

// ── ORDERS ──
export const getOrders   = async () => {
  const res = await api.get('/orders/my');
  return res.data;
};
export const getOrder    = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};
export const createOrder = async (data) => {
  const res = await api.post('/orders', data);
  return res.data;
};

// ── AUTH ──
export const sendOTP   = async (phone) => {
  const res = await api.post('/auth/send-otp', { phone });
  return res.data;
};
export const verifyOTP = async (phone, otp, name) => {
  const res = await api.post('/auth/verify-otp', { 
    phone, 
    otp: String(otp),  // ← String mein convert karo
    name 
  });
  return res.data;
};