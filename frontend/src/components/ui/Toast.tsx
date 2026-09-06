/* KKMovies — Toast Notification System */
import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const icons = {
  success: <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#8E6FD6' }} />,
  error: <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#EF4444' }} />,
  info: <Info className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />,
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {icons[toast.type]}
          <span className="text-sm text-white flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Fechar notificação"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.getElementById('portal-root') || document.body
  );
};
