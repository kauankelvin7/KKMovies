import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

export const UpdateToast: React.FC = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Listen for the controlling service worker's state changes
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for waiting service worker
    const checkRegistrations = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        setWaitingWorker(registration.waiting);
        setVisible(true);
      }

      // Listen for updates
      registration?.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setVisible(true);
          }
        });
      });
    };

    checkRegistrations();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-[9990] w-[calc(100%-32px)] sm:w-auto sm:min-w-[340px] p-4 sm:p-5 glass-card shadow-2xl transition-all duration-300 ease-out transform translate-y-0 opacity-100">
      
      <div className="flex items-center gap-3.5">
        {/* Ícone Apple-style */}
        <div className="w-10 h-10 rounded-full bg-[var(--accent-blue-dim)] border border-[var(--accent-blue-border)] flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-[var(--accent-blue)] animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        
        {/* Textos */}
        <div>
          <p className="text-[14px] font-medium text-[var(--text-primary)] tracking-tight">
            Nova atualização disponível
          </p>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-snug">
            Sincronize para ter a melhor experiência.
          </p>
        </div>
      </div>

      {/* Botões Glassmorphism */}
      <div className="flex items-center gap-2.5 mt-4">
        <button
          onClick={handleUpdate}
          className="glass-button primary flex-1 !h-9 !px-0 text-[13px]"
        >
          Atualizar Agora
        </button>
        <button
          onClick={handleDismiss}
          className="glass-button flex-1 !h-9 !px-0 text-[13px]"
        >
          Mais Tarde
        </button>
      </div>
      
    </div>
  );
};