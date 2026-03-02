/* KauanFlix — Content Carousel */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { SkeletonRow } from './ui/Skeleton';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import type { Movie, WatchProgress } from '../types/movie';

interface Props {
  title: string;
  icon?: React.ReactNode;
  movies: Movie[];
  loading?: boolean;
  landscape?: boolean;
  ranked?: boolean;
  progressMap?: Map<number, WatchProgress>;
}

export const ContentCarousel: React.FC<Props> = ({
  title,
  icon,
  movies,
  loading,
  landscape,
  ranked,
  progressMap,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [sectionRef, isVisible] = useIntersectionObserver();

  const combinedRef = (el: HTMLDivElement | null) => {
    (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
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
    const cardWidth = landscape ? 292 : 192;
    const scrollAmount = cardWidth * 3;
    el.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
  };

  if (!loading && movies.length === 0) return null;

  return (
    <div ref={combinedRef} className={`fade-in-section mb-8 md:mb-10 ${isVisible ? 'visible' : ''}`}>
      <div className="section-container">
        <h2 className="section-title flex items-center gap-2">
          {icon}
          {title}
        </h2>
      </div>

      <div className="carousel-container section-container">
        {loading ? (
          <SkeletonRow count={7} landscape={landscape} />
        ) : (
          <>
            <div ref={scrollRef} className="carousel-scroll">
              {movies.map((movie, i) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  rank={ranked ? i + 1 : undefined}
                  landscape={landscape}
                  progress={progressMap?.get(movie.id)}
                />
              ))}
            </div>

            {canScrollLeft && (
              <button onClick={() => scroll('left')} className="carousel-arrow carousel-arrow-left" aria-label="Anterior">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {canScrollRight && (
              <button onClick={() => scroll('right')} className="carousel-arrow carousel-arrow-right" aria-label="Próximo">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
