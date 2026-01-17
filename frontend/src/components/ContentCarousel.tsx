import { useRef, useCallback, useState, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContentCarouselProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  showViewAll?: boolean;
  onViewAll?: () => void;
  className?: string;
}

/**
 * Carrossel de conteúdo estilo Netflix com setas melhoradas e responsividade
 */
const ContentCarousel = ({
  title,
  subtitle,
  icon,
  children,
  showViewAll = false,
  onViewAll,
  className = '',
}: ContentCarouselProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      // Scroll 80% of visible width on desktop, 60% on mobile for smoother experience
      const isMobile = window.innerWidth < 768;
      const scrollAmount = container.clientWidth * (isMobile ? 0.6 : 0.8);
      
      // Add blur effect during scroll
      setIsScrolling(true);
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      
      // Remove blur effect after animation
      setTimeout(() => {
        setIsScrolling(false);
      }, 400);
    }
  }, []);

  return (
    <div className={`content-carousel relative group/carousel py-4 sm:py-6 ${className}`} data-app-element>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-5 px-3 sm:px-4 md:px-12 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          {icon && (
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 text-primary-400">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>
        
        {showViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-primary-400 hover:text-primary-300 transition-colors group/btn"
          >
            <span>Ver Todos</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Slider Container */}
      <div className="relative carousel-container">
        {/* Blur overlays for smooth edge effect */}
        <div className={`carousel-blur-overlay carousel-blur-left ${isScrolling ? 'opacity-100' : ''}`} />
        <div className={`carousel-blur-overlay carousel-blur-right ${isScrolling ? 'opacity-100' : ''}`} />
        
        {/* Arrow Left - Design Netflix (hidden on touch devices via CSS) */}
        <button
          onClick={() => scroll('left')}
          className="carousel-arrow carousel-arrow-left"
          aria-label="Anterior"
        >
          <div className="carousel-arrow-inner">
            <ChevronLeft size={24} strokeWidth={2.5} className="sm:w-8 sm:h-8" />
          </div>
        </button>

        {/* Content Slider */}
        <div
          ref={sliderRef}
          className={`carousel-slider flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 overflow-x-auto pb-4 px-3 sm:px-4 md:px-12 scroll-smooth transition-all duration-300 ${isScrolling ? 'is-scrolling' : ''}`}
        >
          {children}
        </div>

        {/* Arrow Right - Design Netflix (hidden on touch devices via CSS) */}
        <button
          onClick={() => scroll('right')}
          className="carousel-arrow carousel-arrow-right"
          aria-label="Próximo"
        >
          <div className="carousel-arrow-inner">
            <ChevronRight size={24} strokeWidth={2.5} className="sm:w-8 sm:h-8" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ContentCarousel;
