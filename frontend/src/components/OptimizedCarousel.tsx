import { useRef, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface OptimizedCarouselProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  className?: string;
}

/**
 * Carrossel otimizado com paginação infinita
 * Core Web Vitals otimizado (CLS < 0.1)
 */
const OptimizedCarousel = memo(({
  title,
  subtitle,
  children,
  onLoadMore,
  isLoading = false,
  hasMore = true,
  className = '',
}: OptimizedCarouselProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number>();

  /**
   * Scroll suave otimizado
   */
  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!sliderRef.current) return;

    const container = sliderRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    // Usa requestAnimationFrame para performance
    requestAnimationFrame(() => {
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    });
  }, []);

  /**
   * Detecta fim do scroll para carregar mais
   */
  const handleScroll = useCallback(() => {
    if (!sliderRef.current || !onLoadMore || !hasMore || isLoading) return;

    // Debounce
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const container = sliderRef.current!;
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      // Carrega mais quando chegar a 80% do scroll
      if (scrollLeft + clientWidth >= scrollWidth * 0.8) {
        onLoadMore();
      }
    }, 150);
  }, [onLoadMore, hasMore, isLoading]);

  return (
    <div className={`py-3 md:py-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4 px-4 sm:px-6 md:px-8">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative group">
        {/* Arrow Left */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center hover:from-black/95"
          aria-label="Anterior"
        >
          <ChevronLeft size={32} className="text-white" />
        </button>

        {/* Content Slider */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto overflow-y-hidden pb-2 px-4 sm:px-6 md:px-8 scroll-smooth scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center min-w-[200px]">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Arrow Right */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center hover:from-black/95"
          aria-label="Próximo"
        >
          <ChevronRight size={32} className="text-white" />
        </button>
      </div>

      {/* CSS inline para esconder scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
});

OptimizedCarousel.displayName = 'OptimizedCarousel';

export default OptimizedCarousel;
