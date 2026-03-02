/* KauanFlix — Toast Notification System */
import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-kf-success flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-kf-danger flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-kf-info flex-shrink-0" />,
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
            className="text-kf-text-muted hover:text-white transition-colors"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.getElementById('portal-root') || document.body
  );
};
