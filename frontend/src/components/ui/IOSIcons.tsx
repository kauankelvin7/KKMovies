import React from 'react';

export type IOSIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  filled?: boolean;
};

const iconBase = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

const makeSvg = (
  path: React.ReactNode,
  { size = 24, strokeWidth = 1.75, className = '', style, color = 'currentColor', filled = false }:
  IOSIconProps & { filled?: boolean }
) => (
  <svg
    {...iconBase}
    width={size}
    height={size}
    stroke={filled ? 'none' : color}
    strokeWidth={filled ? 0 : strokeWidth}
    className={`shrink-0 ${className}`}
    style={{ flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    {path}
  </svg>
);

export const IOSHomeIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <path d="M6.5 10.5L12 5.5L17.5 10.5V18.5C17.5 18.8978 17.342 19.2794 17.0607 19.5607C16.7794 19.842 16.3978 20 16 20H8C7.60218 20 7.22064 19.842 6.93934 19.5607C6.65804 19.2794 6.5 18.8978 6.5 18.5V10.5Z" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 1 : 0} />
    <path d="M6.5 10.5L12 5.5L17.5 10.5V18.5C17.5 18.8978 17.342 19.2794 17.0607 19.5607C16.7794 19.842 16.3978 20 16 20H8C7.60218 20 7.22064 19.842 6.93934 19.5607C6.65804 19.2794 6.5 18.8978 6.5 18.5V10.5Z" />
    <path d="M9.5 20V13.5H14.5V20" />
  </>,
  props
);

export const IOSSearchIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <circle cx="11" cy="11" r="6.75" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.12 : 0} />
    <circle cx="11" cy="11" r="6.75" />
    <line x1="16.5" y1="16.5" x2="20.5" y2="20.5" strokeWidth={props.strokeWidth ? props.strokeWidth * 1.15 : 2} strokeLinecap="round" />
  </>,
  props
);

export const IOSHeartIcon: React.FC<IOSIconProps & { filled?: boolean }> = (props) => makeSvg(
  <>
    <path
      d="M12 20.5C12 20.5 3.5 15 3.5 8.75C3.5 6.40033 5.40033 4.5 7.75 4.5C9.33908 4.5 10.7849 5.36129 11.5913 6.68167L12 7.34336L12.4087 6.68167C13.2151 5.36129 14.6609 4.5 16.25 4.5C18.5997 4.5 20.5 6.40033 20.5 8.75C20.5 15 12 20.5 12 20.5Z"
      fill={props.filled ? '#FF375F' : 'none'}
      stroke={props.filled ? '#FF375F' : props.color || 'currentColor'}
    />
  </>,
  props
);

export const IOSClockIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <circle cx="12" cy="12" r="8.5" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.12 : 0} />
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.25V12L15.25 14" strokeLinecap="round" strokeLinejoin="round" />
  </>,
  props
);

export const IOSPlayIcon: React.FC<IOSIconProps & { filled?: boolean }> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 1.75;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      className={`shrink-0 ${props.className || ''}`}
      style={{ flexShrink: 0, ...props.style }}
      aria-hidden="true"
    >
      {props.filled ? (
        <path
          d="M7.5 5.84298C7.5 5.01798 8.398 4.51798 9.134 4.92298L17.674 9.57498C18.431 9.98798 18.431 11.015 17.674 11.428L9.134 16.08C8.398 16.485 7.5 15.985 7.5 15.16V5.84298Z"
          fill={props.color || 'currentColor'}
        />
      ) : (
        <>
          <path
            d="M8.5 6.5L17 11.5L8.5 16.5V6.5Z"
            fill={props.color || 'currentColor'}
            fillOpacity="0.08"
            stroke={props.color || 'currentColor'}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
};

export const IOSPauseIcon: React.FC<IOSIconProps & { filled?: boolean }> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 1.75;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      {props.filled ? (
        <g fill={props.color || 'currentColor'}>
          <rect x="6.5" y="5" width="4" height="14" rx="1.5" />
          <rect x="13.5" y="5" width="4" height="14" rx="1.5" />
        </g>
      ) : (
        <g stroke={props.color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="5.5" width="3.5" height="13" rx="1.25" fill={props.color || 'currentColor'} fillOpacity="0.08" />
          <rect x="13.5" y="5.5" width="3.5" height="13" rx="1.25" fill={props.color || 'currentColor'} fillOpacity="0.08" />
        </g>
      )}
    </svg>
  );
};

