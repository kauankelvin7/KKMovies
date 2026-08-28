import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';
import { SkeletonRow } from './ui/Skeleton';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import type { Movie } from '../types/movie';

interface Props {
  title: string;
  movies: Movie[];
  loading?: boolean;
  landscape?: boolean;
  ranked?: boolean;
  viewAllLink?: string;       // Optional "Ver tudo" link
  icon?: React.ReactNode;     // Optional icon (kept for compat, not rendered prominently)
  progressMap?: Map<number, { progress: number }>; // legacy compat
}

export const ContentCarousel: React.FC<Props> = ({
  title,
  movies,
  loading,
  landscape,
  ranked,
  viewAllLink,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [totalSegments, setTotalSegments] = useState(1);
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const cardWidth = landscape ? 270 : 168; // includes gap
  const gap = 8;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const left = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(left > 10);
    setCanScrollRight(left < maxScroll - 10);

    // Update position indicators
    const visibleWidth = el.clientWidth;
    const segments = Math.ceil(el.scrollWidth / visibleWidth);
    setTotalSegments(Math.max(1, segments));
    setCurrentSegment(Math.round((left / maxScroll) * (segments - 1)) || 0);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll, movies]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = (cardWidth + gap) * 3;
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  if (!loading && movies.length === 0) return null;

  return (
    <div
      ref={sectionRef as React.RefObject<HTMLDivElement>}
      className={`fade-in-section group ${isVisible ? 'visible' : ''}`}
    >
      <div className="section-container">
        
        {/* Section Header (Glass Typography & Interactions) */}
        <div className="flex flex-col mb-3">
          <div className="flex items-end justify-between group/header cursor-pointer">
            <h2 className="text-[17px] md:text-[20px] font-normal tracking-wide text-[var(--text-primary)] m-0">
              {title}
            </h2>
            
            {viewAllLink && (
              <Link 
                to={viewAllLink} 
                className="text-[13px] font-medium text-[var(--accent-blue)] opacity-0 md:group-hover/header:opacity-100 transition-opacity duration-300 hover:text-white flex items-center gap-1"
              >
                Ver tudo <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Position Indicators (HBO Max style) */}
          {totalSegments > 1 && (
            <div className="flex gap-1 mt-1.5 w-[60px] opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              {Array.from({ length: Math.min(totalSegments, 5) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${
                    i === currentSegment 
                      ? 'bg-[var(--accent-blue)]' 
                      : 'bg-[rgba(255,255,255,0.15)]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative carousel-container section-container">
        {loading ? (
          <SkeletonRow count={7} landscape={landscape} />
        ) : (
          <>
            <div ref={scrollRef} className="carousel-scroll">
              {movies.map((movie, i) => (
                <MovieCard
                  key={`${movie.media_type ?? 'movie'}-${movie.id}`}
                  movie={movie}
                  rank={ranked ? i + 1 : undefined}
                  landscape={landscape}
                />
              ))}
            </div>

            {/* Nav Arrows (Hidden on mobile, Glassmorphism on Desktop) */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="carousel-arrow carousel-arrow-left hidden md:flex glass-icon-btn shadow-2xl !w-11 !h-11 bg-[var(--surface-0)]/90 border border-[var(--glass-separator)] hover:scale-110"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft className="w-6 h-6 text-white ml-0.5" />
              </button>
            )}
            
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="carousel-arrow carousel-arrow-right hidden md:flex glass-icon-btn shadow-2xl !w-11 !h-11 bg-[var(--surface-0)]/90 border border-[var(--glass-separator)] hover:scale-110"
                aria-label="Rolar para direita"
              >
                <ChevronRight className="w-6 h-6 text-white mr-0.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};