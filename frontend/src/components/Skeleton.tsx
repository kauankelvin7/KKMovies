import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'rectangle' | 'poster' | 'landscape' | 'button' | 'chip';
  width?: string | number;
  height?: string | number;
  count?: number;
  gap?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const radiusMap = {
  none: 'rounded-none',
  sm: 'rounded-[6px]',
  md: 'rounded-[10px]',
  lg: 'rounded-[14px]',
  xl: 'rounded-[18px]',
  full: 'rounded-full',
};

export const Skeleton = memo(({
  className = '',
  variant = 'rectangle',
  width,
  height,
  count = 1,
  gap = '4px',
  rounded,
}: SkeletonProps) => {
  const variantDefaults = {
    card: { r: 'lg' as const, h: '100%', classes: 'aspect-[2/3]' },
    text: { r: 'sm' as const, h: '16px', classes: '' },
    circle: { r: 'full' as const, h: '40px', classes: 'aspect-square' },
    rectangle: { r: 'md' as const, h: '100%', classes: '' },
    poster: { r: 'lg' as const, h: '100%', classes: 'aspect-[2/3]' },
    landscape: { r: 'lg' as const, h: '100%', classes: 'aspect-[16/9]' },
    button: { r: 'md' as const, h: '44px', classes: 'min-w-[120px]' },
    chip: { r: 'full' as const, h: '28px', classes: 'min-w-[80px]' },
  };

  const def = variantDefaults[variant];
  const radiusClass = rounded ? radiusMap[rounded] : radiusMap[def.r];

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height ?? def.h,
  };

  if (count === 1) {
    return (
      <div
        className={`ios-skeleton ${radiusClass} ${def.classes} ${className}`}
        style={style}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="flex flex-col" style={{ gap }} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`ios-skeleton ${radiusClass} ${def.classes} ${className}`}
          style={style}
        />
      ))}
    </div>
  );
});

Skeleton.displayName = 'Skeleton';

export const MediaCardSkeleton = memo(() => (
  <div className="w-[155px] sm:w-[170px] md:w-[185px] lg:w-[200px] flex-shrink-0">
    <Skeleton variant="poster" className="mb-2" />
    <div className="space-y-1.5 px-1">
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2 h-3" />
    </div>
  </div>
));

MediaCardSkeleton.displayName = 'MediaCardSkeleton';

export const LandscapeCardSkeleton = memo(() => (
  <div className="w-[260px] sm:w-[280px] md:w-[320px] flex-shrink-0">
    <Skeleton variant="landscape" className="mb-2" />
    <div className="space-y-1.5 px-1">
      <Skeleton variant="text" className="w-2/3" />
      <Skeleton variant="text" className="w-1/3 h-3" />
    </div>
  </div>
));

LandscapeCardSkeleton.displayName = 'LandscapeCardSkeleton';

export const CarouselSkeleton = memo(({ itemCount = 6, landscape = false }: { itemCount?: number; landscape?: boolean }) => (
  <div className="py-3 md:py-4 animate-fade-in">
    <div className="mb-3 md:mb-4 px-4 sm:px-6 md:px-8">
      <Skeleton variant="text" className="w-48 h-7 mb-2" rounded="sm" />
      <Skeleton variant="text" className="w-32 h-4" rounded="sm" />
    </div>

    <div className="flex gap-3 md:gap-4 px-4 sm:px-6 md:px-8 overflow-hidden">
      {Array.from({ length: itemCount }).map((_, i) => (
        landscape ? <LandscapeCardSkeleton key={i} /> : <MediaCardSkeleton key={i} />
      ))}
    </div>
  </div>
));

CarouselSkeleton.displayName = 'CarouselSkeleton';

