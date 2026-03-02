/* KauanFlix — Aggressive Popup Blocker
   Blocks unwanted popups from streaming iframes by:
   1. Overriding window.open globally
   2. Intercepting suspicious click handlers
   3. Monitoring and sandboxing iframes via MutationObserver
   4. Blocking suspicious navigations */

export class PopupBlocker {
  private blockedCount = 0;
  private originalWindowOpen: typeof window.open;
  private observer: MutationObserver | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.originalWindowOpen = window.open;
  }

  get blocked(): number {
    return this.blockedCount;
  }

  /** Subscribe to blocked count changes */
  onBlock(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  /** Activate all blocking strategies */
  activate(): void {
    this.overrideWindowOpen();
    this.interceptClicks();
    this.watchIframes();
    this.blockBeforeUnload();
    console.log('[KauanFlix] PopupBlocker ativado');
  }

  /** Deactivate and clean up */
  deactivate(): void {
    window.open = this.originalWindowOpen;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    console.log(`[KauanFlix] PopupBlocker desativado (${this.blockedCount} popups bloqueados)`);
  }

  /** 1. Override window.open to block unwanted popups */
  private overrideWindowOpen(): void {
    const self = this;
    window.open = function (url?: string | URL, target?: string, features?: string): Window | null {
      // Allow same-origin navigations and explicit user actions
      const urlStr = url?.toString() || '';
      if (self.isTrustedUrl(urlStr)) {
        return self.originalWindowOpen.call(window, url, target, features);
      }
      self.blockedCount++;
      self.notify();
      console.warn(`[KauanFlix] Popup bloqueado: ${urlStr}`);
      return null;
    };
  }

  /** 2. Intercept click events that try to open new tabs */
  private interceptClicks(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.target === '_blank') {
        const href = anchor.href || '';
        if (!this.isTrustedUrl(href)) {
          e.preventDefault();
          e.stopPropagation();
          this.blockedCount++;
          this.notify();
          console.warn(`[KauanFlix] Link popup bloqueado: ${href}`);
        }
      }
    }, true); // capture phase
  }

  /** 3. Watch for new iframes and sandbox them */
  private watchIframes(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLIFrameElement) {
            this.sandboxIframe(node);
          }
          // Also check children
          if (node instanceof HTMLElement) {
            const iframes = node.querySelectorAll('iframe');
            iframes.forEach((iframe) => this.sandboxIframe(iframe));
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Sandbox existing iframes
    document.querySelectorAll('iframe').forEach((iframe) => this.sandboxIframe(iframe));
  }

  /** 4. Block beforeunload events from hijacking navigation */
  private blockBeforeUnload(): void {
    window.addEventListener('beforeunload', (e) => {
      // Only block if it seems like a redirect from iframe
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLIFrameElement) {
        e.preventDefault();
        this.blockedCount++;
        this.notify();
      }
    });
  }

  /** Apply sandbox attributes to iframe to prevent popup opening */
  private sandboxIframe(iframe: HTMLIFrameElement): void {
    const src = iframe.src || '';
    // Only sandbox streaming/external iframes, not our own
    if (src && !this.isOwnOrigin(src)) {
      // Set sandbox to allow scripts and same-origin but block popups and top navigation
      const currentSandbox = iframe.getAttribute('sandbox');
      if (!currentSandbox || currentSandbox.includes('allow-popups')) {
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
      }
    }
  }

  /** Check if URL is from our own origin */
  private isOwnOrigin(url: string): boolean {
    try {
      const u = new URL(url, window.location.origin);
      return u.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  /** Check if URL is trusted (our app or known good domains) */
  private isTrustedUrl(url: string): boolean {
    if (!url || url === 'about:blank') return true;
    try {
      const u = new URL(url, window.location.origin);
      const trustedDomains = [
        window.location.hostname,
        'image.tmdb.org',
        'youtube.com',
        'www.youtube.com',
      ];
      return trustedDomains.some((d) => u.hostname === d || u.hostname.endsWith('.' + d));
    } catch {
      return false;
    }
  }
}

/** Singleton instance */
export const popupBlocker = new PopupBlocker();
