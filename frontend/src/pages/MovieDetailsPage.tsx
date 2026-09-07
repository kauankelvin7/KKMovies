import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Plus, Check, Share2, Clock, Calendar,
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
import { Synopsis } from '../components/Synopsis';
import { Artwork } from '../components/Artwork';
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
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [inList, setInList] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const watchProgress = id ? watchHistoryService.get(Number(id)) : undefined;

  useEffect(() => {
    if (!id) return;
    const movieId = Number(id);
    let cancelled = false;
    setMovie(null); setCast([]); setSimilar([]); setVideos([]);
    setLoading(true);
    setError(null);

    movieService.getMovieDetails(movieId).then(details => {
      if (cancelled) return;
      setMovie(details); setInList(myListService.isInList(movieId));
      document.title = `${details.title} — KKMovies`;
    }).catch(() => { if (!cancelled) setError('Não foi possível carregar os detalhes deste filme.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    movieService.getMovieCredits(movieId).then(credits => {
      if (!cancelled) setCast((credits.cast || []).slice(0, 15));
    }).catch(() => {});
    movieService.getMovieVideos(movieId).then(items => {
      if (!cancelled) setVideos(items);
    }).catch(() => {});

    setRecommendationsLoading(true);
    const filterSuggestions = (items: Movie[]) => items.filter((item, index) =>
      item.id !== movieId && (item.media_type || 'movie') === 'movie' && items.findIndex(other => other.id === item.id) === index
    ).slice(0, 20);
    async function loadRecommendations() {
      try {
        let items = filterSuggestions(await movieService.getRecommendedMovies(movieId).catch(() => []));
        if (!items.length && !cancelled) items = filterSuggestions(await movieService.getSimilarMovies(movieId));
        if (!cancelled) setSimilar(items);
      } catch { if (!cancelled) setSimilar([]); }
      finally { if (!cancelled) setRecommendationsLoading(false); }
    }
    void loadRecommendations();

    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => { cancelled = true; document.title = 'KKMovies — Seu cinema, do seu jeito'; };
  }, [id, retry]);

  const handlePlay = () => {
    if (!movie) return;
    openPlayer({
      streamUrl: getStreamingUrl(movie.id, movie.imdb_id),
      movieId: movie.id,
      movieTitle: movie.title,
      posterPath: movie.poster_path || '',
      backdropPath: movie.backdrop_path || '',
      mediaType: 'movie',
      imdbId: movie.imdb_id,
    });
  };

  const handleToggleList = () => {
    if (!movie) return;
    const added = myListService.toggle(movie);
    setInList(added);
    addToast(added ? 'Adicionado à sua lista ✓' : 'Removido da sua lista', added ? 'success' : 'info');
  };

  const handleShare = async () => {
    try {
      if (navigator.share && movie) await navigator.share({ title: movie.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); addToast('Link copiado!', 'success'); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) addToast('Não foi possível compartilhar o link.', 'error'); }
  };

  if (loading) return <SkeletonDetail />;
  if (error || !movie) return <ErrorMessage message={error || 'Filme não encontrado'} onRetry={() => setRetry(value => value + 1)} />;

  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');


  return (
    <main className="min-h-screen bg-[var(--surface-0)] page-enter pb-24">

      {/* Backdrop (Cinematographic Glass Gradients) */}
      <div className="relative w-full h-[55vh] min-h-[400px] overflow-hidden">
        {backdropUrl && (
          <div
            className="absolute inset-0 bg-cover bg-top"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)]/90 via-[var(--surface-0)]/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-4 md:left-8 z-20 glass-icon-btn bg-black/20 backdrop-blur-md"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Content Area */}
      <div className="section-container -mt-32 md:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">

          {/* Poster (Glass Card style) */}
          {(
            <div className="flex-shrink-0 hidden md:block">
              <div className="glass-card p-1 rounded-2xl">
                <Artwork paths={[movie.poster_path, movie.backdrop_path]} title={movie.title} className="w-64 lg:w-72 aspect-[2/3] rounded-xl object-cover shadow-2xl" />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 max-w-4xl pt-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mb-2 lg:mb-3">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-[var(--text-secondary)] italic mb-5 font-light text-base md:text-lg">
                "{movie.tagline}"
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-6 text-xs md:text-sm">
              <StarRating rating={movie.vote_average} />
              <span className="text-[var(--text-muted)]">({formatNumber(movie.vote_count)})</span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-hint)] hidden sm:block" />
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4" /> {getYear(movie.release_date)}
              </span>
              {movie.runtime && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[var(--text-hint)] hidden sm:block" />
                  <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4" /> {formatRuntime(movie.runtime)}
                  </span>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-[var(--text-hint)] hidden sm:block" />
              <span className="badge badge-category">{movie.adult ? '18+' : '14+'}</span>
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((g) => (
                  <span key={g.id} className="badge badge-sub border border-[var(--glass-separator)] bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] px-3 py-1 rounded-full font-medium">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Watch progress indicator */}
            {watchProgress && watchProgress.progress > 0 && watchProgress.progress < 100 && (
              <div className="mb-6 flex items-center gap-3 bg-[rgba(118,118,128,0.12)] p-3 rounded-xl max-w-sm border border-[var(--glass-separator)]">
                <div className="progress-bar flex-1 bg-black/40 rounded-full h-2">
                  <div className="progress-bar-fill rounded-full" style={{ width: `${watchProgress.progress}%` }} />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                  {Math.round(watchProgress.progress)}% Assistido
                </span>
              </div>
            )}

            {/* Action buttons (Glassmorphism) */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button onClick={handlePlay} className="glass-button primary text-[15px] px-6 py-2.5" aria-label="Assistir">
                <Play className="w-4 h-4 mr-2" fill="currentColor" />
                {watchProgress && watchProgress.progress > 5 ? 'Continuar' : 'Assistir'}
              </button>

              {videos.some(video => video.site === 'YouTube') && <button onClick={() => setTrailerOpen(true)} className="glass-button text-[15px] px-6 py-2.5">
                <FilmIcon className="w-4 h-4 mr-2" />
                Trailer
              </button>}

              <div className="w-[1px] h-8 bg-[var(--glass-separator)] mx-1" />

              <button onClick={handleToggleList} className={`glass-icon-btn ${inList ? 'text-[var(--accent-blue)] bg-[var(--accent-blue-dim)]' : ''}`} aria-label={inList ? 'Remover da lista' : 'Adicionar à lista'}>
                {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>



              <button onClick={handleShare} className="glass-icon-btn" aria-label="Compartilhar">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <Synopsis text={movie.overview} />

            {/* Cast */}
            {cast.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-medium text-white mb-5 tracking-wide">Elenco Principal</h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                  {cast.map((person) => (
                    <div key={person.id} className="flex-shrink-0 text-center w-24">
                      {person.profile_path ? (
                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full p-0.5 border border-[var(--glass-separator)] bg-[var(--surface-1)]">
                          <img
                            src={getImageUrl(person.profile_path, 'w200')}
                            alt={person.name}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full border border-[var(--glass-separator)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] text-xl font-light">
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <p className="text-[13px] font-medium text-white line-clamp-2 leading-tight mb-1">{person.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-tight">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar movies */}
      {(recommendationsLoading || similar.length > 0) && (
        <div className="mt-4">
          <ContentCarousel
            title="Filmes recomendados"
            movies={similar}
              loading={recommendationsLoading}
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
