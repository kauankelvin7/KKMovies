/* KauanFlix — API Status Bar
   Shows a subtle notification when the API is being rate-limited (429).
   Auto-dismisses when the rate limit is resolved. */
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
    <div className="fixed top-16 left-0 right-0 z-50 flex justify-center pointer-events-none animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2 rounded-b-lg bg-kf-yellow/10 border border-kf-yellow/20 backdrop-blur-md text-kf-yellow text-xs font-medium pointer-events-auto">
        <AlertTriangle className="w-3.5 h-3.5" />
        Aguardando API... muitas requisições
        <span className="inline-block w-3 h-3 border-2 border-kf-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
};
