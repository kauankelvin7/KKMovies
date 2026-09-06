/* KKMovies — PWA Install Banner
   Shows a bottom banner prompting the user to install the app.
   Uses the beforeinstallprompt event to trigger native install dialog. */

import React, { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'kf_pwa_install_dismissed';

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in this session
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  }, []);

  if (!visible) return null;

  return (
    <div className="install-banner animate-slide-up">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kf-accent to-purple-400 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Instalar KKMovies</p>
          <p className="text-xs text-kf-text-secondary truncate">Acesso rápido direto da sua tela inicial</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg"
          style={{ background: 'var(--accent-gradient)' }}
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4 text-kf-text-muted" />
        </button>
      </div>
    </div>
  );
};
