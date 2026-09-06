/* KKMovies — usePopupBlocker hook
   Returns the blocked popup count, auto-updates on change */
import { useState, useEffect } from 'react';
import { popupBlocker } from '../utils/popupBlocker';

export function usePopupBlocker() {
  const [blockedCount, setBlockedCount] = useState(popupBlocker.blocked);

  useEffect(() => {
    const unsub = popupBlocker.onBlock(() => {
      setBlockedCount(popupBlocker.blocked);
    });
    return unsub;
  }, []);

  return { blockedCount };
}
