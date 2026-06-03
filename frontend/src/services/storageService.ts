/* KauanFlix — Centralized Storage Service
   All localStorage operations go through here.
   try/catch everywhere — silent fallback if storage is full or blocked.

   Keys:
   kkm_watchlist       → Array<WatchlistItem>
   kkm_history         → Array<HistoryItem> (max 50)
   kkm_progress_{id}   → ProgressEntry
   kkm_search_history  → Array<string> (max 6)
   kkm_preferences     → UserPreferences
*/

/* ---- Types ---- */

export interface WatchlistItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage?: number;
  releaseDate?: string;
  addedAt: number;
}

export interface HistoryItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  watchedAt: number;
}

export interface ProgressEntry {
  position: number;   // seconds
  duration: number;   // seconds
  season?: number;
  episode?: number;
  updatedAt: number;
}

export interface UserPreferences {
  volume: number;       // 0-1
  quality: string;      // 'auto' | '1080p' | '720p' | '480p'
  autoplay: boolean;
  subtitles: boolean;
}

/* ---- Keys ---- */

const KEYS = {
  watchlist: 'kkm_watchlist',
  history: 'kkm_history',
  progress: (id: string | number, season?: number, episode?: number) =>
    season !== undefined && episode !== undefined
      ? `kkm_progress_${id}_${season}_${episode}`
      : `kkm_progress_${id}`,
  searchHistory: 'kkm_search_history',
  preferences: 'kkm_preferences',
} as const;

/* ---- Helpers ---- */

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — silently skip
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

/* ============================================================
   WATCHLIST
   ============================================================ */

export const watchlistService = {
  getAll(): WatchlistItem[] {
    return read<WatchlistItem[]>(KEYS.watchlist) ?? [];
  },

  isInList(id: number): boolean {
    return this.getAll().some((item) => item.id === id);
  },

  add(item: Omit<WatchlistItem, 'addedAt'>): void {
    const current = this.getAll().filter((i) => i.id !== item.id);
    write(KEYS.watchlist, [{ ...item, addedAt: Date.now() }, ...current]);
  },

  remove(id: number): void {
    write(KEYS.watchlist, this.getAll().filter((i) => i.id !== id));
  },

  toggle(item: Omit<WatchlistItem, 'addedAt'>): boolean {
    if (this.isInList(item.id)) {
      this.remove(item.id);
      return false;
    } else {
      this.add(item);
      return true;
    }
  },
};

/* ============================================================
   WATCH HISTORY
   ============================================================ */

const MAX_HISTORY = 50;

export const historyService = {
  getAll(): HistoryItem[] {
    return read<HistoryItem[]>(KEYS.history) ?? [];
  },

  add(item: Omit<HistoryItem, 'watchedAt'>): void {
    const current = this.getAll().filter((i) => i.id !== item.id);
    const updated = [{ ...item, watchedAt: Date.now() }, ...current].slice(0, MAX_HISTORY);
    write(KEYS.history, updated);
  },

  getLast(): HistoryItem | null {
    return this.getAll()[0] ?? null;
  },

  getRecent(n = 10): HistoryItem[] {
    return this.getAll().slice(0, n);
  },
};

/* ============================================================
   WATCH PROGRESS
   ============================================================ */

export const progressService = {
  get(id: number | string, season?: number, episode?: number): ProgressEntry | null {
    return read<ProgressEntry>(KEYS.progress(id, season, episode));
  },

  save(id: number | string, entry: Omit<ProgressEntry, 'updatedAt'>, season?: number, episode?: number): void {
    write(KEYS.progress(id, season, episode), { ...entry, updatedAt: Date.now() });
  },

  remove(id: number | string, season?: number, episode?: number): void {
    remove(KEYS.progress(id, season, episode));
  },

  /** Returns percentage (0-100) of progress */
  getPercentage(id: number | string, season?: number, episode?: number): number {
    const p = this.get(id, season, episode);
    if (!p || !p.duration) return 0;
    return Math.min(100, Math.round((p.position / p.duration) * 100));
  },
};

/* ============================================================
   SEARCH HISTORY
   ============================================================ */

const MAX_SEARCHES = 6;

export const searchHistoryService = {
  getAll(): string[] {
    return read<string[]>(KEYS.searchHistory) ?? [];
  },

  add(term: string): void {
    const trimmed = term.trim();
    if (!trimmed) return;
    const current = this.getAll().filter((t) => t !== trimmed);
    write(KEYS.searchHistory, [trimmed, ...current].slice(0, MAX_SEARCHES));
  },

  remove(term: string): void {
    write(KEYS.searchHistory, this.getAll().filter((t) => t !== term));
  },

  clear(): void {
    remove(KEYS.searchHistory);
  },
};

/* ============================================================
   USER PREFERENCES
   ============================================================ */

const DEFAULT_PREFS: UserPreferences = {
  volume: 1,
  quality: 'auto',
  autoplay: true,
  subtitles: false,
};

export const preferencesService = {
  get(): UserPreferences {
    return { ...DEFAULT_PREFS, ...(read<Partial<UserPreferences>>(KEYS.preferences) ?? {}) };
  },

  save(prefs: Partial<UserPreferences>): void {
    write(KEYS.preferences, { ...this.get(), ...prefs });
  },
};
