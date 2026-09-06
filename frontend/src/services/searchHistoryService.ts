/* KKMovies — Search History Service */

const STORAGE_KEY = 'kauanflix_search_history';
const MAX_ITEMS = 5;

export const searchHistoryService = {
  getAll(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  add(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const items = searchHistoryService.getAll().filter((t) => t !== trimmed);
    items.unshift(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  },

  remove(term: string) {
    const items = searchHistoryService.getAll().filter((t) => t !== term);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
