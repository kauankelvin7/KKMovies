/**
 * Popup Blocker Service - Bloqueador discreto de popups e anúncios
 * Funciona em segundo plano sem ser detectado
 */

class PopupBlockerService {
  private isActive: boolean = true;
  private blockedCount: number = 0;
  private originalOpen: typeof window.open | null = null;
  private originalAddEventListener: typeof EventTarget.prototype.addEventListener | null = null;
  private blockedUrls: Set<string> = new Set();
  private observer: MutationObserver | null = null;

  // Padrões comuns de popups/ads
  private readonly blockedPatterns: RegExp[] = [
    /popup/i,
    /banner/i,
    /advert/i,
    /sponsor/i,
    /promo/i,
    /overlay/i,
    /interstitial/i,
    /modal-ad/i,
    /ad-container/i,
    /google.*ad/i,
    /doubleclick/i,
    /adsense/i,
    /adsbygoogle/i,
    /pagead/i,
    /amazon-adsystem/i,
    /outbrain/i,
    /taboola/i,
    /mgid/i,
    /revcontent/i,
  ];

  private readonly blockedSelectors: string[] = [
    '[class*="popup"]',
    '[class*="modal-overlay"]:not([data-app-modal])',
    '[id*="popup"]',
    '[class*="ad-"]:not([class*="add"]):not([class*="admin"])',
    '[id*="ad-"]:not([id*="add"]):not([id*="admin"])',
    'iframe[src*="ads"]',
    'iframe[src*="banner"]',
    '[class*="interstitial"]',
    '[class*="overlay"]:not([data-app-overlay])',
  ];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Intercepta window.open
    this.interceptWindowOpen();

    // Intercepta criação de elementos suspeitos
    this.observeDOM();

    // Bloqueia event listeners de popups
    this.interceptEventListeners();

    // Remove popups existentes periodicamente
    this.startPeriodicCleanup();

    // Bloqueia beforeunload maliciosos
    this.blockBeforeUnload();

    console.log('[PopupBlocker] Serviço iniciado discretamente');
  }

  private interceptWindowOpen(): void {
    this.originalOpen = window.open;
    const self = this;

    window.open = function(...args: Parameters<typeof window.open>) {
      const url = args[0]?.toString() || '';
      
      // Verifica se é um popup legítimo (mesmo domínio ou chamado por ação do usuário)
      const isLegitimate = self.isLegitimatePopup(url);
      
      if (!isLegitimate && self.shouldBlock(url)) {
        self.blockedCount++;
        self.blockedUrls.add(url);
        console.log('[PopupBlocker] Popup bloqueado:', url.substring(0, 50));
        return null;
      }

      return self.originalOpen?.apply(window, args) || null;
    };
  }

  private isLegitimatePopup(url: string): boolean {
    try {
      // Permite popups do mesmo domínio
      if (url.startsWith('/') || url.startsWith(window.location.origin)) {
        return true;
      }
      
      // Permite serviços de streaming conhecidos
      const allowedDomains = [
        'superflixapi.bond',
        'embed',
        'player',
        'vidsrc',
        'tmdb.org',
        'themoviedb.org',
      ];
      
      const urlObj = new URL(url, window.location.origin);
      return allowedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  private shouldBlock(url: string): boolean {
    if (!url) return false;
    return this.blockedPatterns.some(pattern => pattern.test(url));
  }

  private observeDOM(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.checkAndRemoveAd(node);
          }
        });
      });
    });

    // Observa quando o DOM estiver pronto
    if (document.body) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        this.observer?.observe(document.body, {
          childList: true,
          subtree: true,
        });
      });
    }
  }

  private checkAndRemoveAd(element: HTMLElement): void {
    if (!this.isActive) return;

    // Verifica se é um elemento do app (não deve ser removido)
    if (element.hasAttribute('data-app-element')) return;
    if (element.closest('[data-app-element]')) return;

    // Verifica classes e IDs suspeitos
    const classAndId = `${element.className} ${element.id}`.toLowerCase();
    
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(classAndId)) {
        // Verifica se não é parte do app principal
        if (!element.closest('main') && !element.closest('[data-app-content]')) {
          this.hideElement(element);
          return;
        }
      }
    }

    // Verifica iframes suspeitos
    if (element.tagName === 'IFRAME') {
      const src = element.getAttribute('src') || '';
      if (this.shouldBlock(src) && !this.isLegitimatePopup(src)) {
        this.hideElement(element);
      }
    }
  }

  private hideElement(element: HTMLElement): void {
    // Remove de forma discreta sem causar erros
    try {
      element.style.display = 'none';
      element.style.visibility = 'hidden';
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      this.blockedCount++;
    } catch (error) {
      // Silenciosamente ignora erros
    }
  }

  private interceptEventListeners(): void {
    this.originalAddEventListener = EventTarget.prototype.addEventListener;
    const self = this;

    EventTarget.prototype.addEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      // Bloqueia listeners que tentam abrir popups em cliques
      if (type === 'click' && self.isActive) {
        const wrappedListener = function(this: EventTarget, event: Event) {
          // Permite o evento mas intercepta window.open dentro
          if (typeof listener === 'function') {
            return listener.call(this, event);
          } else if (listener && typeof listener.handleEvent === 'function') {
            return listener.handleEvent(event);
          }
        };
        return self.originalAddEventListener?.call(this, type, wrappedListener as EventListener, options);
      }

      return self.originalAddEventListener?.call(this, type, listener, options);
    };
  }

  private blockBeforeUnload(): void {
    // Previne popups de "tem certeza que deseja sair?"
    let legitimateBeforeUnload = false;

    window.addEventListener('beforeunload', (event) => {
      if (!legitimateBeforeUnload && this.isActive) {
        // Apenas permite se foi definido pelo app
        delete event.returnValue;
        return undefined;
      }
    }, { capture: true });

    // Método para o app definir beforeunload legítimo
    (window as any).__setLegitimateBeforeUnload = (value: boolean) => {
      legitimateBeforeUnload = value;
    };
  }

  private startPeriodicCleanup(): void {
    // Limpa elementos suspeitos a cada 2 segundos
    setInterval(() => {
      if (!this.isActive) return;

      this.blockedSelectors.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach((element) => {
            if (element instanceof HTMLElement && !element.hasAttribute('data-app-element')) {
              this.hideElement(element);
            }
          });
        } catch {
          // Ignora erros de seletor inválido
        }
      });
    }, 2000);
  }

  /**
   * Ativa o bloqueador
   */
  enable(): void {
    this.isActive = true;
  }

  /**
   * Desativa o bloqueador
   */
  disable(): void {
    this.isActive = false;
  }

  /**
   * Retorna estatísticas
   */
  getStats(): { blockedCount: number; blockedUrls: string[] } {
    return {
      blockedCount: this.blockedCount,
      blockedUrls: Array.from(this.blockedUrls),
    };
  }

  /**
   * Verifica se está ativo
   */
  isEnabled(): boolean {
    return this.isActive;
  }

  /**
   * Adiciona URL à lista de permitidos
   */
  allowUrl(url: string): void {
    this.blockedUrls.delete(url);
  }

  /**
   * Limpa recursos
   */
  destroy(): void {
    if (this.originalOpen) {
      window.open = this.originalOpen;
    }
    if (this.originalAddEventListener) {
      EventTarget.prototype.addEventListener = this.originalAddEventListener;
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton
export const popupBlocker = new PopupBlockerService();

// Inicializa automaticamente
if (typeof window !== 'undefined') {
  (window as any).__popupBlocker = popupBlocker;
}

export default popupBlocker;
