import { useState, useEffect } from 'react';
import movieService from '@/services/movieService';
import { Movie, MoviesResponse } from '@/types/movie';

/**
 * Custom hook for fetching movies with loading and error states
 */
export const useMovies = (
  fetchFunction: (page: number) => Promise<MoviesResponse>,
  dependencies: any[] = []
) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchFunction(page);
        setMovies(data.results);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError('Failed to fetch movies. Please try again later.');
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page, ...dependencies]);

  return { movies, loading, error, page, setPage, totalPages };
};

/**
 * Custom hook for searching movies
 */
export const useSearch = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await movieService.search({ query, page: 1 });
        setResults(data.results);
      } catch (err) {
        setError('Search failed. Please try again.');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchMovies, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { query, setQuery, results, loading, error };
};
