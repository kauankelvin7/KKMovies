import { Movie } from '@/types/movie';
import MovieCard from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  title?: string;
}

/**
 * Grid layout component for displaying multiple movie cards
 */
const MovieGrid = ({ movies, title }: MovieGridProps) => {
  if (!movies || movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No movies found.</p>
      </div>
    );
  }

  return (
    <section className="my-8">
      {title && (
        <h2 className="text-3xl font-bold mb-6 border-l-4 border-primary-600 pl-4">
          {title}
        </h2>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
};

export default MovieGrid;
