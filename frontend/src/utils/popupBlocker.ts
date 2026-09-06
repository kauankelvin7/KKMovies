/* KKMovies — Popup Blocker
   Cross-origin iframes cannot have window.open intercepted from the parent.
   Sandbox without allow-popups / allow-same-origin is what actually stops
   the embed from opening ads. Parent-level window.open is a second layer. */

const IFRAME_SANDBOX = 'allow-scripts allow-forms allow-presentation allow-fullscreen';

export class PopupBlocker {
  private blockedCount = 0;
  private originalWindowOpen: typeof window.open;
  private observer: MutationObserver | null = null;
  private listeners: Array<() => void> = [];
  private boundClick?: (e: MouseEvent) => void;
  private boundAuxClick?: (e: MouseEvent) => void;
  private boundPointerDown?: (e: PointerEvent) => void;

  constructor() {
    this.originalWindowOpen = window.open.bind(window);
  }

  get blocked(): number {
    return this.blockedCount;
  }

  onBlock(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.blockedCount++;
    this.listeners.forEach((cb) => cb());
  }

  activate(): void {
    this.overrideWindowOpen();
    this.interceptClicks();
    this.watchIframes();
    this.blockBeforeUnload();
  }

  deactivate(): void {
    window.open = this.originalWindowOpen;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.boundClick) document.removeEventListener('click', this.boundClick, true);
    if (this.boundAuxClick) document.removeEventListener('auxclick', this.boundAuxClick, true);
    if (this.boundPointerDown) document.removeEventListener('pointerdown', this.boundPointerDown, true);
  }

  private overrideWindowOpen(): void {
    const self = this;
    window.open = function (url?: string | URL, target?: string, features?: string): Window | null {
      const urlStr = url?.toString() || '';
      if (self.isTrustedUrl(urlStr)) {
        return self.originalWindowOpen(url, target, features);
      }
      self.notify();
      return null;
    };
  }

  private shouldBlockAnchor(anchor: HTMLAnchorElement): boolean {
    if (anchor.dataset.allowPopup === 'true') return false;
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
    const opensAway = anchor.target === '_blank' || anchor.rel.includes('opener');
    return opensAway && !this.isTrustedUrl(anchor.href);
  }

  private interceptEvent(e: Event): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest('a');
    if (anchor && this.shouldBlockAnchor(anchor)) {
      e.preventDefault();
      e.stopPropagation();
      this.notify();
    }
  }

  private interceptClicks(): void {
    this.boundClick = (e) => this.interceptEvent(e);
    this.boundAuxClick = (e) => this.interceptEvent(e);
    this.boundPointerDown = (e) => {
      if (e.button === 1) this.interceptEvent(e);
    };
    document.addEventListener('click', this.boundClick, true);
    document.addEventListener('auxclick', this.boundAuxClick, true);
    document.addEventListener('pointerdown', this.boundPointerDown, true);
  }

  private watchIframes(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLIFrameElement) {
            this.sandboxIframe(node);
          }
          if (node instanceof HTMLElement) {
            node.querySelectorAll('iframe').forEach((iframe) => this.sandboxIframe(iframe));
          }
        }
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    document.querySelectorAll('iframe').forEach((iframe) => this.sandboxIframe(iframe));
  }

  private blockBeforeUnload(): void {
    window.addEventListener('beforeunload', (e) => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLIFrameElement) {
        e.preventDefault();
        this.notify();
      }
    });
  }

  sandboxIframe(iframe: HTMLIFrameElement): void {
    const src = iframe.src || iframe.getAttribute('src') || '';
    if (src && this.isOwnOrigin(src)) return;

    const current = iframe.getAttribute('sandbox') || '';
    if (current.includes('allow-popups') || current.includes('allow-same-origin') || !current) {
      iframe.setAttribute('sandbox', IFRAME_SANDBOX);
    }
  }

  private isOwnOrigin(url: string): boolean {
    try {
      const u = new URL(url, window.location.origin);
      return u.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  private isTrustedUrl(url: string): boolean {
    if (!url || url === 'about:blank') return true;
    try {
      const u = new URL(url, window.location.origin);
      const trusted = [
        window.location.hostname,
        'image.tmdb.org',
        'youtube.com',
        'www.youtube.com',
        'youtu.be',
      ];
      return trusted.some((d) => u.hostname === d || u.hostname.endsWith('.' + d));
    } catch {
      return false;
    }
  }
}

export const popupBlocker = new PopupBlocker();
