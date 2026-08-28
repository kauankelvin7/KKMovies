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
    <main className="min-h-screen pt-24 pb-12 section-container page-enter">
      
      {/* Header com ícone Glass */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[var(--accent-blue-dim)] border border-[var(--accent-blue-border)] flex items-center justify-center">
          <Film className="w-5 h-5 text-[var(--accent-blue)]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-white">
          Filmes Populares
        </h1>
      </div>

      {/* Grid de Conteúdo */}
      {loading ? (
        <SkeletonRow count={12} />
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {/* Indicador de Carregamento Infinito (iOS Pill) */}
      <div ref={observerRef} className="h-24 flex items-center justify-center mt-4">
        {loadingMore && (
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-base text-sm font-medium text-[var(--text-primary)] shadow-lg animate-pulse">
            <div className="w-4 h-4 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
            Carregando mais...
          </div>
        )}
      </div>
      
    </main>
  );
};

export default FilmesPage;