import { useSyncExternalStore } from 'react';
import { detectTV } from '../tv/navigation';

export type TVPreference = 'auto' | 'tv' | 'standard';
const key = 'kkm-tv-mode';
let preference: TVPreference = 'auto';
try {
  const saved = localStorage.getItem(key);
  if (saved === 'tv' || saved === 'standard') preference = saved;
} catch { /* Storage is optional on TV browsers. */ }
const listeners = new Set<() => void>();
export function setTVPreference(value: TVPreference) {
  preference = value;
  try { localStorage.setItem(key, value); } catch { /* Keep the in-memory choice. */ }
  listeners.forEach(listener => listener());
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useTVMode() {
  const mode = useSyncExternalStore(subscribe, () => preference);
  return { preference: mode, isTV: mode === 'tv' || (mode === 'auto' && detectTV(navigator.userAgent)) };
}
