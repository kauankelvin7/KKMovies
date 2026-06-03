/* KauanFlix — Movie Card v4 (HBO Max style)
   - 2:3 ratio poster card
   - Default: poster only + base gradient + title below gradient
   - Badge: one per card, priority: TOP10 > NOVO (no genre badges)
   - Hover: scale(1.06) translateY(-4px), dark overlay, circular play btn (48px),
     + and ℹ action buttons (32px), metadata row fades in
   - Progress bar: 3px, accent blue, at absolute bottom of poster
   - React.memo to prevent unnecessary re-renders */

import React, { useState } from 'react';
import { Play, Plus, Check, Info } from 'lucide-react';
import { getImageUrl, getStreamingUrl, getSeriesStreamingUrl } from '../services/movieService';
import { getYear, isNewRelease } from '../utils/helpers';
import { watchlistService, progressService } from '../services/storageService';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import type { Movie } from '../types/movie';

interface Props {
  movie: Movie;
  rank?: number;           // if provided, shows TOP N badge
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
  const [inList, setInList] = useState(() => watchlistService.isInList(movie.id));

  const openPlayer = usePlayerStore((s) => s.openPlayer);
  const openDetails = useAppStore((s) => s.openDetails);
  const addToast = useAppStore((s) => s.addToast);

  const isSeries = movie.media_type === 'tv';

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

  /* Priority badge: TOP10 > NOVO */
  const badge = (() => {
    if (rank && rank <= 10) return <span className="badge badge-top10">TOP {rank}</span>;
    if (isNewRelease(movie.release_date)) return <span className="badge badge-new">NOVO</span>;
    return null;
  })();

  return (
    <div className="relative flex-shrink-0 group" style={{ width: cardWidth }}>
      {/* Rank number (large outline behind card for top-10 style) */}
      {rank && rank <= 10 && (
        <div
          className="absolute -left-5 bottom-12 z-10 pointer-events-none select-none"
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 90,
              lineHeight: 1,
              color: 'transparent',
              WebkitTextStroke: '1.5px rgba(74,144,217,0.4)',
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
        onKeyDown={(e) => e.key === 'Enter' && handleDetails(e as unknown as React.MouseEvent)}
      >
        {/* Skeleton while loading */}
        {!imgLoaded && !imgError && <div className="skeleton absolute inset-0 rounded-none" />}

        {/* Poster image */}
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={movie.title || movie.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`img-blur-load ${imgLoaded ? 'loaded' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-1">
            <Play className="w-8 h-8 opacity-30" />
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

        {/* Hover overlay */}
        {showOverlay && (
          <div className="card-overlay">
            {/* Play button — centered */}
            <button
              className="card-play-btn"
              onClick={handlePlay}
              aria-label="Assistir"
            >
              <Play className="w-5 h-5" fill="currentColor" />
            </button>

            {/* Action row below play */}
            <div className="flex items-center gap-2">
              <button
                className="card-action-btn"
                onClick={handleToggleList}
                aria-label={inList ? 'Remover da lista' : 'Adicionar à lista'}
              >
                {inList
                  ? <Check className="w-3.5 h-3.5 text-accent-blue" style={{ color: '#4A90D9' }} />
                  : <Plus className="w-3.5 h-3.5" />
                }
              </button>
              <button
                className="card-action-btn"
                onClick={handleDetails}
                aria-label="Ver detalhes"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metadata row — fades in with delay */}
            <div className="card-meta justify-center">
              {movie.vote_average > 0 && (
                <span style={{ color: '#C9973A', fontSize: 11 }}>★ {movie.vote_average.toFixed(1)}</span>
              )}
              {movie.vote_average > 0 && getYear(movie.release_date) && <span style={{ color: 'rgba(255,255,255,0.35)' }}>·</span>}
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
                {getYear(movie.release_date || movie.first_air_date || '')}
              </span>
            </div>
          </div>
        )}

        {/* Progress bar — absolute bottom, no border-radius */}
        {progressPercent > 0 && progressPercent < 100 && (
          <div className="card-progress">
            <div className="card-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MovieCard);
