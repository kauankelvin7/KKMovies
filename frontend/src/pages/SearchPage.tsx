/* KauanFlix — Search Page with type filter + multi-search */
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Clock, Film, Tv, Layers } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { SkeletonRow } from '../components/ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { useMovieSearch } from '../hooks/useMovies';
import { useAppStore } from '../store/useAppStore';
import { searchHistoryService } from '../services/searchHistoryService';
import type { Genre } from '../types/movie';

type TypeFilter = 'all' | 'movie' | 'tv';

const TYPE_TABS: { value: TypeFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Tudo', icon: <Layers className="w-4 h-4" /> },
  { value: 'movie', label: 'Filmes', icon: <Film className="w-4 h-4" /> },
  { value: 'tv', label: 'Séries', icon: <Tv className="w-4 h-4" /> },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularidade' },
  { value: 'vote_average.desc', label: 'Nota' },
  { value: 'release_date.desc', label: 'Mais Recente' },
  { value: 'title.asc', label: 'Título A-Z' },
];

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [searchHistory, setSearchHistory] = useState(searchHistoryService.getAll());

  const genres = useAppStore((s) => s.genres);
  const debouncedQuery = useDebounce(query, 400);
  const { movies, loading, error } = useMovieSearch(debouncedQuery);

  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
      searchHistoryService.add(debouncedQuery);
      setSearchHistory(searchHistoryService.getAll());
      document.title = `Buscar "${debouncedQuery}" — KauanFlix`;
    } else {
      setSearchParams({});
      document.title = 'Buscar — KauanFlix';
    }
    return () => { document.title = 'KauanFlix — Seu cinema, do seu jeito'; };
  }, [debouncedQuery, setSearchParams]);

  /* Apply client-side filters + type filter */
  const filteredMovies = useMemo(() => {
    let results = [...movies];

    /* Type filter */
    if (typeFilter !== 'all') {
      results = results.filter((m) => m.media_type === typeFilter);
    }

    if (selectedGenre) {
      results = results.filter((m) => m.genre_ids?.includes(selectedGenre));
    }

    if (minRating > 0) {
      results = results.filter((m) => m.vote_average >= minRating);
    }

    if (sortBy === 'vote_average.desc') {
      results.sort((a, b) => b.vote_average - a.vote_average);
    } else if (sortBy === 'release_date.desc') {
      results.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
    } else if (sortBy === 'title.asc') {
      results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return results;
  }, [movies, typeFilter, selectedGenre, minRating, sortBy]);

  /* Count by type */
  const movieCount = useMemo(() => movies.filter((m) => m.media_type === 'movie').length, [movies]);
  const seriesCount = useMemo(() => movies.filter((m) => m.media_type === 'tv').length, [movies]);

  const handleHistoryClick = (term: string) => {
    setQuery(term);
  };

  const removeHistory = (term: string) => {
    searchHistoryService.remove(term);
    setSearchHistory(searchHistoryService.getAll());
  };

  return (
    <main className="min-h-screen pt-24 section-container pb-24">
      {/* Search Input */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kf-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar filmes, séries..."
            autoFocus
            className="w-full h-12 pl-12 pr-12 text-base bg-kf-bg-secondary border border-[rgba(123,47,255,0.2)] rounded-xl text-white placeholder-kf-text-muted focus:outline-none focus:border-kf-accent transition-all"
            aria-label="Buscar"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-kf-text-muted hover:text-white"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
              showFilters ? 'text-kf-accent' : 'text-kf-text-muted hover:text-white'
            }`}
            aria-label="Filtros"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Type Filter Tabs — only when results exist */}
      {debouncedQuery && movies.length > 0 && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex gap-2">
            {TYPE_TABS.map((tab) => {
              const count = tab.value === 'all' ? movies.length : tab.value === 'movie' ? movieCount : seriesCount;
              const isActive = typeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setTypeFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-kf-accent to-kf-accent-secondary text-white shadow-lg shadow-kf-accent/25'
                      : 'bg-kf-bg-secondary text-kf-text-secondary hover:text-white hover:bg-kf-bg-secondary/80'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`text-xs ml-0.5 ${isActive ? 'text-white/80' : 'text-kf-text-muted'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="max-w-2xl mx-auto mb-6 glass rounded-xl p-4 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-kf-text-muted mb-1 block">Gênero</label>
              <select
                value={selectedGenre || ''}
                onChange={(e) => setSelectedGenre(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 px-3 text-sm bg-kf-bg rounded border border-[rgba(255,255,255,0.1)] text-white"
              >
                <option value="">Todos</option>
                {genres.map((g: Genre) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-kf-text-muted mb-1 block">Nota mínima</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full h-9 px-3 text-sm bg-kf-bg rounded border border-[rgba(255,255,255,0.1)] text-white"
              >
                <option value={0}>Qualquer</option>
                <option value={6}>6+</option>
                <option value={7}>7+</option>
                <option value={8}>8+</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-kf-text-muted mb-1 block">Ordenar por</label>
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

      {/* Recent searches (when no query) */}
      {!query && searchHistory.length > 0 && (
        <div className="max-w-2xl mx-auto mb-8">
          <h3 className="text-sm font-medium text-kf-text-muted mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Buscas recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term) => (
              <div
                key={term}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-kf-bg-secondary border border-[rgba(255,255,255,0.05)] text-sm cursor-pointer hover:border-kf-accent/30 transition-colors"
                onClick={() => handleHistoryClick(term)}
              >
                <span className="text-kf-text-secondary">{term}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeHistory(term); }}
                  className="text-kf-text-muted hover:text-white"
                  aria-label={`Remover "${term}"`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && <SkeletonRow count={8} />}

      {/* Results */}
      {!loading && filteredMovies.length > 0 && (
        <>
          <p className="text-sm text-kf-text-muted mb-4">
            {filteredMovies.length} resultado{filteredMovies.length !== 1 ? 's' : ''} para &quot;{debouncedQuery}&quot;
            {typeFilter !== 'all' && ` (${typeFilter === 'movie' ? 'filmes' : 'séries'})`}
          </p>
          <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMovies.map((movie) => (
              <MovieCard key={`${movie.media_type}-${movie.id}`} movie={movie} />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && query && filteredMovies.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-16 h-16 text-kf-text-muted mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum resultado</h2>
          <p className="text-kf-text-secondary">
            Nenhum resultado para &quot;{debouncedQuery}&quot;
            {typeFilter !== 'all' && ` em ${typeFilter === 'movie' ? 'filmes' : 'séries'}`}. Tente outro termo.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-center text-kf-danger py-8">{error}</p>
      )}
    </main>
  );
};

export default SearchPage;
