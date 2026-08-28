import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid3X3, List, SlidersHorizontal, Film, Tv, ChevronDown } from 'lucide-react';
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
    <main className="min-h-screen pt-24 pb-24 section-container page-enter">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-white m-0">
          Explorar
        </h1>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`glass-icon-btn ${showFilters ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}
            aria-label="Filtros"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-6 bg-[var(--glass-separator)] mx-1" />
          <button
            onClick={() => setViewMode('grid')}
            className={`glass-icon-btn ${viewMode === 'grid' ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}
            aria-label="Grade"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`glass-icon-btn ${viewMode === 'list' ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}
            aria-label="Lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Type Toggle (iOS Segmented Control Style) */}
      <div className="flex p-1 bg-[rgba(118,118,128,0.12)] rounded-xl w-fit mb-6">
        <button
          onClick={() => setContentType('movie')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            contentType === 'movie'
              ? 'bg-[var(--surface-1)] shadow-md text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <Film className="w-4 h-4" /> Filmes
        </button>
        <button
          onClick={() => setContentType('tv')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            contentType === 'tv'
              ? 'bg-[var(--surface-1)] shadow-md text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <Tv className="w-4 h-4" /> Séries
        </button>
      </div>

      {/* Filters (Glass Card) */}
      {showFilters && (
        <div className="glass-card p-5 mb-8 animate-slide-down">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Filter Item */}
            <div className="relative">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Gênero</label>
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[rgba(118,118,128,0.12)] rounded-lg border-none text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue-glow)] transition-all appearance-none cursor-pointer"
                >
                  <option value="">Todos</option>
                  {genres.map((g: Genre) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            {/* Filter Item */}
            <div className="relative">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Ano</label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[rgba(118,118,128,0.12)] rounded-lg border-none text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue-glow)] transition-all appearance-none cursor-pointer"
                >
                  <option value="">Todos</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            {/* Filter Item */}
            <div className="relative">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Nota mínima</label>
              <div className="relative">
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[rgba(118,118,128,0.12)] rounded-lg border-none text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue-glow)] transition-all appearance-none cursor-pointer"
                >
                  <option value="">Qualquer</option>
                  <option value="6">6+</option>
                  <option value="7">7+</option>
                  <option value="8">8+</option>
                  <option value="9">9+</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            {/* Filter Item */}
            <div className="relative">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Idioma</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[rgba(118,118,128,0.12)] rounded-lg border-none text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue-glow)] transition-all appearance-none cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            {/* Filter Item */}
            <div className="relative">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Ordenar</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[rgba(118,118,128,0.12)] rounded-lg border-none text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue-glow)] transition-all appearance-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
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
              ? 'grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6'
              : 'grid grid-cols-1 sm:grid-cols-2 gap-4'
          }
        >
          {movies.map((movie, idx) => (
            <MovieCard key={`${movie.id}-${contentType}-${idx}`} movie={movie} landscape={viewMode === 'list'} />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger (iOS Pill) */}
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

export default CatalogPage;