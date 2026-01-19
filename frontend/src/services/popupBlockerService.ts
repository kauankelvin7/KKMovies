/**
 * Popup Blocker Service - Versão otimizada e agressiva contra anúncios
 * Bloqueia popups, redirecionamentos maliciosos, e scripts de tracking
 */

class PopupBlockerService {
  private isActive: boolean = true;
  private blockedCount: number = 0;
  private originalOpen: typeof window.open | null = null;
  private blockedUrls: Set<string> = new Set();
  private clickTimestamps: number[] = [];
  private lastClickTime: number = 0;

  // Padrões extensos de URLs de anúncios/popups e malware
  private readonly adNetworkPatterns: RegExp[] = [
    // Ad Networks principais
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
    // Ad Networks adicionais
    /adnow/i,
    /adskeeper/i,
    /adpushup/i,
    /ad-maven/i,
    /admaven/i,
    /a-ads/i,
    /adcash/i,
    /adtrue/i,
    /adversal/i,
    /affinity/i,
    /infolinks/i,
    /media\.net/i,
    /monetag/i,
    /onclicka/i,
    /onclickads/i,
    /popcash/i,
    /push-notification/i,
    /pushengage/i,
    /pushwoosh/i,
    /vidoza/i,
    /yesadvertising/i,
    /zeroredirect/i,
    // Tracking e Analytics suspeitos
    /tracker/i,
    /analytics.*(?<!google-analytics)/i,
    /collect/i,
    /beacon/i,
    /pixel/i,
    /impression/i,
    // Malware e Phishing
    /malware/i,
    /phishing/i,
    /scam/i,
    /fake/i,
    /virus/i,
    /trojan/i,
  ];

  // Domínios de streaming permitidos
  private readonly allowedStreamingDomains: string[] = [
    'superflixapi.bond',
    'superflixapi.top',
    'superflixapi',
    'superflix',
    'embed',
    'player',
    'vidsrc',
    'tmdb.org',
    'themoviedb.org',
    'youtube.com',
    'youtu.be',
    'vimeo.com',
    'streamtape',
    'dood',
    'mixdrop',
    'vidcloud',
    'filemoon',
    'streamwish',
    'mp4upload',
    'upstream',
    'fembed',
    'streamsb',
    'vidoza',
  ];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Intercepta window.open
    this.interceptWindowOpen();
    
    // Previne popunders e redirecionamentos
    this.preventPopunders();
    
    // Bloqueia beforeunload malicioso
    this.blockMaliciousBeforeUnload();
    
    // Monitora cliques suspeitos
    this.monitorSuspiciousClicks();
    
    // Bloqueia iframes maliciosos
    this.blockMaliciousIframes();

