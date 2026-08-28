import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Clock } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { useMovieSearch } from '../hooks/useMovies';
import { useAppStore } from '../store/useAppStore';
import { searchHistoryService } from '../services/storageService';
import { getImageUrl } from '../services/movieService';
import { getYear } from '../utils/helpers';
import type { Genre } from '../types/movie';

type TypeFilter = 'all' | 'movie' | 'tv';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularidade' },
  { value: 'vote_average.desc', label: 'Nota' },
  { value: 'release_date.desc', label: 'Mais Recente' },
  { value: 'title.asc', label: 'Título A-Z' },
];

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [searchHistory, setSearchHistory] = useState(() => searchHistoryService.getAll());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const genres = useAppStore((s) => s.genres);

  const debouncedQuery = useDebounce(query, 350);
  const { movies, loading } = useMovieSearch(debouncedQuery);

  /* Update URL and history */
  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
      searchHistoryService.add(debouncedQuery);
      setSearchHistory(searchHistoryService.getAll());
      document.title = `"${debouncedQuery}" — KauanFlix`;
    } else {
      setSearchParams({});
      document.title = 'Buscar — KauanFlix';
    }
    return () => { document.title = 'KauanFlix'; };
  }, [debouncedQuery, setSearchParams]);

  /* Show dropdown only when query is non-empty and loading or results available */
  useEffect(() => {
    setDropdownOpen(Boolean(query && (loading || movies.length > 0)));
    setHighlightedIdx(-1);
  }, [query, loading, movies.length]);

  /* Client-side filters */
  const filteredMovies = useMemo(() => {
    let results = [...movies];
    if (typeFilter !== 'all') results = results.filter((m) => m.media_type === typeFilter);
    if (selectedGenre) results = results.filter((m) => m.genre_ids?.includes(selectedGenre));
    if (minRating > 0) results = results.filter((m) => m.vote_average >= minRating);
    if (sortBy === 'vote_average.desc') results.sort((a, b) => b.vote_average - a.vote_average);
    else if (sortBy === 'release_date.desc') results.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
    else if (sortBy === 'title.asc') results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return results;
  }, [movies, typeFilter, selectedGenre, minRating, sortBy]);

  /* Dropdown suggestions (top 5) */
  const suggestions = useMemo(() => movies.slice(0, 5), [movies]);

  /* Keyboard navigation */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      const selected = suggestions[highlightedIdx];
      useAppStore.getState().openDetails(selected.id, (selected.media_type as 'movie' | 'tv') || 'movie');
      setDropdownOpen(false);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const removeHistory = (term: string) => {
    searchHistoryService.remove(term);
    setSearchHistory(searchHistoryService.getAll());
  };

  /* Empty state SVG */
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-6 opacity-30">
        <circle cx="34" cy="34" r="22" stroke="white" strokeWidth="2.5" />
        <line x1="50" y1="50" x2="70" y2="70" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="26" y1="34" x2="42" y2="34" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="26" x2="34" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h2 className="font-light text-xl md:text-2xl text-white mb-2">
        Nenhum resultado para "{debouncedQuery}"
      </h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Tente outro termo ou ajuste os filtros
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {['Ação', 'Drama', 'Comédia', 'Terror', 'Sci-Fi'].map((cat) => (
          <button
            key={cat}
            onClick={() => setQuery(cat)}
            className="px-4 py-1.5 rounded-full glass-card text-xs text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main
      className="min-h-screen bg-[var(--surface-0)] page-enter"
      style={{
        paddingTop: 100,
        paddingBottom: 80,
        paddingLeft: 'clamp(16px, 5vw, 80px)',
        paddingRight: 'clamp(16px, 5vw, 80px)',
      }}
    >
      {/* Search Input Container */}
      <div className="max-w-[640px] mx-auto mb-8 relative">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] z-10 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
            placeholder="Buscar filmes, séries..."
            autoFocus
            className={`w-full h-14 pl-12 pr-12 text-lg font-light bg-[var(--surface-2)] text-white border border-[var(--glass-separator)] outline-none transition-all shadow-lg ${
              dropdownOpen ? 'rounded-t-2xl rounded-b-none border-b-0' : 'rounded-2xl'
            } focus:border-[var(--accent-blue-border)] focus:ring-4 focus:ring-[var(--accent-blue-glow)]`}
            aria-label="Buscar filmes e séries"
            aria-autocomplete="list"
            aria-expanded={dropdownOpen}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white p-1 transition-colors"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown (Glass Style) */}
        {dropdownOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-50 bg-[var(--surface-1)] backdrop-blur-2xl border border-[var(--glass-separator)] border-t-0 rounded-b-2xl shadow-2xl overflow-hidden divide-y divide-[var(--glass-separator)]" ref={dropdownRef}>
            {suggestions.map((m, idx) => (
              <div
                key={m.id}
                role="option"
                aria-selected={idx === highlightedIdx}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  idx === highlightedIdx ? 'bg-[var(--accent-blue-dim)]' : 'hover:bg-[var(--surface-2)]'
                }`}
                onMouseDown={() => {
                  useAppStore.getState().openDetails(m.id, (m.media_type as 'movie' | 'tv') || 'movie');
                  setDropdownOpen(false);
                }}
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 rounded-lg overflow-hidden w-10 h-14 bg-[var(--surface-3)] border border-[var(--glass-separator)]">
                  {m.poster_path && (
                    <img
                      src={getImageUrl(m.poster_path, 'w200')}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {m.title || m.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {m.media_type === 'tv' ? 'Série' : 'Filme'}{getYear(m.release_date || m.first_air_date) ? ` · ${getYear(m.release_date || m.first_air_date)}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Always-visible filters */}
      {(movies.length > 0 || debouncedQuery) && (
        <div className="max-w-[640px] mx-auto mb-8">
          {/* Type pills (iOS Segmented style) */}
          <div className="flex gap-2 flex-wrap mb-4">
            {(['all', 'movie', 'tv'] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-5 py-2 rounded-full text-xs font-medium transition-all ${
                  typeFilter === t
                    ? 'bg-[var(--accent-blue)] text-white shadow-md shadow-[var(--accent-blue-glow)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--glass-separator)] hover:text-white'
                }`}
              >
                {t === 'all' ? 'Tudo' : t === 'movie' ? 'Filmes' : 'Séries'}
              </button>
            ))}
          </div>

          {/* Secondary filter chips */}
          <div className="flex gap-2 flex-wrap">
            {/* Genre */}
            <select
              value={selectedGenre || ''}
              onChange={(e) => setSelectedGenre(e.target.value ? Number(e.target.value) : null)}
              className={`px-3.5 py-1.5 rounded-full text-xs outline-none cursor-pointer transition-all ${
                selectedGenre 
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--accent-blue-border)]' 
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--glass-separator)] hover:text-white'
              }`}
            >
              <option value="" className="bg-[var(--surface-1)]">Gênero</option>
              {genres.map((g: Genre) => (
                <option key={g.id} value={g.id} className="bg-[var(--surface-1)]">{g.name}</option>
              ))}
            </select>

            {/* Rating */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className={`px-3.5 py-1.5 rounded-full text-xs outline-none cursor-pointer transition-all ${
                minRating > 0 
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--accent-blue-border)]' 
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--glass-separator)] hover:text-white'
              }`}
            >
              <option value={0} className="bg-[var(--surface-1)]">Nota mínima</option>
              <option value={6} className="bg-[var(--surface-1)]">6+</option>
              <option value={7} className="bg-[var(--surface-1)]">7+</option>
              <option value={8} className="bg-[var(--surface-1)]">8+</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs outline-none cursor-pointer transition-all ${
                sortBy !== 'popularity.desc' 
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--accent-blue-border)]' 
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--glass-separator)] hover:text-white'
              }`}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[var(--surface-1)]">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Recent searches — shown when input is empty */}
      {!query && searchHistory.length > 0 && (
        <div className="max-w-[640px] mx-auto mb-10">
          <h3 className="text-xs font-medium text-[var(--text-muted)] mb-3 flex items-center gap-1.5 tracking-wider uppercase">
            <Clock className="w-3.5 h-3.5" /> Buscas recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term) => (
              <div
                key={term}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card cursor-pointer group hover:border-[var(--accent-blue-border)] transition-all"
                onClick={() => setQuery(term)}
              >
                <span className="text-xs text-[var(--text-secondary)] group-hover:text-white transition-colors">{term}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeHistory(term); }}
                  className="text-[var(--text-hint)] hover:text-white flex items-center p-0.5 transition-colors"
                  aria-label={`Remover "${term}"`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton grid */}
      {loading && (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && filteredMovies.length > 0 && (
        <>
          <p className="text-xs text-[var(--text-muted)] mb-4 tracking-wide">
            {filteredMovies.length} resultado{filteredMovies.length !== 1 ? 's' : ''} para "{debouncedQuery}"
          </p>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={`${movie.media_type}-${movie.id}`}
                movie={movie}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && debouncedQuery && filteredMovies.length === 0 && <EmptyState />}
    </main>
  );
};

export default SearchPage;