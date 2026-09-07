/* KKMovies — Global Keyboard Shortcuts
   /  or S → focus search
   H → Home
   F → Filmes
   T → Séries
   M → Minha Lista
   ESC → close modals / player */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const closePlayer = usePlayerStore((s) => s.closePlayer);
  const isPlayerOpen = usePlayerStore((s) => s.isOpen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || e.repeat) return;
      if (document.querySelector('[aria-modal="true"], dialog[open]')) return;
      const target = e.target as HTMLElement;
      // Don't trigger shortcuts if user is typing in an input/textarea/select
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case '/':
        case 's':
        case 'S':
          e.preventDefault();
          navigate('/buscar', { state: { focusSearch: true } });
          break;

        case 'h':
        case 'H':
          navigate('/');
          break;

        case 'f':
        case 'F':
          // Don't intercept 'f' if player is open (fullscreen toggle)
          if (!isPlayerOpen) navigate('/filmes');
          break;

        case 't':
        case 'T':
          navigate('/series');
          break;

        case 'm':
        case 'M':
          // Don't intercept 'm' if player is open (mute toggle)
          if (!isPlayerOpen) navigate('/minha-lista');
          break;

        case 'Escape':
          if (isPlayerOpen) {
            closePlayer();
          }
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, closePlayer, isPlayerOpen]);
}