export const HeroBannerSkeleton = memo(() => (
  <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden">
    <div className="absolute inset-0 ios-skeleton rounded-none" />

    <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/20 to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/40 to-transparent pointer-events-none" />

    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-16 max-w-[700px]">
      <div className="space-y-4 md:space-y-5">
        <div className="flex gap-2 mb-2">
          <Skeleton variant="chip" width={100} height={26} />
          <Skeleton variant="chip" width={80} height={26} />
        </div>
        <Skeleton variant="text" className="w-full max-w-[520px] h-12 md:h-16 lg:h-20" rounded="md" />
        <Skeleton variant="text" className="w-2/3 h-5 md:h-6" rounded="sm" />
        <div className="space-y-2 pt-1">
          <Skeleton variant="text" className="w-full h-4" rounded="sm" />
          <Skeleton variant="text" className="w-11/12 h-4" rounded="sm" />
          <Skeleton variant="text" className="w-4/5 h-4" rounded="sm" />
        </div>

        <div className="flex gap-3 md:gap-4 pt-4 md:pt-6">
          <Skeleton variant="button" width={140} height={46} rounded="md" />
          <Skeleton variant="button" width={140} height={46} rounded="md" />
        </div>
      </div>
    </div>

    <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 lg:bottom-16 lg:right-16 flex items-end gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="ios-skeleton h-1.5 rounded-full transition-all"
          style={{
            width: i === 0 ? '28px' : '8px',
            opacity: i === 0 ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  </div>
));

HeroBannerSkeleton.displayName = 'HeroBannerSkeleton';

export const MovieGridSkeleton = memo(({ columns = 5, rows = 3 }: { columns?: number; rows?: number }) => {
  const itemCount = columns * rows;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-${columns} gap-3 sm:gap-4 p-4 sm:p-6`}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
});

MovieGridSkeleton.displayName = 'MovieGridSkeleton';

export const PlayerSkeleton = memo(() => (
  <div className="relative aspect-video w-full bg-black rounded-ios-lg overflow-hidden">
    <div className="absolute inset-0 ios-skeleton rounded-none" />

    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <div className="ios-skeleton w-20 h-20 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-black/20 animate-pulse" />
        </div>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent space-y-3">
      <div className="space-y-2">
        <div className="ios-skeleton w-full h-1.5 rounded-full" />
        <div className="flex justify-between">
          <Skeleton variant="text" width={80} height={14} />
          <Skeleton variant="text" width={80} height={14} />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ios-skeleton w-9 h-9 rounded-full" />
          ))}
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ios-skeleton w-9 h-9 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
));

PlayerSkeleton.displayName = 'PlayerSkeleton';

export const DetailsSkeleton = memo(() => (
  <div className="pb-8 md:pb-12">
    <div className="relative h-[55vh] md:h-[70vh] w-full overflow-hidden">
      <div className="absolute inset-0 ios-skeleton rounded-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/60 via-transparent to-transparent" />
    </div>

    <div className="relative -mt-32 md:-mt-48 px-4 sm:px-6 md:px-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <Skeleton variant="poster" width={160} height={240} className="shadow-glass-lg md:w-[200px] md:h-[300px]" rounded="lg" />
        </div>

        <div className="flex-1 min-w-0 pt-2 md:pt-16 space-y-4">
          <Skeleton variant="text" className="w-full md:w-3/4 h-10 md:h-12" />
          <div className="flex flex-wrap gap-3 items-center">
            <Skeleton variant="chip" width={90} />
            <Skeleton variant="text" width={60} />
            <Skeleton variant="chip" width={70} />
            <Skeleton variant="text" width={80} />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton variant="button" width={160} height={46} />
            <Skeleton variant="button" width={160} height={46} />
            <div className="ios-skeleton w-11 h-11 rounded-full" />
            <div className="ios-skeleton w-11 h-11 rounded-full" />
          </div>

          <div className="pt-4 space-y-3">
            <Skeleton variant="text" className="w-24 h-5 font-semibold" />
            <div className="space-y-2">
              <Skeleton variant="text" className="w-full h-4" />
              <Skeleton variant="text" className="w-full h-4" />
              <Skeleton variant="text" className="w-5/6 h-4" />
              <Skeleton variant="text" className="w-2/3 h-4" />
            </div>
          </div>

          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton variant="text" className="w-16 h-3 opacity-60" />
                <Skeleton variant="text" className="w-24 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <CarouselSkeleton itemCount={5} />
        <CarouselSkeleton itemCount={5} />
      </div>
    </div>
  </div>
));

DetailsSkeleton.displayName = 'DetailsSkeleton';

export const SearchResultsSkeleton = memo(() => (
  <div className="px-4 sm:px-6 md:px-8 py-6 space-y-4">
    <div className="flex gap-2 flex-wrap pb-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="chip" width={100 + i * 20} />
      ))}
    </div>
    <MovieGridSkeleton columns={5} rows={3} />
  </div>
));

SearchResultsSkeleton.displayName = 'SearchResultsSkeleton';

export const BottomNavSkeleton = memo(() => (
  <div className="h-[64px] md:hidden w-full flex items-center justify-around px-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex flex-col items-center gap-1 px-3 py-1">
        <div className="ios-skeleton w-6 h-6 rounded-full" />
        <Skeleton variant="text" width={42 + i * 4} height={10} />
      </div>
    ))}
  </div>
));

BottomNavSkeleton.displayName = 'BottomNavSkeleton';

export const skeletonStyles = `
.ios-skeleton {
  position: relative;
  overflow: hidden;
  background: var(--skeleton-bg, linear-gradient(
    135deg,
    var(--surface-2, #141420) 0%,
    var(--surface-1, #0D0D14) 100%
  ));
  isolation: isolate;
}

.ios-skeleton::after {
  content: '';
  position: absolute;
  inset: -150%;
  background: var(--skeleton-shimmer, linear-gradient(
    110deg,
    transparent 35%,
    rgba(255, 255, 255, 0.045) 48%,
    rgba(255, 255, 255, 0.09) 50%,
    rgba(255, 255, 255, 0.045) 52%,
    transparent 65%
  ));
  background-size: 40% 100%;
  background-repeat: no-repeat;
  transform: translateX(-60%);
  animation: ios-shimmer var(--skeleton-duration, 2.2s) var(--skeleton-ease, cubic-bezier(0.4, 0, 0.2, 1)) infinite;
  z-index: 1;
}

:root.light .ios-skeleton {
  background: linear-gradient(
    135deg,
    #F2F2F7 0%,
    #E5E5EA 100%
  );
}

:root.light .ios-skeleton::after {
  background: linear-gradient(
    110deg,
    transparent 35%,
    rgba(255, 255, 255, 0.5) 48%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(255, 255, 255, 0.5) 52%,
    transparent 65%
  );
}

@media (prefers-color-scheme: light) {
  :root:not(.dark) .ios-skeleton {
    background: linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%);
  }
  :root:not(.dark) .ios-skeleton::after {
    background: linear-gradient(
      110deg,
      transparent 35%,
      rgba(255, 255, 255, 0.5) 48%,
      rgba(255, 255, 255, 0.85) 50%,
      rgba(255, 255, 255, 0.5) 52%,
      transparent 65%
    );
  }
}

@keyframes ios-shimmer {
  0% {
    transform: translateX(-60%);
  }
  100% {
    transform: translateX(60%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ios-skeleton::after {
    animation-duration: 0.01ms !important;
  }
}
`;

export default Skeleton;
