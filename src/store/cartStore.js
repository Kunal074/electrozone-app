import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items:   [],
  storeId: null,

  addItem: (product, storeId) => {
    const { items, storeId: currentStore } = get();
    if (currentStore && currentStore !== storeId) {
      return false;
    }
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      set({ items: items.map(i =>
        i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      )});
    } else {
      set({ items: [...items, { ...product, quantity: 1 }], storeId });
    }
    return true;
  },

  removeItem: (id) => {
    const items = get().items.filter(i => i.id !== id);
    set({ items, storeId: items.length === 0 ? null : get().storeId });
  },

  updateQuantity: (id, qty) => {
    if (qty < 1) return;
    set({ items: get().items.map(i => i.id === id ? { ...i, quantity: qty } : i) });
  },

  clearCart: () => set({ items: [], storeId: null }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

export default useCartStore;