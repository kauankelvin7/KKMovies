import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VirtualizedCarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  itemCount: number;
  itemRenderer: (index: number) => React.ReactNode;
  visibleCount?: number; // Quantos itens mostrar por vez
  buffer?: number; // Quantos itens extra renderizar antes/depois
  className?: string;
}

/**
 * Carrossel virtualizado: só renderiza os itens visíveis + buffer
 */
const VirtualizedCarousel = ({
  title,
  subtitle,
  icon,
  itemCount,
  itemRenderer,
  visibleCount = 6,
  buffer = 2,
  className = '',
}: VirtualizedCarouselProps) => {
  const [startIdx, setStartIdx] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Calcula o range de itens a renderizar
  const endIdx = Math.min(itemCount, startIdx + visibleCount + buffer);
  const renderStart = Math.max(0, startIdx - buffer);

  // Scroll para esquerda/direita
  const scroll = (direction: 'left' | 'right') => {
    let newStart = startIdx + (direction === 'left' ? -visibleCount : visibleCount);
    newStart = Math.max(0, Math.min(itemCount - visibleCount, newStart));
    setStartIdx(newStart);
    // Scroll visual
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }
  };

  // Atualiza startIdx ao redimensionar tela
  useEffect(() => {
    const handleResize = () => {
      setStartIdx(0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`content-carousel relative group/carousel py-2 sm:py-3 md:py-4 ${className}`} data-app-element>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
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
      </div>
      {/* Slider Container */}
      <div className="relative carousel-container">
        <button
          onClick={() => scroll('left')}
          className="carousel-arrow carousel-arrow-left"
          aria-label="Anterior"
          disabled={startIdx === 0}
        >
          <div className="carousel-arrow-inner">
            <ChevronLeft size={24} strokeWidth={2.5} className="sm:w-8 sm:h-8" />
          </div>
        </button>
        <div
          ref={sliderRef}
          className="carousel-slider flex gap-2.5 sm:gap-3 md:gap-4 overflow-x-hidden pb-2 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
        >
          {Array.from({ length: endIdx - renderStart }, (_, i) => renderStart + i).map(idx => (
            <div key={idx} style={{ flex: '0 0 auto' }}>
              {itemRenderer(idx)}
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="carousel-arrow carousel-arrow-right"
          aria-label="Próximo"
          disabled={endIdx >= itemCount}
        >
          <div className="carousel-arrow-inner">
            <ChevronRight size={24} strokeWidth={2.5} className="sm:w-8 sm:h-8" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default VirtualizedCarousel;
