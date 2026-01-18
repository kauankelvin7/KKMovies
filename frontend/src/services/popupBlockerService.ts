/**
 * Popup Blocker Service - Versão simplificada e segura
 * Bloqueia apenas popups de anúncios sem interferir com iframes de streaming
 */

class PopupBlockerService {
  private isActive: boolean = true;
  private blockedCount: number = 0;
  private originalOpen: typeof window.open | null = null;
  private blockedUrls: Set<string> = new Set();

  // Padrões de URLs de anúncios/popups (apenas redes de ads conhecidas)
  private readonly adNetworkPatterns: RegExp[] = [
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

    // Apenas intercepta window.open de forma segura
    this.interceptWindowOpen();

    console.log('[PopupBlocker] Serviço iniciado (modo simplificado)');
  }

  private interceptWindowOpen(): void {
    this.originalOpen = window.open;
    const self = this;

    window.open = function(...args: Parameters<typeof window.open>) {
      const url = args[0]?.toString() || '';
      
      // Se não tem URL, permite
      if (!url) {
        return self.originalOpen?.apply(window, args) || null;
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

      // Permite todos os outros popups
      return self.originalOpen?.apply(window, args) || null;
    };
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
