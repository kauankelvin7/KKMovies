import { memo } from 'react';

/**
 * Skeleton Screens para estados de loading
 * Previne CLS e melhora UX
 */

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'rectangle';
  width?: string;
  height?: string;
  count?: number;
}

export const Skeleton = memo(({ 
  className = '', 
  variant = 'rectangle',
  width,
  height,
  count = 1 
}: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]';
  
  const variantClasses = {
    card: 'aspect-[2/3] rounded-xl',
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded-lg',
  };

  const skeletonClass = `${baseClasses} ${variantClasses[variant]} ${className}`;
  const style = { width, height };

  if (count === 1) {
    return <div className={skeletonClass} style={style} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={style} />
      ))}
    </>
  );
});

Skeleton.displayName = 'Skeleton';

/**
 * Skeleton para Media Card
 */
export const MediaCardSkeleton = memo(() => (
  <div className="w-[155px] sm:w-[170px] md:w-[185px] lg:w-[200px] flex-shrink-0">
    <Skeleton variant="card" className="mb-2" />
    <Skeleton variant="text" className="w-3/4 mb-1" />
    <Skeleton variant="text" className="w-1/2" />
  </div>
));

MediaCardSkeleton.displayName = 'MediaCardSkeleton';

/**
 * Skeleton para Carrossel
 */
export const CarouselSkeleton = memo(({ itemCount = 6 }: { itemCount?: number }) => (
  <div className="py-3 md:py-4">
    {/* Header */}
    <div className="mb-3 md:mb-4 px-4 sm:px-6 md:px-8">
      <Skeleton variant="text" className="w-48 h-8 mb-2" />
      <Skeleton variant="text" className="w-32 h-4" />
    </div>

    {/* Cards */}
    <div className="flex gap-3 md:gap-4 px-4 sm:px-6 md:px-8 overflow-hidden">
      {Array.from({ length: itemCount }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  </div>
));

CarouselSkeleton.displayName = 'CarouselSkeleton';

/**
 * Skeleton para Hero Banner
 */
export const HeroBannerSkeleton = memo(() => (
  <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden">
    <Skeleton variant="rectangle" className="absolute inset-0" />
    
    {/* Content overlay skeleton */}
    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
      <Skeleton variant="text" className="w-96 h-12 mb-4" />
      <Skeleton variant="text" className="w-64 h-6 mb-2" />
      <Skeleton variant="text" className="w-full max-w-2xl h-20 mb-6" />
      
      <div className="flex gap-4">
        <Skeleton variant="rectangle" className="w-32 h-12" />
        <Skeleton variant="rectangle" className="w-32 h-12" />
      </div>
    </div>
  </div>
));

HeroBannerSkeleton.displayName = 'HeroBannerSkeleton';

/**
 * Skeleton para Grid de filmes
 */
export const MovieGridSkeleton = memo(({ columns = 5, rows = 3 }: { columns?: number; rows?: number }) => {
  const itemCount = columns * rows;
  
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-${columns} gap-4 p-4`}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i}>
          <Skeleton variant="card" className="mb-2" />
          <Skeleton variant="text" className="w-3/4 mb-1" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      ))}
    </div>
  );
});

MovieGridSkeleton.displayName = 'MovieGridSkeleton';

/**
 * Skeleton para Player
 */
export const PlayerSkeleton = memo(() => (
  <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
    <Skeleton variant="rectangle" className="absolute inset-0" />
    
    {/* Play button skeleton */}
    <div className="absolute inset-0 flex items-center justify-center">
      <Skeleton variant="circle" className="w-20 h-20" />
    </div>
    
    {/* Controls skeleton */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80">
      <Skeleton variant="rectangle" className="w-full h-2 mb-3" />
      <div className="flex justify-between">
        <Skeleton variant="rectangle" className="w-24 h-8" />
        <Skeleton variant="rectangle" className="w-24 h-8" />
      </div>
    </div>
  </div>
));

PlayerSkeleton.displayName = 'PlayerSkeleton';

/**
 * CSS Animations
 */
export const skeletonStyles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-pulse {
  animation: shimmer 2s infinite linear;
}
`;

export default Skeleton;
