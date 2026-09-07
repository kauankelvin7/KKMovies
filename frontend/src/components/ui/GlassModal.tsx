import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { SFIcon } from './SFIcon';

export type GlassModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type GlassModalPosition = 'center' | 'bottom';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  size?: GlassModalSize;
  position?: GlassModalPosition;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  ariaLabel?: string;
}

const SIZE_MAP: Record<GlassModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[96vw] md:max-w-[92vw]',
};

export const GlassModal: React.FC<GlassModalProps> = React.memo(({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  header,
  footer,
  size = 'lg',
  position = 'center',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
  ariaLabel,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(closeTimer.current);
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        panelRef.current?.classList.add('is-open');
      });
    } else {
      setMounted(false);
    }
    return () => {
      clearTimeout(closeTimer.current);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => (focusable()[0] || panel)?.focus());
    const trap = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const dialogs = document.querySelectorAll('[data-glass-dialog]');
      if (dialogs[dialogs.length - 1] !== panel?.parentElement) return;
      const targets = focusable();
      const first = targets[0]; const last = targets[targets.length - 1];
      if (!first) { event.preventDefault(); panel?.focus(); return; }
      if (!panel?.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => {
      cancelAnimationFrame(frame); document.removeEventListener('keydown', trap);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [mounted]);

  const handleClose = useCallback(() => {
    clearTimeout(closeTimer.current);
    panelRef.current?.classList.remove('is-open');
    closeTimer.current = setTimeout(() => {
      setMounted(false);
      onClose();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180);
  }, [onClose]);

  useEffect(() => {
    if (!closeOnEsc || !mounted) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[data-glass-dialog]');
      if (e.key === 'Escape' && dialogs[dialogs.length - 1] === panelRef.current?.parentElement) { e.preventDefault(); handleClose(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeOnEsc, mounted, handleClose]);

  if (!mounted) return null;

  const portalRoot =
    (typeof document !== 'undefined' && document.getElementById('portal-root')) ||
    (typeof document !== 'undefined' ? document.body : null);

  if (!portalRoot) return null;

  const positionAlign =
    position === 'bottom'
      ? 'items-end md:items-center'
      : 'items-center';

  return createPortal(
    <div
      className="fixed inset-0 z-[9995] flex justify-center p-4 md:p-8"
      style={{ paddingBottom: position === 'bottom' ? 0 : undefined }}
      role="dialog"
      data-glass-dialog
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === 'string' ? title : 'Janela de diálogo')}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-backdrop is-open"
        onClick={closeOnBackdrop ? handleClose : undefined}
        style={{
          background:
            'rgba(5,5,8,0.55)',
          backdropFilter: 'blur(8px) saturate(180%)',
          WebkitBackdropFilter: 'blur(8px) saturate(180%)',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          'relative z-10 glass-modal w-full',
          SIZE_MAP[size],
          positionAlign,
          'flex flex-col max-h-[88vh] md:max-h-[86vh]',
          'animate-spring-in',
          className,
        ].join(' ')}
      >
        {/* Header */}
        {(header || title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-3 border-b border-[var(--glass-separator)]">
            {header || (
              <div className="min-w-0 flex-1">
                {typeof title === 'string' ? (
                  <h2
                    className="font-sf antialiased truncate"
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      letterSpacing: '-0.014em',
                      lineHeight: 1.2,
                    }}
                  >
                    {title}
                  </h2>
                ) : (
                  title
                )}
                {typeof subtitle === 'string' ? (
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)] leading-snug">
                    {subtitle}
                  </p>
                ) : (
                  subtitle
                )}
              </div>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                className="glass-icon-btn shrink-0 opacity-80 hover:opacity-100"
                aria-label="Fechar"
              >
                <SFIcon icon={X} size={20} strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={[
            'flex-1 overflow-y-auto overflow-x-hidden',
            'px-5 md:px-6 py-4',
            contentClassName,
          ].join(' ')}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 md:px-6 py-4 border-t border-[var(--glass-separator)] bg-[color-mix(in_srgb,var(--glass-bg)_60%,transparent)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portalRoot,
  );
});
GlassModal.displayName = 'GlassModal';
