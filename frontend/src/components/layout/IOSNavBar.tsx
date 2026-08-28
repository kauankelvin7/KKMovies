import React, { useEffect, useRef, ReactNode } from 'react';
import { ChevronLeft, type LucideIcon } from 'lucide-react';
import { SFIcon } from '../ui/SFIcon';

export type IOSNavBarAction = {
  icon?: LucideIcon;
  label?: string;
  onClick?: () => void;
  href?: string;
  ariaLabel: string;
};

export type IOSNavBarProps = {
  title: ReactNode;
  prompt?: string;
  largeTitle?: boolean;
  leftAction?: IOSNavBarAction | null;
  rightActions?: IOSNavBarAction[];
  transparentAtTop?: boolean;
  className?: string;
  contentClassName?: string;
  onBack?: () => void;
};

export const IOSNavBar: React.FC<IOSNavBarProps> = React.memo(({
  title,
  prompt,
  largeTitle = false,
  leftAction,
  rightActions = [],
  transparentAtTop = false,
  className = '',
  contentClassName = '',
  onBack,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      setScrolled(y > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showBackBtn = !!onBack && !leftAction;

  const renderAction = (action: IOSNavBarAction, key?: string) => {
    const content = action.icon
      ? <SFIcon icon={action.icon} />
      : action.label;

    if (action.href) {
      return (
        <a
          key={key || action.href}
          href={action.href}
          className={action.label && !action.icon
            ? 'px-2 py-1 text-[15px] font-normal text-[var(--ios-blue,#007AFF)] hover:opacity-80 transition-opacity'
            : 'glass-icon-btn'}
          aria-label={action.ariaLabel}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={key || action.ariaLabel}
        type="button"
        onClick={action.onClick}
        className={action.label && !action.icon
          ? 'px-2 py-1 text-[15px] font-normal text-[var(--ios-blue,#007AFF)] hover:opacity-80 transition-opacity'
          : 'glass-icon-btn'}
        aria-label={action.ariaLabel}
      >
        {content}
      </button>
    );
  };

  return (
    <header
      ref={ref}
      className={[
        'glass-nav',
        scrolled ? 'scrolled' : '',
        transparentAtTop && !scrolled
          ? '!bg-transparent !border-b-transparent !shadow-none'
          : '',
        className,
      ].join(' ')}
      style={{ height: 'var(--apple-nav-h, 44px)' }}
    >
      <div
        className={[
          'h-full max-w-[1200px] mx-auto',
          'px-4 md:px-6',
          'flex items-center justify-between gap-3',
          contentClassName,
        ].join(' ')}
        style={{
          height: '100%',
          paddingTop: 'env(safe-area-inset-top, 0)',
        }}
      >
        {/* Left slot */}
        <div className="flex items-center gap-1 min-w-[88px] justify-start shrink-0">
          {showBackBtn && (
            <button
              type="button"
              onClick={onBack}
              className="glass-icon-btn text-[var(--ios-blue,#007AFF)]"
              aria-label="Voltar"
            >
              <SFIcon icon={ChevronLeft} size={22} strokeWidth={2} />
            </button>
          )}
          {leftAction && renderAction(leftAction, 'left')}
        </div>

        {/* Center: Title (iOS style) */}
        <div className="flex-1 min-w-0 pointer-events-none select-none">
          {prompt ? (
            <div className="flex flex-col items-center leading-tight text-center">
              <span className="text-[10px] uppercase tracking-wide opacity-60">
                {prompt}
              </span>
              {typeof title === 'string' ? (
                <span
                  className="block truncate font-sf antialiased text-center"
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </span>
              ) : (
                title
              )}
            </div>
          ) : typeof title === 'string' ? (
            <span
              className={[
                'block truncate font-sf antialiased text-center',
                largeTitle ? 'text-left !text-[28px] md:!text-[34px] mt-16' : '!text-[17px]',
              ].join(' ')}
              style={{
                fontWeight: largeTitle ? 700 : 600,
                letterSpacing: largeTitle ? '-0.022em' : '-0.01em',
                textAlign: largeTitle ? 'left' : 'center',
              }}
            >
              {title}
            </span>
          ) : (
            title
          )}
        </div>

        {/* Right slot */}
        <div className="flex items-center gap-1 min-w-[88px] justify-end shrink-0">
          {rightActions.slice(0, 3).map((action, idx) => renderAction(action, `r-${idx}`))}
        </div>
      </div>
    </header>
  );
});
IOSNavBar.displayName = 'IOSNavBar';
