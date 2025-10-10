// lib/storage.js
export const storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){} },
  remove(key) { try { localStorage.removeItem(key); } catch(e){} }
};
