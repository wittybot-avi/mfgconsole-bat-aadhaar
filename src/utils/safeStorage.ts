/**
 * Safe Storage utility to prevent app crashes when localStorage is blocked 
 * or quota is exceeded. Falls back to an in-memory session map.
 */

const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) return value;
    } catch (e) {
      console.warn(`safeStorage: Error reading key "${key}" from localStorage, checking memory.`, e);
    }
    return memoryStore.get(key) || null;
  },

  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`safeStorage: Error writing key "${key}" to localStorage, using memory.`, e);
      memoryStore.set(key, value);
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`safeStorage: Error removing key "${key}" from localStorage.`, e);
    }
    memoryStore.delete(key);
  }
};