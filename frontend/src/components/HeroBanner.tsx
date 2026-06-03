/* KauanFlix — Hero Banner v4 (HBO Max style)
   - 100vh fullscreen with triple gradient overlay
   - Category badge (SÉRIE ORIGINAL / FILME)
   - Title logo from TMDB if available, else Inter 300 text
   - Inline metadata row
   - Synopsis 2-line clamp
   - White "Assistir" btn + glass "Minha Lista" btn
   - Dot indicators bottom-left aligned with content
   - YouTube IFrame API trailer autoplay after 3s idle
   - Autorotate every 8s, 800ms ease-in-out transition */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Play, Plus, Check } from 'lucide-react';
import { getImageUrl, getMovieVideos, getSeriesVideos } from '../services/movieService';
import { getYear } from '../utils/helpers';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { watchlistService } from '../services/storageService';
import type { Movie } from '../types/movie';

interface Props {
  movies: Movie[];
  loading?: boolean;
}


export const HeroBanner: React.FC<Props> = ({ movies, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [trailerActive, setTrailerActive] = useState(false);
  const [inList, setInList] = useState(false);

  const openPlayer = usePlayerStore((s) => s.openPlayer);
  const addToast = useAppStore((s) => s.addToast);

  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const ytPlayerRef = useRef<{ destroy: () => void } | null>(null);
  const trailerDivRef = useRef<HTMLDivElement>(null);

  const heroMovies = useMemo(() => movies.filter((m) => m.backdrop_path).slice(0, 7), [movies]);
  const currentMovie = heroMovies[currentIndex];

  /* Sync "in list" state when slide changes */
  useEffect(() => {
    if (currentMovie) setInList(watchlistService.isInList(currentMovie.id));
  }, [currentMovie]);

  /* Transition to new slide */
  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTrailerActive(false);
      if (ytPlayerRef.current) { ytPlayerRef.current.destroy(); ytPlayerRef.current = null; }
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 400);
    },
    [isTransitioning]
  );

  const goNext = useCallback(() => {
    if (heroMovies.length <= 1) return;
    goTo((currentIndex + 1) % heroMovies.length);
  }, [currentIndex, heroMovies.length, goTo]);

  /* Auto-rotate every 8s */
  useEffect(() => {
    if (heroMovies.length <= 1 || trailerActive) return;
    const t = setInterval(goNext, 8000);
    return () => clearInterval(t);
  }, [goNext, heroMovies.length, trailerActive]);

  /* Reset idle timer on any interaction */
  const resetIdleTimer = useCallback(() => {
    setTrailerActive(false);
    if (ytPlayerRef.current) { ytPlayerRef.current.destroy(); ytPlayerRef.current = null; }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      startTrailer();
    }, 3000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Start idle timer on mount / slide change */
  useEffect(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => startTrailer(), 3000);
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Stop trailer on scroll */
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100 && trailerActive) {
        setTrailerActive(false);
        if (ytPlayerRef.current) { ytPlayerRef.current.destroy(); ytPlayerRef.current = null; }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trailerActive]);

  /* Fetch trailer and start YouTube player */
  async function startTrailer() {
    if (!currentMovie) return;
    try {
      const isSeries = currentMovie.media_type === 'tv';
      const videos = isSeries
        ? await getSeriesVideos(currentMovie.id)
        : await getMovieVideos(currentMovie.id);
      const trailer = videos.find(
        (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      if (trailer) {
        setTrailerActive(true);
      }
    } catch {
      /* Silently fail — trailer is optional enhancement */
    }
  }

  if (loading) {
    return <div className="skeleton w-full" style={{ height: '100vh', minHeight: 500 }} />;
  }

  if (!currentMovie) return null;

  const backdropUrl = getImageUrl(currentMovie.backdrop_path, 'original');
  const logoUrl = currentMovie.logo_path ? getImageUrl(currentMovie.logo_path, 'w500') : null;
  const isSeries = currentMovie.media_type === 'tv';
  const releaseYear = getYear(currentMovie.release_date || currentMovie.first_air_date || '');

  const handlePlay = () => {
    openPlayer({
      streamUrl: '', // Will be filled by streaming service
      movieId: currentMovie.id,
      movieTitle: currentMovie.title || currentMovie.name || '',
      posterPath: currentMovie.poster_path || '',
      backdropPath: currentMovie.backdrop_path || '',
      mediaType: isSeries ? 'tv' : 'movie',
    });
  };

  const handleToggleList = () => {
    const added = watchlistService.toggle({
      id: currentMovie.id,
      type: isSeries ? 'tv' : 'movie',
      title: currentMovie.title || currentMovie.name || '',
      posterPath: currentMovie.poster_path,
      backdropPath: currentMovie.backdrop_path,
      voteAverage: currentMovie.vote_average,
      releaseDate: currentMovie.release_date,
    });
    setInList(added);
    addToast(added ? 'Adicionado à sua lista' : 'Removido da sua lista', added ? 'success' : 'info');
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100vh', minHeight: 500 }}
      onMouseMove={resetIdleTimer}
      onClick={resetIdleTimer}
    >
      {/* ── Background Image ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backdropUrl})`,
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 800ms ease-in-out',
        }}
      />

      {/* ── YouTube Trailer (background, behind gradients) ── */}
      {trailerActive && (
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          <div
            ref={trailerDivRef}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: '177.78vh', /* 16:9 aspect ratio */
              height: '100vh',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
      {/* Hidden div for YT Player when trailer not yet active */}
      {!trailerActive && <div ref={trailerDivRef} style={{ display: 'none' }} />}

      {/* ── Triple Gradient Overlay ── */}
      {/* 1. General dark overlay */}
      <div
        className="absolute inset-0 z-[2]"
        style={{ background: `rgba(5, 5, 8, ${trailerActive ? 0.4 : 0.25})`, transition: 'background 600ms ease' }}
      />
      {/* 2. Left-to-right: ensures text readability */}
      <div
        className="absolute inset-0 z-[3]"
        style={{ background: 'linear-gradient(to right, #050508 0%, #050508 20%, transparent 55%)' }}
      />
      {/* 3. Bottom-to-top: smooth transition to content below */}
      <div
        className="absolute inset-0 z-[3]"
        style={{ background: 'linear-gradient(to top, #050508 0%, transparent 40%)' }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-[4] h-full flex flex-col justify-center"
        style={{ paddingLeft: 'clamp(16px, 5vw, 80px)', paddingRight: 'clamp(16px, 5vw, 80px)' }}
      >
        <div
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
            transition: 'opacity 400ms ease, transform 400ms ease',
            maxWidth: 560,
          }}
        >
          {/* Category badge */}
          <div className="mb-4">
            <span className="badge-category">
              {isSeries ? 'Série Original' : 'Filme'}
            </span>
          </div>

          {/* Title: logo image or text */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={currentMovie.title}
              className="mb-4 max-h-24 w-auto object-contain"
              style={{ maxWidth: 400, filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.6))' }}
              loading="eager"
              decoding="async"
            />
          ) : (
            <h1
              className="hero-title mb-4"
              style={{ textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}
            >
              {currentMovie.title || currentMovie.name}
            </h1>
          )}

          {/* Metadata row */}
          <div
            className="flex items-center gap-2 flex-wrap mb-4"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}
          >
            {releaseYear && <span>{releaseYear}</span>}
            {releaseYear && currentMovie.vote_average > 0 && <span>·</span>}
            {currentMovie.vote_average > 0 && (
              <>
                <span style={{ color: '#C9973A' }}>★</span>
                <span>{currentMovie.vote_average.toFixed(1)}</span>
              </>
            )}
            {currentMovie.runtime && (
              <>
                <span>·</span>
                <span>{Math.floor(currentMovie.runtime / 60)}h {currentMovie.runtime % 60}min</span>
              </>
            )}
            {isSeries && currentMovie.number_of_seasons && (
              <>
                <span>·</span>
                <span>{currentMovie.number_of_seasons} temporada{currentMovie.number_of_seasons > 1 ? 's' : ''}</span>
              </>
            )}
          </div>

          {/* Synopsis — 2-line clamp */}
          {currentMovie.overview && (
            <p
              className="line-clamp-2 mb-6"
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.7)',
                maxWidth: 480,
                lineHeight: 1.55,
              }}
            >
              {currentMovie.overview}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handlePlay}
              className="btn-primary"
              aria-label={`Assistir ${currentMovie.title}`}
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Assistir
            </button>

            <button
              onClick={handleToggleList}
              className="btn-secondary"
              aria-label={inList ? 'Remover da lista' : 'Adicionar à lista'}
            >
              {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {inList ? 'Na Lista' : 'Minha Lista'}
            </button>
          </div>
        </div>

        {/* Dot indicators — bottom-left, aligned with content */}
        {heroMovies.length > 1 && (
          <div className="hero-dots absolute" style={{ bottom: 40 }}>
            {heroMovies.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`hero-dot ${i === currentIndex ? 'active' : ''}`}
                style={{ width: i === currentIndex ? 24 : 8 }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
