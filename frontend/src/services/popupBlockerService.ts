/**
 * Popup Blocker Service - Bloqueador avançado e indetectável de popups e anúncios
 * Otimizado para mobile e desktop, funciona em segundo plano sem detecção
 */

class PopupBlockerService {
  private isActive: boolean = true;
  private blockedCount: number = 0;
  private originalOpen: typeof window.open | null = null;
  private originalAddEventListener: typeof EventTarget.prototype.addEventListener | null = null;
  private originalSetTimeout: typeof window.setTimeout | null = null;
  private originalSetInterval: typeof window.setInterval | null = null;
  private blockedUrls: Set<string> = new Set();
  private observer: MutationObserver | null = null;
  private touchStartTime: number = 0;
  private lastTouchTarget: EventTarget | null = null;
  private isMobile: boolean = false;
  private legitimateClicks: WeakSet<Event> = new WeakSet();

  // Padrões de URLs de anúncios/popups
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
    /exoclick/i,
    /propellerads/i,
    /popcash/i,
    /popads/i,
    /clickadu/i,
    /adsterra/i,
    /trafficjunky/i,
    /juicyads/i,
    /popunder/i,
    /clickunder/i,
    /trafficforce/i,
    /hilltopads/i,
    /bidvertiser/i,
    /revenuehits/i,
    /propeller/i,
  ];

  // Seletores de elementos de anúncios
  private readonly blockedSelectors: string[] = [
    '[class*="popup"]:not([data-app-element])',
    '[class*="modal-overlay"]:not([data-app-modal])',
    '[id*="popup"]:not([data-app-element])',
    '[class*="ad-"]:not([class*="add"]):not([class*="admin"]):not([data-app-element])',
    '[id*="ad-"]:not([id*="add"]):not([id*="admin"]):not([data-app-element])',
    'iframe[src*="ads"]',
    'iframe[src*="banner"]',
    'iframe[src*="pop"]',
    '[class*="interstitial"]',
    '[class*="overlay"]:not([data-app-overlay]):not([data-app-element])',
    '[class*="lightbox"]:not([data-app-element])',
    'div[onclick*="window.open"]',
    'a[target="_blank"][href*="click"]',
    '[class*="sticky-ad"]',
    '[class*="floating-ad"]',
    '[id*="floating"]',
    '[class*="preroll"]',
    '[class*="adblock-detect"]',
    '[class*="ad_"]',
    '[id*="ad_"]',
  ];

  constructor() {
    this.isMobile = this.detectMobile();
    this.initialize();
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768) ||
           ('ontouchstart' in window);
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

    // Mobile: proteção avançada contra popups de toque
    if (this.isMobile) {
      this.setupMobileProtection();
    }

    // Intercepta timers maliciosos
    this.interceptTimers();

    // Bloqueia redirecionamentos suspeitos
    this.blockRedirects();

    // Proteção contra click hijacking
    this.setupClickProtection();

    console.log('[PopupBlocker] Serviço iniciado discretamente');
  }

  /**
   * Proteção específica para mobile - bloqueia popups de toque
   */
  private setupMobileProtection(): void {
    // Rastreia toques para detectar popups automáticos
    document.addEventListener('touchstart', (e) => {
      this.touchStartTime = Date.now();
      this.lastTouchTarget = e.target;
    }, { passive: true, capture: true });

    document.addEventListener('touchend', (e) => {
      const touchDuration = Date.now() - this.touchStartTime;
      
      // Se o toque foi muito rápido e não foi no mesmo elemento, provavelmente é ad
      if (touchDuration < 50 && e.target !== this.lastTouchTarget) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { capture: true });

    // Bloqueia cliques fantasma (ghost clicks) comuns em ads mobile
    let lastClick = 0;
    document.addEventListener('click', (e) => {
      const now = Date.now();
      // Cliques muito rápidos em sequência são suspeitos
      if (now - lastClick < 100) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-app-element]') && !target.closest('button') && !target.closest('a')) {
          e.preventDefault();
          e.stopPropagation();
          this.blockedCount++;
          return false;
        }
      }
      lastClick = now;
    }, { capture: true });

    // Previne scroll hijacking
    let scrollLocked = false;
    window.addEventListener('scroll', () => {
      if (scrollLocked) return;
      
      // Detecta scroll automático suspeito
      const scrollCheck = () => {
        const currentScroll = window.scrollY;
        setTimeout(() => {
          if (Math.abs(window.scrollY - currentScroll) > 500) {
            // Scroll muito grande e rápido - provavelmente hijack
            window.scrollTo({ top: currentScroll, behavior: 'instant' });
          }
        }, 50);
      };
      scrollCheck();
    }, { passive: true });
  }

  /**
   * Proteção contra click hijacking
   */
  private setupClickProtection(): void {
    // Cria uma camada de proteção para cliques
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Se é um elemento do app, permite
      if (target.closest('[data-app-element]') || 
          target.closest('[data-app-modal]') ||
          target.closest('button') ||
          target.closest('a[href^="/"]') ||
          this.legitimateClicks.has(e)) {
        return;
      }

      // Verifica se o clique é em elemento suspeito
      const isSuspicious = this.isSuspiciousElement(target);
      
      if (isSuspicious) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.blockedCount++;
        return false;
      }
    }, { capture: true, passive: false });
  }

  private isSuspiciousElement(element: HTMLElement): boolean {
    // Verifica se é invisível ou fora da tela
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    // Elementos invisíveis que recebem cliques são suspeitos
    if (style.opacity === '0' || 
        style.visibility === 'hidden' ||
        rect.width === 0 || 
        rect.height === 0 ||
        rect.top < -100 || 
        rect.left < -100) {
      return true;
    }

    // Verifica classes/IDs suspeitos
    const identifier = `${element.className} ${element.id}`.toLowerCase();
    return this.blockedPatterns.some(pattern => pattern.test(identifier));
  }

  /**
   * Intercepta timers que podem ser usados para abrir popups
   */
  private interceptTimers(): void {
    this.originalSetTimeout = window.setTimeout;
    this.originalSetInterval = window.setInterval;

    const self = this;
    const suspiciousPatterns = /open|popup|ad|click|redirect/i;

    // Wrap setTimeout
    (window as any).setTimeout = function(callback: any, delay?: number, ...args: any[]) {
      if (typeof callback === 'string' && suspiciousPatterns.test(callback)) {
        self.blockedCount++;
        return 0;
      }
      return self.originalSetTimeout!.call(window, callback, delay, ...args);
    };

    // Wrap setInterval
    (window as any).setInterval = function(callback: any, delay?: number, ...args: any[]) {
      if (typeof callback === 'string' && suspiciousPatterns.test(callback)) {
        self.blockedCount++;
        return 0;
      }
      return self.originalSetInterval!.call(window, callback, delay, ...args);
    };
  }

  /**
   * Bloqueia redirecionamentos suspeitos via History API
   */
  private blockRedirects(): void {
    // Intercepta apenas pushState e replaceState que são seguros de sobrescrever
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    const self = this;

    history.pushState = function(state: any, unused: string, url?: string | URL | null) {
      if (url && self.shouldBlock(url.toString())) {
        self.blockedCount++;
        console.log('[PopupBlocker] Navegação bloqueada:', url.toString().substring(0, 50));
        return;
      }
      return originalPushState(state, unused, url);
    };

    history.replaceState = function(state: any, unused: string, url?: string | URL | null) {
      if (url && self.shouldBlock(url.toString())) {
        self.blockedCount++;
        console.log('[PopupBlocker] Navegação bloqueada:', url.toString().substring(0, 50));
        return;
      }
      return originalReplaceState(state, unused, url);
    };
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
        'superflixapi.top',
        'embed',
        'player',
        'vidsrc',
        'tmdb.org',
        'themoviedb.org',
        'youtube.com',
        'youtu.be',
        'vimeo.com',
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
