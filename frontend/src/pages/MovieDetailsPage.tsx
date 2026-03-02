/* KauanFlix — Movie Details Page */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Plus, Check, ThumbsUp, Share2, Clock, Calendar,
  ChevronLeft, Film as FilmIcon,
} from 'lucide-react';
import * as movieService from '../services/movieService';
import { getImageUrl, getStreamingUrl } from '../services/movieService';
import { formatRuntime, getYear, formatNumber } from '../utils/helpers';
import { myListService } from '../services/myListService';
import { watchHistoryService } from '../services/watchHistoryService';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { StarRating } from '../components/ui/StarRating';
import { ContentCarousel } from '../components/ContentCarousel';
import { TrailerModal } from '../components/TrailerModal';
import { SkeletonDetail } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import type { Movie, CastMember, Video } from '../types/movie';

const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openPlayer = usePlayerStore((s) => s.openPlayer);
  const addToast = useAppStore((s) => s.addToast);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inList, setInList] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const watchProgress = id ? watchHistoryService.get(Number(id)) : undefined;

  useEffect(() => {
    if (!id) return;
    const movieId = Number(id);
    setLoading(true);
    setError(null);

    Promise.allSettled([
      movieService.getMovieDetails(movieId),
      movieService.getMovieCredits(movieId),
      movieService.getSimilarMovies(movieId),
      movieService.getMovieVideos(movieId),
    ]).then(([detailRes, creditRes, similarRes, videoRes]) => {
      if (detailRes.status === 'fulfilled') {
        setMovie(detailRes.value);
        setInList(myListService.isInList(movieId));
        document.title = `${detailRes.value.title} — KauanFlix`;
      } else {
        setError('Filme não encontrado.');
      }
      if (creditRes.status === 'fulfilled') {
        setCast((creditRes.value.cast || []).slice(0, 15));
      }
      if (similarRes.status === 'fulfilled') {
        setSimilar(similarRes.value);
      }
      if (videoRes.status === 'fulfilled') {
        setVideos(videoRes.value);
      }
      setLoading(false);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => { document.title = 'KauanFlix — Seu cinema, do seu jeito'; };
  }, [id]);

  const handlePlay = () => {
    if (!movie) return;
    openPlayer({
      streamUrl: getStreamingUrl(movie.id, movie.imdb_id),
      movieId: movie.id,
      movieTitle: movie.title,
      posterPath: movie.poster_path || '',
      backdropPath: movie.backdrop_path || '',
      mediaType: 'movie',
    });
  };

  const handleToggleList = () => {
    if (!movie) return;
    const added = myListService.toggle(movie);
    setInList(added);
    addToast(added ? 'Adicionado à sua lista ✓' : 'Removido da sua lista', added ? 'success' : 'info');
  };

  const handleShare = () => {
    if (navigator.share && movie) {
      navigator.share({ title: movie.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Link copiado!', 'info');
    }
  };

  if (loading) return <SkeletonDetail />;
  if (error || !movie) return <ErrorMessage message={error || 'Filme não encontrado'} onRetry={() => navigate(-1)} />;

  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = getImageUrl(movie.poster_path, 'w500');

  return (
    <main className="min-h-screen">
      {/* Backdrop */}
      <div className="relative w-full" style={{ height: '60vh', minHeight: 350 }}>
        {backdropUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #08080F 0%, rgba(8,8,15,0.6) 50%, rgba(8,8,15,0.3) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(8,8,15,0.9) 0%, transparent 70%)' }} />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-8 z-10 btn-icon bg-black/40"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="section-container -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          {posterUrl && (
            <div className="flex-shrink-0 hidden md:block">
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-64 rounded-lg shadow-2xl border border-[rgba(123,47,255,0.2)]"
                loading="lazy"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 max-w-3xl">
            <h1 className="hero-title text-white mb-2">{movie.title}</h1>

            {movie.tagline && (
              <p className="text-kf-text-secondary italic mb-4">{movie.tagline}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              <StarRating rating={movie.vote_average} />
              <span className="text-kf-text-muted">({formatNumber(movie.vote_count)} votos)</span>
              <span className="text-kf-text-secondary flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {getYear(movie.release_date)}
              </span>
              {movie.runtime && (
                <span className="text-kf-text-secondary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {formatRuntime(movie.runtime)}
                </span>
              )}
              <span className="badge badge-genre">{movie.adult ? '18+' : '14+'}</span>
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {movie.genres.map((g) => (
                  <span key={g.id} className="badge badge-genre">{g.name}</span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="mb-6">
              <p className="body-text">
                {showFullOverview || (movie.overview || '').length <= 250
                  ? movie.overview
                  : `${(movie.overview || '').slice(0, 250)}…`}
              </p>
              {(movie.overview || '').length > 250 && (
                <button
                  onClick={() => setShowFullOverview(!showFullOverview)}
                  className="text-kf-accent text-sm mt-1 hover:underline"
                >
                  {showFullOverview ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </div>

            {/* Watch progress indicator */}
            {watchProgress && watchProgress.progress > 0 && watchProgress.progress < 100 && (
              <div className="mb-4 flex items-center gap-3">
                <div className="progress-bar flex-1 max-w-xs">
                  <div className="progress-bar-fill" style={{ width: `${watchProgress.progress}%` }} />
                </div>
                <span className="text-xs text-kf-text-muted">{Math.round(watchProgress.progress)}% assistido</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button onClick={handlePlay} className="btn-primary text-base" aria-label="Assistir">
                <Play className="w-5 h-5" fill="currentColor" />
                {watchProgress && watchProgress.progress > 5 ? 'Continuar' : 'Assistir'}
              </button>
              <button
                onClick={() => setTrailerOpen(true)}
                className="btn-secondary text-base"
              >
                <FilmIcon className="w-4 h-4" />
                Trailer
              </button>
              <button onClick={handleToggleList} className="btn-icon" aria-label={inList ? 'Remover da lista' : 'Adicionar à lista'}>
                {inList ? <Check className="w-5 h-5 text-kf-success" /> : <Plus className="w-5 h-5" />}
              </button>
              <button onClick={() => addToast('Gostei! ✓', 'success')} className="btn-icon" aria-label="Gostei">
                <ThumbsUp className="w-5 h-5" />
              </button>
              <button onClick={handleShare} className="btn-icon" aria-label="Compartilhar">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Cast */}
            {cast.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Elenco Principal</h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {cast.map((person) => (
                    <div key={person.id} className="flex-shrink-0 text-center w-20">
                      {person.profile_path ? (
                        <img
                          src={getImageUrl(person.profile_path, 'w200')}
                          alt={person.name}
                          className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-[rgba(123,47,255,0.2)]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-kf-bg-secondary mx-auto mb-2 flex items-center justify-center text-kf-text-muted text-lg font-semibold">
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <p className="text-xs font-medium text-white line-clamp-2">{person.name}</p>
                      <p className="text-xs text-kf-text-muted line-clamp-1">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar movies */}
      {similar.length > 0 && (
        <div className="mt-8">
          <ContentCarousel
            title="Filmes Similares"
            movies={similar}
          />
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        videos={videos}
        title={movie.title}
        year={movie.release_date?.split('-')[0]}
        onClose={() => setTrailerOpen(false)}
      />
    </main>
  );
};

export default MovieDetailsPage;
