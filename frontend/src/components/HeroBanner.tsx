/* KauanFlix — Hero Banner with auto-rotate */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, getStreamingUrl } from '../services/movieService';
import { getYear, truncateText } from '../utils/helpers';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Movie } from '../types/movie';

interface Props {
  movies: Movie[];
  loading?: boolean;
}

export const HeroBanner: React.FC<Props> = ({ movies, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const openPlayer = usePlayerStore((s) => s.openPlayer);

  const heroMovies = useMemo(() => {
    return movies.filter((m) => m.backdrop_path).slice(0, 7);
  }, [movies]);

  const currentMovie = heroMovies[currentIndex];

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  const goNext = useCallback(() => {
    if (heroMovies.length <= 1) return;
    goTo((currentIndex + 1) % heroMovies.length);
  }, [currentIndex, heroMovies.length, goTo]);

  const goPrev = useCallback(() => {
    if (heroMovies.length <= 1) return;
    goTo((currentIndex - 1 + heroMovies.length) % heroMovies.length);
  }, [currentIndex, heroMovies.length, goTo]);

  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const timer = setInterval(goNext, 8000);
    return () => clearInterval(timer);
  }, [goNext, heroMovies.length]);

  if (loading) {
    return <div className="skeleton w-full" style={{ height: '75vh', minHeight: 450 }} />;
  }

  if (!currentMovie) return null;

  const backdropUrl = getImageUrl(currentMovie.backdrop_path, 'original');

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '75vh', minHeight: 450 }}>
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />

      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(8,8,15,0.92) 0%, rgba(8,8,15,0.4) 50%, rgba(8,8,15,0.1) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #08080F 0%, transparent 40%)' }} />

      <div className="relative h-full section-container flex flex-col justify-end pb-16 md:pb-20 max-w-3xl">
        <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <h1 className="hero-title text-white mb-3 drop-shadow-2xl">
            {currentMovie.title}
          </h1>

          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="flex items-center gap-1 text-kf-yellow font-semibold">
              ★ {currentMovie.vote_average.toFixed(1)}
            </span>
            <span className="text-kf-text-secondary">{getYear(currentMovie.release_date)}</span>
          </div>

          <p className="body-text mb-6 max-w-xl leading-relaxed">
            {truncateText(currentMovie.overview || '', 200)}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() =>
                openPlayer({
                  streamUrl: getStreamingUrl(currentMovie.id, currentMovie.imdb_id),
                  movieId: currentMovie.id,
                  movieTitle: currentMovie.title,
                  posterPath: currentMovie.poster_path || '',
                })
              }
              className="btn-primary text-base"
              aria-label={`Assistir ${currentMovie.title}`}
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Assistir
            </button>
            <button
              onClick={() => navigate(`/filme/${currentMovie.id}`)}
              className="btn-secondary text-base"
              aria-label={`Mais informações sobre ${currentMovie.title}`}
            >
              <Info className="w-5 h-5" />
              Mais Infos
            </button>
          </div>
        </div>
      </div>

      {heroMovies.length > 1 && (
        <>
          <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 btn-icon opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity" aria-label="Anterior">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 btn-icon opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity" aria-label="Próximo">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {heroMovies.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-8 bg-kf-accent' : 'w-3 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};







