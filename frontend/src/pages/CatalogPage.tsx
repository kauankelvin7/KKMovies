import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  Film,
  Tv,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { SkeletonGrid } from '../components/ui/Skeleton';
import * as movieService from '../services/movieService';
import type { Movie, Genre } from '../types/movie';
import { readCatalogFilters } from '../utils/catalogFilters';

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentType = 'movie' | 'tv';
type ViewMode = 'grid' | 'list';
type SortValue =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'primary_release_date.desc'
  | 'original_title.asc';

// Typed params — eliminates `Record<string, any>`
type DiscoverParams = {
  page: number;
  sort_by: string;
  type: ContentType;
  with_genres?: string;
  primary_release_year?: number;
  first_air_date_year?: number;
  'vote_average.gte'?: number;
  with_original_language?: string;
};

// ─── Module-level constants (never re-created on render) ─────────────────────

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'popularity.desc', label: 'Popularidade' },
  { value: 'vote_average.desc', label: 'Nota' },
  { value: 'primary_release_date.desc', label: 'Mais Recente' },
  { value: 'original_title.asc', label: 'Título A–Z' },
];

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os idiomas' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'ja', label: 'Japonês' },
  { value: 'ko', label: 'Coreano' },
];

const RATING_OPTIONS = [6, 7, 8, 9] as const;

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

/** Stable deduplication key per item */
const movieKey = (m: Pick<Movie, 'id' | 'media_type'>): string =>
  `${m.media_type ?? ''}-${m.id}`;

// ─── Component ───────────────────────────────────────────────────────────────

