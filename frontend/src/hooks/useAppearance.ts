import { useCallback, useEffect, useState } from 'react';

export type AppearanceMode = 'light' | 'dark' | 'system';

interface UseAppearance {
  mode: AppearanceMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: AppearanceMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'kf_appearance_mode';

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('light', resolved === 'light');
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export function useAppearance(): UseAppearance {
  const [mode, setModeState] = useState<AppearanceMode>(() => {
    if (typeof localStorage === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as AppearanceMode | null;
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (mode === 'system') return resolveSystemTheme();
    return mode;
  });

  useEffect(() => {
    const resolved = mode === 'system' ? resolveSystemTheme() : mode;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      const resolved = resolveSystemTheme();
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: AppearanceMode) => {
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  return { mode, resolvedTheme, setMode, toggleTheme };
}
