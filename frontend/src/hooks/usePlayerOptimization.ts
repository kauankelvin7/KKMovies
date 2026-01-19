import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook customizado para otimizar o carregamento e performance do player
 */
export const usePlayerOptimization = () => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [hasPreloaded, setHasPreloaded] = useState(false);
  const preloadTimeoutRef = useRef<number>();

  /**
   * Preload do player com delay para evitar sobrecarga
   */
  const preloadPlayer = useCallback((streamUrl: string) => {
    if (hasPreloaded) return;

    preloadTimeoutRef.current = setTimeout(() => {
      // Criar link preload no head
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = new URL(streamUrl).origin;
      document.head.appendChild(link);

      setHasPreloaded(true);
    }, 500);
  }, [hasPreloaded]);

  /**
   * Marca o player como pronto
   */
  const markPlayerReady = useCallback(() => {
    setIsPlayerReady(true);
  }, []);

  /**
   * Reset do estado do player
   */
  const resetPlayer = useCallback(() => {
    setIsPlayerReady(false);
    setHasPreloaded(false);
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  return {
    isPlayerReady,
    hasPreloaded,
    preloadPlayer,
    markPlayerReady,
    resetPlayer,
  };
};

/**
 * Hook para detectar e bloquear anúncios no iframe
 */
export const useAdBlocker = () => {
  const blockedAdsCount = useRef(0);

  const checkForAds = useCallback((iframe: HTMLIFrameElement) => {
    try {
      // Verifica se o iframe carregou um domínio de anúncio
      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) return;

      const adPatterns = [
        /doubleclick/i,
        /adsense/i,
        /adserver/i,
        /pagead/i,
      ];

      const iframeUrl = iframeWindow.location.href;
      const hasAd = adPatterns.some(pattern => pattern.test(iframeUrl));

      if (hasAd) {
        blockedAdsCount.current++;
        console.log('[AdBlocker] Anúncio detectado e bloqueado no iframe');
        return true;
      }
    } catch (e) {
      // Cross-origin - não podemos verificar
    }
    return false;
  }, []);

  return { checkForAds, blockedAdsCount: blockedAdsCount.current };
};

export default usePlayerOptimization;
