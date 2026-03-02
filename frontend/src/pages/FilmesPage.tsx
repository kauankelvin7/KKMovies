/* KauanFlix — Films Catalog Page (grid view of popular movies) */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Film } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { SkeletonRow } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import * as movieService from '../services/movieService';
import type { Movie } from '../types/movie';

const FilmesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const fetchMovies = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await movieService.getPopular(pageNum);
      const results = Array.isArray(res) ? res : res.results || [];
      setMovies((prev) => pageNum === 1 ? results : [...prev, ...results]);
      setTotalPages(res.total_pages || 1);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchMovies(1);
    document.title = 'Filmes — KauanFlix';
    return () => { document.title = 'KauanFlix — Seu cinema, do seu jeito'; };
  }, [fetchMovies]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && page < totalPages) {
          fetchMovies(page + 1);
        }
      },
      { threshold: 0.5 }
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [page, totalPages, fetchMovies]);

  if (error && movies.length === 0) {
    return <ErrorMessage message={error} onRetry={() => fetchMovies(1)} />;
  }

  return (
    <main className="min-h-screen pt-24 section-container">
      <h1 className="section-title flex items-center gap-2">
        <Film className="w-6 h-6 text-kf-accent" />
        Filmes
      </h1>

      {loading ? (
        <SkeletonRow count={12} />
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      <div ref={observerRef} className="h-20 flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-kf-text-muted text-sm">
            <div className="w-5 h-5 border-2 border-kf-accent border-t-transparent rounded-full animate-spin" />
            Carregando mais...
          </div>
        )}
      </div>
    </main>
  );
};

export default FilmesPage;
