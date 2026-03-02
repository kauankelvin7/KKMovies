/* KauanFlix — Movie Card Component */
import React, { useState } from 'react';
import { Play, Plus, Check, Film, Tv } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, getStreamingUrl, getSeriesStreamingUrl } from '../services/movieService';
import { getYear, isNewRelease } from '../utils/helpers';
import { myListService } from '../services/myListService';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import type { Movie, WatchProgress } from '../types/movie';

interface Props {
  movie: Movie;
  rank?: number;
  progress?: WatchProgress;
  landscape?: boolean;
  showOverlay?: boolean;
}

const MovieCard: React.FC<Props> = ({ movie, rank, progress, landscape, showOverlay = true }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [inList, setInList] = useState(() => myListService.isInList(movie.id));
  const navigate = useNavigate();
  const openPlayer = usePlayerStore((s) => s.openPlayer);
  const addToast = useAppStore((s) => s.addToast);

  const isSeries = movie.media_type === 'tv';

  const imgSrc = landscape
    ? getImageUrl(movie.backdrop_path, 'w780')
    : getImageUrl(movie.poster_path, 'w500');

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSeries) {
      // For series, open first episode
      openPlayer({
        streamUrl: getSeriesStreamingUrl(movie.id, 1, 1),
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.poster_path || '',
        backdropPath: movie.backdrop_path || '',
        mediaType: 'tv',
      });
    } else {
      openPlayer({
        streamUrl: getStreamingUrl(movie.id, movie.imdb_id),
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.poster_path || '',
        backdropPath: movie.backdrop_path || '',
        mediaType: 'movie',
      });
    }
  };

  const handleToggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = myListService.toggle(movie);
    setInList(added);
    addToast(added ? 'Adicionado à sua lista ✓' : 'Removido da sua lista', added ? 'success' : 'info');
  };

  const handleClick = () => {
    if (isSeries) {
      navigate(`/serie/${movie.id}`);
    } else {
      navigate(`/filme/${movie.id}`);
    }
  };

  return (
    <div className="relative flex-shrink-0 group" style={{ width: landscape ? 280 : 180 }}>
      {rank && (
        <div className="absolute -left-4 bottom-14 z-10 pointer-events-none select-none" aria-hidden="true">
          <span
            className="font-display text-[100px] leading-none font-bold"
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px rgba(123,47,255,0.5)',
              textShadow: '0 0 30px rgba(123,47,255,0.2)',
            }}
          >
            {rank}
          </span>
        </div>
      )}

      <div
        className={`card-movie ${landscape ? 'card-landscape' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`${movie.title} (${getYear(movie.release_date)})`}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        {!imgLoaded && !imgError && <div className="skeleton absolute inset-0" />}

        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={movie.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`img-blur-load ${imgLoaded ? 'loaded' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-kf-bg-secondary p-3">
            <Play className="w-8 h-8 text-kf-text-muted mb-2" />
            <span className="text-xs text-kf-text-muted text-center line-clamp-2">{movie.title}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5 z-10">
          {rank && rank <= 10 && <span className="badge badge-top10">TOP {rank}</span>}
          {isNewRelease(movie.release_date) && <span className="badge badge-new">NOVO</span>}
          {isSeries && <span className="badge badge-series"><Tv className="w-3 h-3 inline mr-0.5" />SÉRIE</span>}
          {movie.media_type === 'movie' && <span className="badge badge-film"><Film className="w-3 h-3 inline mr-0.5" />FILME</span>}
        </div>

        {showOverlay && (
          <div className="card-overlay z-10">
            <div className="flex gap-2">
              <button
                onClick={handlePlay}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-kf-bg hover:scale-110 transition-transform"
                aria-label="Assistir"
              >
                <Play className="w-4 h-4" fill="currentColor" />
              </button>
              <button
                onClick={handleToggleList}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 hover:border-white/60 transition-colors"
                aria-label={inList ? 'Remover da lista' : 'Adicionar à lista'}
              >
                {inList ? <Check className="w-4 h-4 text-kf-success" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {progress && progress.progress > 0 && progress.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <div className="progress-bar rounded-none">
              <div className="progress-bar-fill" style={{ width: `${progress.progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Info below card — Vizer-style */}
      <div className="mt-2 px-0.5">
        <h3 className="text-xs font-medium text-white line-clamp-1">{movie.title}</h3>
        <div className="flex items-center gap-1.5 text-[11px] text-kf-text-muted mt-0.5">
          <span className="text-kf-yellow">☆ {movie.vote_average?.toFixed(1)}</span>
          <span>·</span>
          <span>{getYear(movie.release_date)}</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MovieCard);