const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { type: contentType, genre: selectedGenre, year: selectedYear, rating: minRating, sort: sortBy, language } = readCatalogFilters(searchParams);
  const updateFilters = useCallback((changes: Record<string, string>) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value); else next.delete(key);
      }
      return next;
    });
  }, [setSearchParams]);
  const setSelectedGenre = (value: string) => updateFilters({ genre: value });
  const setSelectedYear = (value: string) => updateFilters({ year: value });
  const setMinRating = (value: string) => updateFilters({ rating: value });
  const setSortBy = (value: string) => updateFilters({ sort: value });
  const setLanguage = (value: string) => updateFilters({ lang: value });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);         // prevents concurrent fetches
  const requestVersion = useRef(0);             // cancels stale responses

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeFilters = useMemo(
    () => [selectedGenre, selectedYear, minRating, language].filter(Boolean).length,
    [selectedGenre, selectedYear, minRating, language],
  );


  // ── Genres: reload when content type changes ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    movieService
      .getGenres(contentType)
      .then((items) => { if (!cancelled) setGenres(items); })
      .catch(() => { if (!cancelled) setGenres([]); });
    return () => { cancelled = true; };
  }, [contentType]);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const fetchMovies = useCallback(
    async (pageNum: number, reset = false) => {
      // Guard: skip if already loading, unless this is a hard reset
      if (loadingRef.current && !reset) return;
      loadingRef.current = true;

      const version = ++requestVersion.current;

      setError(null);
      if (reset) {
        setLoading(true);
        setMovies([]);
      } else {
        setLoadingMore(true);
      }

      try {
        const params: DiscoverParams = {
          page: pageNum,
          sort_by: sortBy,
          type: contentType,
        };
        if (selectedGenre) params.with_genres = selectedGenre;
        if (selectedYear) {
          params[contentType === 'tv' ? 'first_air_date_year' : 'primary_release_year'] =
            Number(selectedYear);
        }
        if (minRating) params['vote_average.gte'] = Number(minRating);
        if (language) params.with_original_language = language;

        const res = await movieService.discoverMovies(params);

        // Discard stale response
        if (version !== requestVersion.current) return;

        const raw: Movie[] = Array.isArray(res) ? res : (res?.results ?? []);
        const tagged = raw.map((m) => ({
          ...m,
          media_type: (m.media_type ?? contentType) as Movie['media_type'],
        }));

        setMovies((prev) => {
          if (reset) return tagged;
          // O(n) deduplication with Map — replaces the O(n²) .some() scan
          const seen = new Map<string, Movie>(prev.map((m) => [movieKey(m), m]));
          tagged.forEach((m) => {
            if (!seen.has(movieKey(m))) seen.set(movieKey(m), m);
          });
          return Array.from(seen.values());
        });

        setTotalPages(res?.total_pages ?? 1);
        setPage(pageNum);
      } catch (err: unknown) {
        if (version !== requestVersion.current) return;
        console.error('[CatalogPage] discoverMovies error:', err);
        setError(
          err instanceof Error ? err.message : 'Erro ao carregar o conteúdo.',
        );
      } finally {
        // Only the latest in-flight request resets shared loading state
        if (version !== requestVersion.current) return;
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [selectedGenre, selectedYear, minRating, sortBy, contentType, language],
  );

  // ── Initial load + re-fetch on filter change ──────────────────────────────
  useEffect(() => {
    fetchMovies(1, true);
    document.title = 'Explorar — KKMovies';
    return () => {
      // Cancel any in-flight request when filters change or component unmounts
      requestVersion.current += 1;
      loadingRef.current = false;
      document.title = 'KKMovies — Seu cinema, do seu jeito';
    };
  }, [fetchMovies]);

  // ── Infinite scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !error && !loadingRef.current && page < totalPages) {
          fetchMovies(page + 1);
        }
      },
      { threshold: 0.5 },
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [page, totalPages, fetchMovies, error]);

  // ── Action callbacks ──────────────────────────────────────────────────────

  /**
   * Switching content type resets the genre immediately (in the same
   * React batch), avoiding a double-fetch that the old approach caused
   * by resetting genre inside a separate useEffect.
   */
  const handleContentTypeChange = useCallback((type: ContentType) => {
    updateFilters({ type, genre: '' });
  }, [updateFilters]);

  const clearFilters = useCallback(() => {
    updateFilters({ genre: '', year: '', rating: '', lang: '', sort: '' });
  }, [updateFilters]);

  const handleRetry = useCallback(() => {
    fetchMovies(movies.length > 0 ? page + 1 : 1, movies.length === 0);
  }, [fetchMovies, movies.length, page]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="explore-page section-container page-enter">

      {/* Page header */}
      <header className="page-heading">
        <div>
          <p className="eyebrow">O CATÁLOGO COMPLETO</p>
          <h1>Explore à sua maneira</h1>
          <p>Filtre por gênero, época e idioma para encontrar o que combina com você.</p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="explore-toolbar">
        <div className="type-tabs" role="group" aria-label="Tipo de conteúdo">
          <button
            type="button"
            className={contentType === 'movie' ? 'active' : ''}
            aria-pressed={contentType === 'movie'}
            onClick={() => handleContentTypeChange('movie')}
          >
            <Film size={16} aria-hidden="true" />
            Filmes
          </button>
          <button
            type="button"
            className={contentType === 'tv' ? 'active' : ''}
            aria-pressed={contentType === 'tv'}
            onClick={() => handleContentTypeChange('tv')}
          >
            <Tv size={16} aria-hidden="true" />
            Séries
          </button>
        </div>

        <div className="explore-tools">
          <button
            type="button"
            className="glass-button"
            aria-expanded={showFilters}
            aria-controls="explore-filters"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filtros
            {activeFilters > 0 && (
              <span
                className="filter-badge"
                aria-label={`${activeFilters} filtro${activeFilters !== 1 ? 's' : ''} ativo${activeFilters !== 1 ? 's' : ''}`}
              >
                {activeFilters}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`glass-icon-btn${viewMode === 'grid' ? ' active' : ''}`}
            aria-label="Visualização em grade"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`glass-icon-btn${viewMode === 'list' ? ' active' : ''}`}
            aria-label="Visualização em lista"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            <List size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <section
          id="explore-filters"
          className="explore-filters"
          aria-label="Filtros do catálogo"
        >
          <label htmlFor="filter-genre">
            Gênero
            <select
              id="filter-genre"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="">Todos os gêneros</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="filter-year">
            Ano
            <select
              id="filter-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Todas as épocas</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="filter-rating">
            Nota mínima
            <select
              id="filter-rating"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              <option value="">Todas as notas</option>
              {RATING_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}+ ★
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="filter-lang">
            Idioma original
            <select
              id="filter-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {activeFilters > 0 && (
            <button type="button" className="text-link" onClick={clearFilters}>
              <RotateCcw size={13} aria-hidden="true" />
              Restaurar filtros
            </button>
          )}
        </section>
      )}

      {/* Results bar */}
      <div className="explore-results-heading">
        {/* aria-live makes screen readers announce count changes */}
        <p role="status" aria-live="polite" aria-atomic="true">
          {loading
            ? 'Preparando sua seleção…'
            : `${movies.length} título${movies.length !== 1 ? 's' : ''} carregado${movies.length !== 1 ? 's' : ''}`}
          {activeFilters > 0 &&
            ` · ${activeFilters} filtro${activeFilters !== 1 ? 's' : ''} ativo${activeFilters !== 1 ? 's' : ''}`}
        </p>

        <label htmlFor="sort-select">
          Ordenar
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortValue)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Content area */}
      {loading ? (
        <SkeletonGrid />
      ) : movies.length > 0 ? (
        <div className={viewMode === 'grid' ? 'catalog-grid' : 'explore-landscape-grid'}>
          {movies.map((movie) => (
            <MovieCard
              key={`${movie.media_type ?? contentType}-${movie.id}`}
              movie={movie}
              landscape={viewMode === 'list'}
            />
          ))}
        </div>
      ) : !error ? (
        <div className="collection-empty">
          <Film size={32} aria-hidden="true" />
          <h2>Nenhum título nesta seleção</h2>
          <p>Experimente outros filtros ou explore uma nova combinação.</p>
          {activeFilters > 0 && (
            <button type="button" className="glass-button" onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
        </div>
      ) : null}

      {/* Error notice */}
      {error && (
        <div className="catalog-notice" role="alert">
          <span>{error}</span>
          <button type="button" onClick={handleRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Load more — shows spinner while in progress */}
      {!loading && page < totalPages && (
        <div className="load-more-row">
          <button
            type="button"
            className="glass-button"
            disabled={loadingMore}
            onClick={() => fetchMovies(page + 1)}
          >
            {loadingMore ? (
              <>
                <Loader2 size={16} className="spin" aria-hidden="true" />
                Carregando…
              </>
            ) : (
              'Carregar mais títulos'
            )}
          </button>
        </div>
      )}

      {/* Sentinel for IntersectionObserver */}
      <div ref={observerRef} className="catalog-sentinel" aria-hidden="true" />
    </main>
  );
};

export default CatalogPage;
