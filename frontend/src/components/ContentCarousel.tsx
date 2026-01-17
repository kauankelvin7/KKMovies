import { useRef, useCallback, ReactNode } from 'react';
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
 * Carrossel de conteúdo estilo Netflix com setas melhoradas
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

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div className={`content-carousel relative group/carousel py-6 ${className}`} data-app-element>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-4 md:px-12 relative z-10">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 text-primary-400">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        
        {showViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors group/btn"
          >
            <span>Ver Todos</span>
            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Slider Container */}
      <div className="relative">
        {/* Arrow Left - Design Netflix */}
        <button
          onClick={() => scroll('left')}
          className="carousel-arrow carousel-arrow-left"
          aria-label="Anterior"
        >
          <div className="carousel-arrow-inner">
            <ChevronLeft size={32} strokeWidth={2.5} />
          </div>
        </button>

        {/* Content Slider */}
        <div
          ref={sliderRef}
          className="carousel-slider flex gap-4 md:gap-5 overflow-x-auto pb-4 px-4 md:px-12 scroll-smooth"
        >
          {children}
        </div>

        {/* Arrow Right - Design Netflix */}
        <button
          onClick={() => scroll('right')}
          className="carousel-arrow carousel-arrow-right"
          aria-label="Próximo"
        >
          <div className="carousel-arrow-inner">
            <ChevronRight size={32} strokeWidth={2.5} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ContentCarousel;