export const IOSFilmIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <rect x="4" y="5.5" width="16" height="13" rx="2.5" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.1 : 0} />
    <rect x="4" y="5.5" width="16" height="13" rx="2.5" />
    <path d="M4 9H20M4 15H20M8.5 5.5V18.5M15.5 5.5V18.5" />
  </>,
  props
);

export const IOSTvIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <rect x="3.5" y="5" width="17" height="12" rx="2" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.1 : 0} />
    <rect x="3.5" y="5" width="17" height="12" rx="2" />
    <path d="M8 20H16M12 17V20" />
  </>,
  props
);

export const IOSChevronLeftIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 2;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path d="M14.5 5.5L8 12L14.5 18.5" stroke={props.color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const IOSChevronRightIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 2;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path d="M9.5 5.5L16 12L9.5 18.5" stroke={props.color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const IOSChevronDownIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 2;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path d="M5.5 9.5L12 16L18.5 9.5" stroke={props.color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const IOSXIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 2;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" stroke={props.color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const IOSPlusIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 2;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path d="M12 5.5V18.5M5.5 12H18.5" stroke={props.color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const IOSCheckIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 2.25;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path d="M5 12.5L10 17.5L19 6.5" stroke={props.color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const IOSInfoIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <circle cx="12" cy="12" r="8.5" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.12 : 0} />
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11V17M12 7.5H12.01" strokeWidth={(props.strokeWidth || 1.75) * 1.1} />
  </>,
  props
);

export const IOSStarIcon: React.FC<IOSIconProps & { filled?: boolean; half?: boolean }> = (props) => {
  const s = props.size || 24;
  const fill = props.filled ? (props.color || '#FF9500') : 'none';
  const fillOpacity = props.filled ? 1 : 0;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <defs>
        <linearGradient id="halfStar">
          <stop offset="50%" stopColor={props.color || '#FF9500'} stopOpacity="1" />
          <stop offset="50%" stopColor={props.color || '#FF9500'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 3.5L14.75 9.25L21 10L16.25 14.25L17.5 20.5L12 17.25L6.5 20.5L7.75 14.25L3 10L9.25 9.25L12 3.5Z"
        fill={props.half ? 'url(#halfStar)' : fill}
        fillOpacity={props.half ? 1 : fillOpacity}
        stroke={props.color || '#FF9500'}
        strokeWidth={props.strokeWidth || 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const IOSMenuIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  const sw = props.strokeWidth || 1.75;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path d="M5 7H19M5 12H19M5 17H14" stroke={props.color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const IOSExternalLinkIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <path d="M14 4.5H19V9.5" />
    <path d="M10 14L20 4" />
    <path d="M19 14V17.5C19 17.8978 18.842 18.2794 18.5607 18.5607C18.2794 18.842 17.8978 19 17.5 19H6.5C6.10218 19 5.72064 18.842 5.43934 18.5607C5.15804 18.2794 5 17.8978 5 17.5V6.5C5 6.10218 5.15804 5.72064 5.43934 5.43934C5.72064 5.15804 6.10218 5 6.5 5H10" />
  </>,
  props
);

export const IOSSettingsIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <circle cx="12" cy="12" r="3" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.15 : 0} />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2L13.5 5.2L17 4L17.3 7.5L20.5 8.3L19.3 11.5L21 14.5L17.8 15.7L17.6 19L14.3 18.9L12 22L9.7 18.9L6.4 19L6.2 15.7L3 14.5L4.7 11.5L3.5 8.3L6.7 7.5L7 4L10.5 5.2L12 2Z" />
  </>,
  props
);

export const IOSRefreshIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <path d="M4.5 12C4.5 7.85786 7.85786 4.5 12 4.5C14.8638 4.5 17.3474 6.11911 18.6804 8.43985" />
    <path d="M20.5 12C20.5 16.1421 17.1421 19.5 13 19.5C10.1362 19.5 7.65257 17.8809 6.31958 15.5602" />
    <path d="M20.5 4.5V8.5H16.5" />
    <path d="M3.5 19.5V15.5H7.5" />
  </>,
  props
);

export const IOSServerIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <rect x="3.5" y="4.5" width="17" height="6.5" rx="2" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.08 : 0} />
    <rect x="3.5" y="13" width="17" height="6.5" rx="2" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.08 : 0} />
    <rect x="3.5" y="4.5" width="17" height="6.5" rx="2" />
    <rect x="3.5" y="13" width="17" height="6.5" rx="2" />
    <path d="M7.75 7.75H7.76M7.75 16.25H7.76" strokeWidth={(props.strokeWidth || 1.75) * 1.8} strokeLinecap="round" />
  </>,
  props
);

