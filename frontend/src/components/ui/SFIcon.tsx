import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type SFIconProps = {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

export const SFIcon: React.FC<SFIconProps> = React.memo(({
  icon: Icon,
  size = 20,
  strokeWidth = 1.75,
  className = '',
  style,
}) => (
  <Icon
    size={size}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ ...style, flexShrink: 0 }}
  />
));
SFIcon.displayName = 'SFIcon';
