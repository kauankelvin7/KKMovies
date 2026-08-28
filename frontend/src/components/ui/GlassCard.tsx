import React, { forwardRef, ReactNode, MouseEvent } from 'react';

type GlassCardVariant = 'default' | 'elevated' | 'flat';
type GlassCardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type GlassCardRadius = 'sm' | 'md' | 'lg' | 'xl';

export interface GlassCardProps {
  children?: ReactNode;
  variant?: GlassCardVariant;
  padding?: GlassCardPadding;
  radius?: GlassCardRadius;
  hoverable?: boolean;
  interactive?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  title?: ReactNode;
  subtitle?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  role?: React.AriaRole;
}

const PADDING_MAP: Record<GlassCardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 md:p-5',
  lg: 'p-5 md:p-6',
  xl: 'p-6 md:p-8',
};

const RADIUS_MAP: Record<GlassCardRadius, string> = {
  sm: 'rounded-ios-sm',
  md: 'rounded-ios',
  lg: 'rounded-ios-lg',
  xl: 'rounded-ios-xl',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  variant = 'default',
  padding = 'md',
  radius = 'lg',
  hoverable = true,
  interactive = false,
  onClick,
  className = '',
  style,
  title,
  subtitle,
  header,
  footer,
  ariaLabel,
  role,
}, ref) => {
  const variantStyles = {
    default: '',
    elevated: 'shadow-glass-lg scale-[1.01]',
    flat: 'shadow-none !backdrop-blur-md',
  }[variant];

  const clickable = interactive || !!onClick;

  return (
    <div
      ref={ref}
      onClick={onClick}
      role={role || (clickable ? 'button' : undefined)}
      aria-label={ariaLabel}
      tabIndex={clickable ? 0 : undefined}
      className={[
        'glass-card',
        PADDING_MAP[padding],
        RADIUS_MAP[radius],
        variantStyles,
        clickable ? 'cursor-pointer' : '',
        !hoverable ? 'hover:!transform-none hover:!shadow-glass hover:!border-[var(--glass-separator)]' : '',
        className,
      ].join(' ')}
      style={style}
      onKeyDown={clickable
        ? (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onClick) {
              e.preventDefault();
              onClick(e as unknown as MouseEvent<HTMLDivElement>);
            }
          }
        : undefined}
    >
      {(header || title) && (
        <div className="mb-4">
          {header || (
            <>
              {typeof title === 'string' ? (
                <h3
                  className="font-sf antialiased"
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                    marginBottom: subtitle ? 2 : 0,
                  }}
                >
                  {title}
                </h3>
              ) : (
                title
              )}
              {typeof subtitle === 'string' ? (
                <p className="text-[13px] text-[var(--text-secondary)] leading-snug">
                  {subtitle}
                </p>
              ) : (
                subtitle
              )}
            </>
          )}
        </div>
      )}

      {children && <div className="relative">{children}</div>}

      {footer && (
        <div className="mt-4 pt-4 border-t border-[var(--glass-separator)]">
          {footer}
        </div>
      )}
    </div>
  );
});
GlassCard.displayName = 'GlassCard';