export const IOSZapIcon: React.FC<IOSIconProps & { filled?: boolean }> = (props) => {
  const s = props.size || 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path
        d="M13 2.5L4.5 14H11.5L10.5 21.5L19 10H13.5L13 2.5Z"
        fill={props.filled ? '#FFCC00' : 'none'}
        fillOpacity={props.filled ? 1 : 0.08}
        stroke={props.filled ? '#FFCC00' : props.color || 'currentColor'}
        strokeWidth={props.strokeWidth || 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const IOSVolumeIcon: React.FC<IOSIconProps & { muted?: boolean }> = (props) => makeSvg(
  <>
    <path d="M11 5.5L6 9H3V15H6L11 18.5V5.5Z" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.12 : 0} />
    <path d="M11 5.5L6 9H3V15H6L11 18.5V5.5Z" />
    <path d="M15.5 9.5C16.5 10.5 16.5 13.5 15.5 14.5" />
    <path d="M18 7C20 8.8 20 15.2 18 17" opacity={props.muted ? 0 : 1} />
    {props.muted && <path d="M20 4.5L14 19.5" />}
  </>,
  props
);

export const IOSFullscreenIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <path d="M4 9V4H9M20 9V4H15M4 15V20H9M20 15V20H15" />
  </>,
  props
);

export const IOSExitFullscreenIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <path d="M9 4V9H4M15 4V9H20M9 20V15H4M15 20V15H20" />
  </>,
  props
);

export const IOSSkipBackIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <g stroke={props.color || 'currentColor'} strokeWidth={props.strokeWidth || 1.75} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M12 5V1M12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 9.8617 5.97456 7.92601 7.5 6.76834" />
        <path d="M12 1L9 4M12 1L15 4" />
      </g>
      <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fill={props.color || 'currentColor'} fontFamily="-apple-system, 'SF Pro Text', sans-serif">10</text>
    </svg>
  );
};

export const IOSSkipForwardIcon: React.FC<IOSIconProps> = (props) => {
  const s = props.size || 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <g stroke={props.color || 'currentColor'} strokeWidth={props.strokeWidth || 1.75} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M12 5V1M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 9.8617 18.0254 7.92601 16.5 6.76834" />
        <path d="M12 1L9 4M12 1L15 4" />
      </g>
      <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fill={props.color || 'currentColor'} fontFamily="-apple-system, 'SF Pro Text', sans-serif">10</text>
    </svg>
  );
};

export const IOSPiPIcon: React.FC<IOSIconProps> = (props) => makeSvg(
  <>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <rect x="12.5" y="11.5" width="6" height="5" rx="1" fill={props.color || 'currentColor'} fillOpacity={props.filled ? 0.15 : 0} />
    <rect x="12.5" y="11.5" width="6" height="5" rx="1" />
  </>,
  props
);

export const IOSShieldIcon: React.FC<IOSIconProps & { filled?: boolean }> = (props) => {
  const s = props.size || 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path
        d="M12 2.5L20 5.5V11.5C20 16.1 16.3 20.3 12 21.5C7.7 20.3 4 16.1 4 11.5V5.5L12 2.5Z"
        fill={props.filled ? '#34C759' : 'none'}
        fillOpacity={props.filled ? 1 : 0.08}
        stroke={props.filled ? '#34C759' : props.color || 'currentColor'}
        strokeWidth={props.strokeWidth || 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!props.filled && (
        <path d="M9 12L11 14L15 10" stroke={props.color || 'currentColor'} strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {props.filled && (
        <path d="M9 12L11 14L15 10" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
};

export const IOSAlertIcon: React.FC<IOSIconProps & { filled?: boolean }> = (props) => {
  const s = props.size || 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={`shrink-0 ${props.className || ''}`} style={{ flexShrink: 0, ...props.style }} aria-hidden="true">
      <path
        d="M12 3L22 20.5H2L12 3Z"
        fill={props.filled ? '#FF9500' : 'none'}
        fillOpacity={props.filled ? 1 : 0.08}
        stroke={props.filled ? '#FF9500' : props.color || 'currentColor'}
        strokeWidth={props.strokeWidth || 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 10V14.5M12 17.5H12.01" stroke={props.filled ? 'white' : props.color || 'currentColor'} strokeWidth={props.filled ? 2.2 : props.strokeWidth || 1.75} strokeLinecap="round" />
    </svg>
  );
};
