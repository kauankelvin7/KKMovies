import { memo, useCallback } from 'react';
import { Movie } from '@/types/movie';
import { getImageUrl, getRatingColor } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';

interface MovieCardProps {
  movie: Movie;
}

/**
 * Movie card component displaying movie poster and basic information
 * Optimized with memo and lazy loading
 */
const MovieCard = memo(({ movie }: MovieCardProps) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/movie/${movie.id}`);
  }, [navigate, movie.id]);

  return (
    <div className="movie-card" onClick={handleClick}>
      {/* Movie Poster */}
      <img
        src={getImageUrl(movie.poster_path)}
        alt={movie.title}
        className="movie-card-image"
        loading="lazy"
        decoding="async"
      />

      {/* Overlay with details */}
      <div className="movie-card-overlay">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2">{movie.title}</h3>
          
          <div className="flex items-center justify-between">
            {/* Rating */}
            <div className="flex items-center space-x-1">
              <svg
                className={`w-5 h-5 ${getRatingColor(movie.vote_average)}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className={`font-semibold ${getRatingColor(movie.vote_average)}`}>
                {movie.vote_average.toFixed(1)}
              </span>
            </div>

            {/* Release Year */}
            <span className="text-sm text-gray-300">
              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

MovieCard.displayName = 'MovieCard';

export default MovieCard;
