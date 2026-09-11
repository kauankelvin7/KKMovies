import { useEffect } from 'react';
import { atLeftEdge, nextIndex, remoteKey, type Direction } from '../tv/navigation';

const selector = 'a[href], button, input, select, textarea, iframe, [tabindex="0"]';
export function useTVNavigation(enabled: boolean, route: string, onBack: () => void, onMenu?: () => void) {
  useEffect(() => {
    document.documentElement.classList.toggle('tv-mode', enabled);
    if (!enabled) return;
    const scope = (): HTMLElement | Document => {
      const dialogs = document.querySelectorAll<HTMLElement>('dialog[open], [aria-modal="true"]');
      return dialogs[dialogs.length - 1] || document;
    };
    const targets = () => Array.from(scope().querySelectorAll<HTMLElement>(selector)).filter(el => {
      const style = getComputedStyle(el);
      return el.tabIndex >= 0 && !el.matches(':disabled, [aria-disabled="true"]') && !el.closest('[inert], [hidden], [aria-hidden="true"]') &&
        el.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none' &&
        !el.matches('.shelf-rail, .skip-link');
    });
    const focus = (el?: HTMLElement) => { el?.focus({ preventScroll: true }); el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' }); };
    const recover = () => {
      const items = targets();
      if (!items.includes(document.activeElement as HTMLElement)) {
        focus(items.find(el => el.closest('#page-content')) || items[0]);
      }
    };
    const frame = requestAnimationFrame(recover);
    // Lazy routes, removed results and overlays must never leave the remote without a focus target.
    const observer = new MutationObserver(() => { if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected || !scope().contains(document.activeElement)) recover(); });
    observer.observe(document.body, { childList: true, subtree: true });
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.defaultPrevented) return;
      const key = remoteKey(event.key, event.keyCode);
      const active = document.activeElement as HTMLElement;
      // The menu owns dismissal and focus restoration; never navigate behind it.
      if (active?.closest('.tv-sidebar') && ['Escape', 'ArrowRight'].includes(key)) return;
      if (key === 'Escape') {
        // Preserve native editing / virtual-keyboard dismissal before leaving the page.
        if (active?.matches('input, textarea, select') || active?.isContentEditable) { active.blur(); event.preventDefault(); return; }
        if (scope() !== document) {
          if (event.key === 'Escape') return;
          event.preventDefault(); event.stopPropagation();
          const modal = scope();
          if (modal instanceof HTMLDialogElement) modal.dispatchEvent(new Event('cancel', { cancelable: true }));
          else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          return;
        }
        event.preventDefault(); event.stopPropagation(); if (!event.repeat) onBack(); return;
      }
      // Native selects retain Up/Down; Left/Right allow leaving the control.
      if (active?.isContentEditable || active?.matches('textarea') || (active?.matches('input') && ['ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) || (active?.matches('select') && ['ArrowUp', 'ArrowDown', 'Enter'].includes(key))) return;
      if (key === 'Enter') {
        if (active?.tagName === 'IFRAME') return;
        event.preventDefault(); event.stopPropagation(); if (!event.repeat) active?.click(); return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return;
      event.preventDefault(); event.stopPropagation();
      const items = targets();
      if (!items.includes(active)) { recover(); return; }
      const candidates = items.filter(el => el !== active && !active.contains(el) && !el.contains(active));
      const origin = active.getBoundingClientRect();
      if (key === 'ArrowLeft' && onMenu && scope() === document && atLeftEdge(origin, candidates.filter(el => !el.matches('.tv-menu-indicator')).map(el => el.getBoundingClientRect()))) { onMenu(); return; }
      const index = nextIndex(active.getBoundingClientRect(), candidates.map(el => el.getBoundingClientRect()), key as Direction);
      if (index >= 0) focus(candidates[index]);
    };
    document.addEventListener('keydown', handler, true);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('keydown', handler, true); document.documentElement.classList.remove('tv-mode'); };
  }, [enabled, route, onBack, onMenu]);
}
