export type Direction = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';
export type Rect = { left: number; right: number; top: number; bottom: number };

export function atLeftEdge(origin: Rect, candidates: Rect[]) {
  return !candidates.some(rect => rect.right <= origin.left + 1 && rect.top < origin.bottom && rect.bottom > origin.top);
}

export function detectTV(userAgent: string) {
  return /smart[- ]?tv|hbbtv|tizen|web[o0]s|netcast|viera|bravia|googletv|google tv|android tv|aft\w+|roku|vidaa|hisense|[; ]tv[;) ]/i.test(userAgent);
}

export function remoteKey(key: string, code: number) {
  if (['GoBack', 'BrowserBack', 'Back', 'Escape'].includes(key) || [10009, 461, 27].includes(code)) return 'Escape';
  return ({ 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 13: 'Enter' } as Record<number, string>)[code] || key;
}

// Prefer the same row/column before diagonals, including cards outside a scroll viewport.
export function nextIndex(origin: Rect, candidates: Rect[], direction: Direction) {
  const horizontal = direction === 'ArrowLeft' || direction === 'ArrowRight';
  const sign = direction === 'ArrowLeft' || direction === 'ArrowUp' ? -1 : 1;
  const center = (r: Rect) => horizontal ? (r.left + r.right) / 2 : (r.top + r.bottom) / 2;
  const cross = (r: Rect) => horizontal ? (r.top + r.bottom) / 2 : (r.left + r.right) / 2;
  let best = -1, score = Infinity;
  candidates.forEach((rect, index) => {
    const distance = (center(rect) - center(origin)) * sign;
    if (distance <= 1) return;
    const aligned = horizontal ? rect.top < origin.bottom && rect.bottom > origin.top : rect.left < origin.right && rect.right > origin.left;
    const value = distance + Math.abs(cross(rect) - cross(origin)) * 3 + (aligned ? 0 : 10000);
    if (value < score) { score = value; best = index; }
  });
  return best;
}
