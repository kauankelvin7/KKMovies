/* KauanFlix — Watch History Service
   Manages watch progress using localStorage.
   No IP-based keying — uses a stable browser ID. */

import type { WatchProgress, UserStats } from '../types/movie';

const STORAGE_KEY = 'kauanflix_watch_history';

function getAll(): WatchProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(items: WatchProgress[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const watchHistoryService = {
  getAll,

  getInProgress(): WatchProgress[] {
    return getAll()
      .filter((w) => !w.completed && w.progress > 0 && w.progress < 95)
      .sort((a, b) => b.lastWatched - a.lastWatched);
  },

  getCompleted(): WatchProgress[] {
    return getAll()
      .filter((w) => w.completed)
      .sort((a, b) => b.lastWatched - a.lastWatched);
  },

  get(movieId: number): WatchProgress | undefined {
    return getAll().find((w) => w.movieId === movieId);
  },

  save(progress: WatchProgress) {
    const items = getAll();
    const idx = items.findIndex((w) => w.movieId === progress.movieId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...progress, lastWatched: Date.now() };
    } else {
      items.push({ ...progress, lastWatched: Date.now() });
    }
    saveAll(items);
  },

  updateProgress(movieId: number, currentTime: number, duration: number) {
    const items = getAll();
    const idx = items.findIndex((w) => w.movieId === movieId);
    if (idx >= 0) {
      const progress = Math.min(100, (currentTime / Math.max(duration, 1)) * 100);
      items[idx].currentTime = currentTime;
      items[idx].duration = duration;
      items[idx].progress = progress;
      items[idx].completed = progress >= 95;
      items[idx].lastWatched = Date.now();
      saveAll(items);
    }
  },

  markCompleted(movieId: number) {
    const items = getAll();
    const idx = items.findIndex((w) => w.movieId === movieId);
    if (idx >= 0) {
      items[idx].completed = true;
      items[idx].progress = 100;
      items[idx].lastWatched = Date.now();
      saveAll(items);
    }
  },

  /** Get next episode info for a series if currently watching an episode */
  getLastEpisode(seriesId: number): WatchProgress['episodeInfo'] | undefined {
    const entry = getAll().find((w) => w.movieId === seriesId);
    return entry?.episodeInfo;
  },

  remove(movieId: number) {
    saveAll(getAll().filter((w) => w.movieId !== movieId));
  },

  getStats(): UserStats {
    const all = getAll();
    const completed = all.filter((w) => w.completed);
    const totalSeconds = all.reduce((sum, w) => sum + (w.currentTime || 0), 0);
    const genreMap: Record<string, number> = {};
    return {
      totalWatched: completed.length,
      totalHoursWatched: Math.round((totalSeconds / 3600) * 10) / 10,
      favoriteGenre: Object.entries(genreMap).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A',
      genreBreakdown: genreMap,
    };
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
