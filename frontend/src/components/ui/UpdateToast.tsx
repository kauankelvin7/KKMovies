/* KauanFlix — PWA Update Toast
   Shows a toast notification when a new service worker version is available.
   User can click "Atualizar" to activate the new version. */

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
    <div className="update-toast animate-slide-up">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-kf-accent flex-shrink-0 animate-spin-slow" />
        <div>
          <p className="text-sm font-medium text-white">Nova versão disponível</p>
          <p className="text-xs text-kf-text-secondary">Atualize para ter as melhorias mais recentes.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleUpdate}
          className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg"
          style={{ background: 'var(--accent-gradient)' }}
        >
          Atualizar
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-sm text-kf-text-secondary hover:text-white transition-colors"
        >
          Depois
        </button>
      </div>
    </div>
  );
};
