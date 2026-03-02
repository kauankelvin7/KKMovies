/* KauanFlix — Catalog / Explore Page */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid3X3, List, SlidersHorizontal, Film, Tv } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { SkeletonRow } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import * as movieService from '../services/movieService';
import { useAppStore } from '../store/useAppStore';
import type { Movie, Genre } from '../types/movie';

type ContentType = 'movie' | 'tv';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularidade' },
  { value: 'vote_average.desc', label: 'Nota' },
  { value: 'release_date.desc', label: 'Mais Recente' },
  { value: 'original_title.asc', label: 'Título A-Z' },
];

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Todos os idiomas' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'ja', label: 'Japonês' },
  { value: 'ko', label: 'Coreano' },
];

const CatalogPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

  const [contentType, setContentType] = useState<ContentType>('movie');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [language, setLanguage] = useState<string>('');

  const genres = useAppStore((s) => s.genres);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const fetchMovies = useCallback(async (pageNum: number, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    if (reset) {
      setLoading(true);
      setMovies([]);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params: Record<string, any> = {
        page: pageNum,
        sort_by: sortBy,
        type: contentType,
      };
      if (selectedGenre) params.with_genres = selectedGenre;
      if (selectedYear) {
        if (contentType === 'tv') {
          params.first_air_date_year = Number(selectedYear);
        } else {
          params.primary_release_year = Number(selectedYear);
        }
      }
      if (minRating) params['vote_average.gte'] = Number(minRating);
      if (language) params.with_original_language = language;

      const res = await movieService.discoverMovies(params);
      const results = Array.isArray(res) ? res : res?.results || [];

      /* Tag results with media_type for card badges */
      const taggedResults = results.map((m: Movie) => ({
        ...m,
        media_type: m.media_type || contentType,
      }));

      setMovies((prev) => reset ? taggedResults : [...prev, ...taggedResults]);
      setTotalPages(res?.total_pages || 1);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Discover error:', err);
      setError(err.message || 'Erro ao carregar conteúdo');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [selectedGenre, selectedYear, minRating, sortBy, contentType, language]);

  /* Initial load + filter changes */
  useEffect(() => {
    fetchMovies(1, true);
    document.title = 'Explorar — KauanFlix';
    return () => { document.title = 'KauanFlix — Seu cinema, do seu jeito'; };
  }, [fetchMovies]);

  /* Infinite scroll */
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

  /* Generate year options */
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  if (error && movies.length === 0) {
    return <ErrorMessage message={error} onRetry={() => fetchMovies(1, true)} />;
  }

  return (
    <main className="min-h-screen pt-24 section-container pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title mb-0">Explorar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-icon w-9 h-9 ${showFilters ? 'bg-kf-accent/20 text-kf-accent' : ''}`}
            aria-label="Filtros"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`btn-icon w-9 h-9 ${viewMode === 'grid' ? 'bg-kf-accent/20 text-kf-accent' : ''}`}
            aria-label="Grade"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn-icon w-9 h-9 ${viewMode === 'list' ? 'bg-kf-accent/20 text-kf-accent' : ''}`}
            aria-label="Lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setContentType('movie')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-medium transition-all ${
            contentType === 'movie'
              ? 'bg-gradient-to-r from-kf-accent to-kf-accent-secondary text-white shadow-lg shadow-kf-accent/25'
              : 'bg-kf-bg-secondary text-kf-text-secondary hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" /> Filmes
        </button>
        <button
          onClick={() => setContentType('tv')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-medium transition-all ${
            contentType === 'tv'
              ? 'bg-gradient-to-r from-kf-accent to-kf-accent-secondary text-white shadow-lg shadow-kf-accent/25'
              : 'bg-kf-bg-secondary text-kf-text-secondary hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" /> Séries
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass rounded-xl p-4 mb-6 animate-slide-down">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-kf-text-muted mb-1 block">Gênero</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-kf-bg rounded border border-[rgba(255,255,255,0.1)] text-white"
              >
                <option value="">Todos</option>
                {genres.map((g: Genre) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-kf-text-muted mb-1 block">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-kf-bg rounded border border-[rgba(255,255,255,0.1)] text-white"
              >
                <option value="">Todos</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-kf-text-muted mb-1 block">Nota mínima</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-kf-bg rounded border border-[rgba(255,255,255,0.1)] text-white"
              >
                <option value="">Qualquer</option>
                <option value="6">6+</option>
                <option value="7">7+</option>
                <option value="8">8+</option>
                <option value="9">9+</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-kf-text-muted mb-1 block">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-kf-bg rounded border border-[rgba(255,255,255,0.1)] text-white"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-kf-text-muted mb-1 block">Ordenar</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-kf-bg rounded border border-[rgba(255,255,255,0.1)] text-white"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading initial */}
      {loading && <SkeletonRow count={12} />}

      {/* Grid/List */}
      {!loading && movies.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              : 'grid grid-cols-1 sm:grid-cols-2 gap-4'
          }
        >
          {movies.map((movie, idx) => (
            <MovieCard key={`${movie.id}-${contentType}-${idx}`} movie={movie} landscape={viewMode === 'list'} />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
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

export default CatalogPage;
