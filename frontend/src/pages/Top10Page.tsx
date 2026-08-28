import React, { useState, useEffect } from 'react';
import { Flame, Star, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as movieService from '../services/movieService';
import { getImageUrl, getStreamingUrl } from '../services/movieService';
import { getYear, formatRating } from '../utils/helpers';
import { usePlayerStore } from '../store/usePlayerStore';
import { SkeletonRow } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import type { Movie } from '../types/movie';

const Top10Page: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const openPlayer = usePlayerStore((s) => s.openPlayer);

  useEffect(() => {
    document.title = 'Top 10 Brasil — KauanFlix';
    setLoading(true);
    movieService.getTrending()
      .then((res) => {
        const results = Array.isArray(res) ? res : res.results || [];
        setMovies(results.slice(0, 10));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    return () => { document.title = 'KauanFlix — Seu cinema, do seu jeito'; };
  }, []);

  if (error) return <ErrorMessage message={error} />;

  return (
    <main className="min-h-screen pt-24 pb-24 bg-[var(--surface-0)] page-enter">
      
      {/* Header Glass */}
      <div className="section-container mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(201,151,58,0.15)] border border-[rgba(201,151,58,0.3)] flex items-center justify-center shadow-[0_0_15px_rgba(201,151,58,0.15)]">
            <Flame className="w-5 h-5 text-[var(--accent-gold)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-white m-0">
            Top 10 no Brasil
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="section-container">
          <SkeletonRow count={5} />
        </div>
      ) : (
        <div className="section-container flex flex-col gap-4">
          {movies.map((movie, i) => {
            const rank = i + 1;
            const poster = getImageUrl(movie.poster_path, 'w300');

            return (
              <div
                key={movie.id}
                className="relative flex items-center gap-4 md:gap-6 p-4 rounded-2xl glass-card cursor-pointer group"
                onClick={() => navigate(`/filme/${movie.id}`)}
              >
                {/* Rank number */}
                <span
                  className="text-6xl md:text-7xl leading-none font-bold flex-shrink-0 w-16 md:w-24 text-center tracking-tighter"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: rank <= 3 ? '1.5px var(--accent-gold)' : '1px var(--text-hint)',
                    textShadow: rank <= 3 ? '0 0 24px rgba(201, 151, 58, 0.25)' : 'none',
                  }}
                >
                  {rank}
                </span>

                {/* Poster */}
                <div className="flex-shrink-0 w-16 md:w-20 rounded-xl overflow-hidden border border-[var(--glass-separator)] shadow-md group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300">
                  {poster ? (
                    <img 
                      src={poster} 
                      alt={movie.title} 
                      className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-105" 
                      loading="lazy" 
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-[var(--surface-2)]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-2">
                  <h2 className="text-lg md:text-xl font-medium text-[var(--text-primary)] truncate tracking-tight">
                    {movie.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 text-xs md:text-sm text-[var(--text-secondary)] font-medium">
                    {movie.vote_average > 0 && (
                      <>
                        <span className="flex items-center gap-1 text-[var(--accent-gold)]">
                          <Star className="w-3.5 h-3.5" fill="currentColor" />
                          {formatRating(movie.vote_average)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--text-hint)]" />
                      </>
                    )}
                    <span>{getYear(movie.release_date)}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2 hidden md:block leading-relaxed font-light">
                    {movie.overview || 'Sem descrição disponível.'}
                  </p>
                </div>

                {/* Play button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openPlayer({
                      streamUrl: getStreamingUrl(movie.id, movie.imdb_id),
                      movieId: movie.id,
                      movieTitle: movie.title,
                      posterPath: movie.poster_path || '',
                      imdbId: movie.imdb_id,
                    });
                  }}
                  className="glass-button primary px-5 py-2.5 flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform lg:translate-x-4 lg:group-hover:translate-x-0 mr-2"
                  aria-label={`Assistir ${movie.title}`}
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  <span className="hidden md:inline ml-2 font-medium">Assistir</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Top10Page;