import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Info } from 'lucide-react';
import { getImageUrl, getStreamingUrl, getSeriesStreamingUrl } from '../services/movieService';
import { getYear, isNewRelease } from '../utils/helpers';
import { watchlistService, progressService } from '../services/storageService';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import type { Movie } from '../types/movie';

interface Props {
  movie: Movie;
  rank?: number;             // if provided, shows TOP N badge
  landscape?: boolean;     // 16:9 variant for "Continue Watching"
  showOverlay?: boolean;   // allow hiding the hover overlay (e.g., in search)
  size?: 'sm' | 'md' | 'lg'; // responsive size override
}

const MovieCard: React.FC<Props> = ({
  movie,
  rank,
  landscape = false,
  showOverlay = true,
  size = 'md',
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [inList, setInList] = useState(() => watchlistService.isInList(movie.id, movie.media_type === 'tv' ? 'tv' : 'movie'));

  const openPlayer = usePlayerStore((s) => s.openPlayer);
  const openDetails = useAppStore((s) => s.openDetails);
  const addToast = useAppStore((s) => s.addToast);

  const isSeries = movie.media_type === 'tv';
  useEffect(() => {
    const refresh = () => setInList(watchlistService.isInList(movie.id, isSeries ? 'tv' : 'movie'));
    window.addEventListener('kkm-storage', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('kkm-storage', refresh); window.removeEventListener('storage', refresh); };
  }, [movie.id, isSeries]);

  /* Width by size */
  const widthMap = { sm: 120, md: 160, lg: 200 };
  const widthLandscape = { sm: 200, md: 260, lg: 320 };
  const cardWidth = landscape ? widthLandscape[size] : widthMap[size];

  const imgSrc = landscape
    ? getImageUrl(movie.backdrop_path, 'w780')
    : getImageUrl(movie.poster_path, 'w500');

  /* Progress */
  const progressPercent = progressService.getPercentage(
    movie.id,
    movie.media_type === 'tv' ? (movie as Movie & { season?: number }).season : undefined,
    movie.media_type === 'tv' ? (movie as Movie & { episode?: number }).episode : undefined
  );

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSeries) {
      openPlayer({
        streamUrl: getSeriesStreamingUrl(movie.id, 1, 1),
        movieId: movie.id,
        movieTitle: movie.title || movie.name || '',
        posterPath: movie.poster_path || '',
        backdropPath: movie.backdrop_path || '',
        mediaType: 'tv',
        episodeInfo: { season: 1, episode: 1, name: 'Piloto', still_path: null },
      });
    } else {
      openPlayer({
        streamUrl: getStreamingUrl(movie.id, movie.imdb_id),
        movieId: movie.id,
        movieTitle: movie.title || '',
        posterPath: movie.poster_path || '',
        backdropPath: movie.backdrop_path || '',
        mediaType: 'movie',
        imdbId: movie.imdb_id,
      });
    }
  };

  const handleToggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = watchlistService.toggle({
      id: movie.id,
      type: isSeries ? 'tv' : 'movie',
      title: movie.title || movie.name || '',
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      voteAverage: movie.vote_average,
      releaseDate: movie.release_date,
    });
    setInList(added);
    addToast(
      added ? 'Adicionado à sua lista' : 'Removido da sua lista',
      added ? 'success' : 'info'
    );
  };

  const handleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDetails(movie.id, isSeries ? 'tv' : 'movie');
  };

  /* Ranked shelves use the large number; regular cards may show the release badge. */
  const badge = (() => {
    if (rank && rank <= 10) return null;
    if (isNewRelease(movie.release_date)) return <span className="badge badge-new">NOVO</span>;
    return null;
  })();

  return (
    <div className={`media-card relative flex-shrink-0 group ${landscape ? 'landscape' : ''}`}>
      {/* Rank number (large outline behind card for top-10 style) */}
      {rank && rank <= 10 && (
        <div
          className="home-ranking-number pointer-events-none select-none"
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
            }}
          >
            {rank}
          </span>
        </div>
      )}

      {/* Card */}
      <div
        className={`card-movie ${landscape ? 'card-landscape' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${movie.title || movie.name}`}
        onClick={handleDetails}
        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleDetails(e as unknown as React.MouseEvent); } }}
      >
        {/* Skeleton while loading */}
        {imgSrc && !imgLoaded && !imgError && <div className="skeleton absolute inset-0 rounded-none" />}

        {/* Poster image */}
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={movie.title || movie.name}
            loading="lazy"
            decoding="async"
            width={landscape ? 780 : 500}
            height={landscape ? 439 : 750}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`img-blur-load ${imgLoaded ? 'loaded' : ''}`}
          />
        ) : (
          <div className="poster-fallback">
            <Play className="w-8 h-8 opacity-40" />
            <span>{movie.title || movie.name}</span>
          </div>
        )}

        {/* Badge — top-left, one badge only */}
        {badge && (
          <div className="absolute top-2 left-2 z-10">
            {badge}
          </div>
        )}

        {/* Default bottom gradient + title on card */}
        <div className="card-gradient" />
        <div className="card-title">{movie.title || movie.name}</div>

        {/* Hover overlay (iOS Glassmorphism Refinement) */}
        {showOverlay && (
          <div className="card-overlay backdrop-blur-[2px]">
            {/* Play button — centered (Glass Action Style) */}
            <button
              className="card-play-btn glass-card hover:scale-105 active:scale-95 transition-transform"
              onClick={handlePlay}
              aria-label="Assistir"
            >
              <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
            </button>

            {/* Action row below play */}
            <div className="flex items-center gap-2">
              <button
                className="card-action-btn glass-card hover:border-[var(--accent-blue-border)] transition-colors"
                onClick={handleToggleList}
                aria-label={inList ? 'Remover da lista' : 'Adicionar à lista'}
              >
                {inList
                  ? <Check className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                  : <Plus className="w-3.5 h-3.5 text-white" />
                }
              </button>
              <button
                className="card-action-btn glass-card hover:border-[var(--accent-blue-border)] transition-colors"
                onClick={handleDetails}
                aria-label="Ver detalhes"
              >
                <Info className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Metadata row — fades in with delay */}
            <div className="card-meta justify-center">
              {movie.vote_average > 0 && (
                <span className="text-[var(--accent-gold)] flex items-center gap-0.5 font-medium text-[11px] drop-shadow-[0_0_6px_rgba(201,151,58,0.3)]">
                  ★ {movie.vote_average.toFixed(1)}
                </span>
              )}
              {movie.vote_average > 0 && getYear(movie.release_date || movie.first_air_date || '') && (
                <span className="text-[var(--text-hint)]">·</span>
              )}
              <span className="text-[var(--text-secondary)] text-[11px] font-medium">
                {getYear(movie.release_date || movie.first_air_date || '')}
              </span>
            </div>
          </div>
        )}

        {/* Progress bar — absolute bottom, no border-radius */}
        {progressPercent > 0 && progressPercent < 100 && (
          <div className="card-progress bg-[rgba(255,255,255,0.15)]">
            <div className="card-progress-fill bg-[var(--accent-blue)]" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
      <p className="poster-caption">{movie.title || movie.name}</p>
      <div className="poster-meta"><span>{isSeries ? 'Série' : 'Filme'}</span><span>{getYear(movie.release_date || movie.first_air_date || '')}</span></div>
    </div>
  );
};

export default React.memo(MovieCard);
