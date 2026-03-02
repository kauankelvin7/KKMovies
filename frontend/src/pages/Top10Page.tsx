/* KauanFlix — Top 10 Brasil Page */
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
    <main className="min-h-screen pt-24 section-container">
      <div className="flex items-center gap-3 mb-8">
        <Flame className="w-8 h-8 text-red-500" />
        <h1 className="section-title mb-0">Top 10 no Brasil</h1>
      </div>

      {loading ? (
        <SkeletonRow count={5} />
      ) : (
        <div className="space-y-4">
          {movies.map((movie, i) => {
            const rank = i + 1;
            const poster = getImageUrl(movie.poster_path, 'w300');

            return (
              <div
                key={movie.id}
                className="relative flex items-center gap-4 md:gap-6 p-4 rounded-xl glass cursor-pointer transition-all hover:border-kf-accent/30 group"
                onClick={() => navigate(`/filme/${movie.id}`)}
              >
                {/* Rank number */}
                <span
                  className="font-display text-6xl md:text-8xl leading-none font-bold flex-shrink-0 w-16 md:w-24 text-center"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: rank <= 3 ? '2px rgba(123,47,255,0.7)' : '2px rgba(255,255,255,0.15)',
                    textShadow: rank <= 3 ? '0 0 30px rgba(123,47,255,0.3)' : 'none',
                  }}
                >
                  {rank}
                </span>

                {/* Poster */}
                <div className="flex-shrink-0 w-16 md:w-20 rounded-lg overflow-hidden">
                  {poster ? (
                    <img src={poster} alt={movie.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-kf-bg-secondary rounded-lg" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-xl font-semibold text-white truncate">{movie.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-kf-text-secondary">
                    <span className="flex items-center gap-1 text-kf-yellow">
                      <Star className="w-3.5 h-3.5" fill="currentColor" />
                      {formatRating(movie.vote_average)}
                    </span>
                    <span>{getYear(movie.release_date)}</span>
                  </div>
                  <p className="text-sm text-kf-text-muted mt-1 line-clamp-2 hidden md:block">
                    {movie.overview}
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
                    });
                  }}
                  className="btn-primary px-4 py-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Assistir ${movie.title}`}
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  <span className="hidden md:inline">Assistir</span>
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
