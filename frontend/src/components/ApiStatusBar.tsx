/* KKMovies — API Status Bar (iOS Dynamic Island style) */
import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { onRateLimitChange } from '../services/api';

export const ApiStatusBar: React.FC = () => {
  const [isLimited, setIsLimited] = useState(false);

  useEffect(() => {
    const unsub = onRateLimitChange(setIsLimited);
    return unsub;
  }, []);

  if (!isLimited) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[200] flex justify-center pointer-events-none animate-fade-in">
      <div
        className="flex items-center gap-2 px-4 py-2.5 pointer-events-auto"
        style={{
          borderRadius: 9999,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '0.5px solid var(--glass-separator)',
          boxShadow: 'var(--glass-outer-glow), inset 0 1px 0 var(--glass-inner-border)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#FF9500' }} />
        Aguardando API...
        <span
          className="inline-block w-3 h-3 rounded-full animate-spin"
          style={{ border: '2px solid var(--accent-blue)', borderTopColor: 'transparent' }}
        />
      </div>
    </div>
  );
};