    console.log('[PopupBlocker] Serviço iniciado (modo agressivo anti-ads)');
  }

  private interceptWindowOpen(): void {
    this.originalOpen = window.open;
    const self = this;

    window.open = function(...args: Parameters<typeof window.open>) {
      const url = args[0]?.toString() || '';
      const target = args[1] || '';
      
      // Bloqueia window.open sem interação do usuário (popunders automáticos)
      const timeSinceLastClick = Date.now() - self.lastClickTime;
      const wasUserInitiated = timeSinceLastClick < 2000; // 2 segundos
      
      if (!wasUserInitiated && !self.isAllowedDomain(url)) {
        self.blockedCount++;
        console.log('[PopupBlocker] Popup automático bloqueado (sem interação):', url.substring(0, 60));
        return null;
      }
      
      // Se não tem URL, bloqueia (comum em popunders)
      if (!url || url === 'about:blank') {
        self.blockedCount++;
        console.log('[PopupBlocker] Popup em branco bloqueado');
        return null;
      }

      // Verifica se é um domínio de streaming permitido
      if (self.isAllowedDomain(url)) {
        return self.originalOpen?.apply(window, args) || null;
      }

      // Verifica se é uma rede de ads conhecida
      if (self.isAdNetwork(url)) {
        self.blockedCount++;
        self.blockedUrls.add(url);
        console.log('[PopupBlocker] Popup de ad bloqueado:', url.substring(0, 60));
        return null;
      }
      
      // Bloqueia popups com target suspeito
      if (target === '_blank' && !self.isAllowedDomain(url)) {
        self.blockedCount++;
        console.log('[PopupBlocker] Popup _blank suspeito bloqueado:', url.substring(0, 60));
        return null;
      }

      // Por segurança, bloqueia qualquer outro popup não permitido
      self.blockedCount++;
      console.log('[PopupBlocker] Popup não autorizado bloqueado:', url.substring(0, 60));
      return null;
    };
  }
  
  /**
   * Previne popunders e redirecionamentos
   */
  private preventPopunders(): void {
    // Bloqueia blur events que tentam abrir popunders
    let blurTimeout: number;
    window.addEventListener('blur', () => {
      clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        if (document.hidden) {
          // Previne popunders que tentam abrir quando a janela perde foco
          window.focus();
        }
      }, 100);
    }, { passive: true });
    
    // Monitora tentativas de mudança de location via beforeunload
    window.addEventListener('beforeunload', (e) => {
      const newUrl = (window.location as any).href;
      if (newUrl && (this.isAdNetwork(newUrl) || !this.isAllowedDomain(newUrl))) {
        console.log('[PopupBlocker] Tentativa de redirecionamento bloqueada');
        e.preventDefault();
        e.returnValue = '';
      }
    }, true);
  }
  
  /**
   * Bloqueia beforeunload malicioso
   */
  private blockMaliciousBeforeUnload(): void {
    window.addEventListener('beforeunload', (e) => {
      // Previne popups de "você tem certeza que quer sair?"
      // que são usados para manter usuários em sites de ads
      const target = e.target as any;
      if (target && target !== document) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  }
  
  /**
   * Monitora cliques suspeitos (para detectar click hijacking)
   */
  private monitorSuspiciousClicks(): void {
    document.addEventListener('click', (e) => {
      this.lastClickTime = Date.now();
      this.clickTimestamps.push(this.lastClickTime);
      
      // Remove clicks antigos (mais de 5 segundos)
      this.clickTimestamps = this.clickTimestamps.filter(
        time => this.lastClickTime - time < 5000
      );
      
      // Detecta múltiplos cliques rápidos (possível clickjacking)
      if (this.clickTimestamps.length > 3) {
        const target = e.target as HTMLElement;
        if (target && !target.closest('[data-app-element]')) {
          console.warn('[PopupBlocker] Possível clickjacking detectado');
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    }, true);
  }
  
  /**
   * Bloqueia iframes maliciosos
   */
  private blockMaliciousIframes(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') {
            const iframe = node as HTMLIFrameElement;
            const src = iframe.src || iframe.getAttribute('src') || '';
            
            if (src && (this.isAdNetwork(src) || !this.isAllowedDomain(src))) {
              console.log('[PopupBlocker] Iframe malicioso bloqueado:', src.substring(0, 60));
              iframe.remove();
              this.blockedCount++;
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private isAllowedDomain(url: string): boolean {
    try {
      // Permite URLs relativas ou do mesmo domínio
      if (url.startsWith('/') || url.startsWith(window.location.origin)) {
        return true;
      }

      const urlObj = new URL(url, window.location.origin);
      return this.allowedStreamingDomains.some(domain => 
        urlObj.hostname.includes(domain)
      );
    } catch {
      return true; // Em caso de erro, permite
    }
  }

  private isAdNetwork(url: string): boolean {
    return this.adNetworkPatterns.some(pattern => pattern.test(url));
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
  }
}

// Singleton
export const popupBlocker = new PopupBlockerService();

// Inicializa automaticamente
if (typeof window !== 'undefined') {
  (window as any).__popupBlocker = popupBlocker;
}

export default popupBlocker;
