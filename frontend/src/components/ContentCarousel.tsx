/* KauanFlix — Content Carousel v4 (HBO Max style)
   - Section title: Inter 400 (not bold)
   - "Ver tudo →" appears on hover of the section header
   - Cards: gap 8px, padding 80px desktop / 40px tablet / 16px mobile
   - Nav arrows: appear only on hover, 44px circles, rgba(13,13,20,0.9)
   - Position indicators: thin 2px segmented line under title
   - Lazy loads cards when section enters viewport (IntersectionObserver) */

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
      className={`fade-in-section carousel-wrapper ${isVisible ? 'visible' : ''}`}
    >
      <div
        className="section-container"
        style={{ paddingLeft: 'var(--section-padding)', paddingRight: 'var(--section-padding)' }}
      >
        {/* Section header */}
        <div className="section-header carousel-wrapper">
          <div>
            <h2 className="section-title">{title}</h2>
            {/* Position indicators */}
            {totalSegments > 1 && (
              <div className="carousel-indicators" style={{ maxWidth: 80 }}>
                {Array.from({ length: Math.min(totalSegments, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className={`carousel-indicator-seg ${i === currentSegment ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
          {viewAllLink && (
            <Link to={viewAllLink} className="ver-tudo flex items-center gap-1">
              Ver tudo →
            </Link>
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="carousel-container section-container">
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

            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="carousel-arrow carousel-arrow-left"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="carousel-arrow carousel-arrow-right"
                aria-label="Rolar para direita"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
