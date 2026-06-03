/* KauanFlix — Search Page v4 (HBO Max style)
   - Input centered max-width 640px, font-size 18px
   - Absolute dropdown with up to 5 results (thumbnail 40x60, title, type, year)
   - Keyboard navigation: ↑↓ Enter
   - Filters always visible (not collapsible): pills Type + chips Genre/Rating/Sort
   - Grid: repeat(auto-fill, minmax(150px, 1fr)), 2:3 cards
   - Empty state: clean SVG illustration + suggestions
   - History: "Buscas recentes" max 6 items, each deletable */

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
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 24, opacity: 0.3 }}>
        <circle cx="34" cy="34" r="22" stroke="white" strokeWidth="2.5" />
        <line x1="50" y1="50" x2="70" y2="70" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="26" y1="34" x2="42" y2="34" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="26" x2="34" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h2 style={{ fontWeight: 300, fontSize: 22, marginBottom: 8 }}>
        Nenhum resultado para "{debouncedQuery}"
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>
        Tente outro termo ou ajuste os filtros
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {['Ação', 'Drama', 'Comédia', 'Terror', 'Sci-Fi'].map((cat) => (
          <button
            key={cat}
            onClick={() => setQuery(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-2)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main
      className="min-h-screen"
      style={{
        paddingTop: 100,
        paddingBottom: 80,
        paddingLeft: 'clamp(16px, 5vw, 80px)',
        paddingRight: 'clamp(16px, 5vw, 80px)',
      }}
    >
      {/* Search Input */}
      <div style={{ maxWidth: 640, margin: '0 auto 32px', position: 'relative' }}>
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'rgba(255,255,255,0.4)', zIndex: 1 }}
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
            style={{
              width: '100%',
              height: 52,
              paddingLeft: 48,
              paddingRight: query ? 44 : 16,
              fontSize: 18,
              fontWeight: 300,
              background: 'var(--surface-2)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: dropdownOpen ? '6px 6px 0 0' : 6,
              color: 'white',
              outline: 'none',
              transition: 'border-color 150ms ease',
            }}
            onFocusCapture={(e) => (e.target.style.borderColor = 'rgba(74,144,217,0.4)')}
            onBlurCapture={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            aria-label="Buscar filmes e séries"
            aria-autocomplete="list"
            aria-expanded={dropdownOpen}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(255,255,255,0.5)', padding: 4 }}
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {dropdownOpen && suggestions.length > 0 && (
          <div className="search-dropdown" role="listbox" ref={dropdownRef}>
            {suggestions.map((m, idx) => (
              <div
                key={m.id}
                role="option"
                aria-selected={idx === highlightedIdx}
                className={`search-suggestion ${idx === highlightedIdx ? 'highlighted' : ''}`}
                onMouseDown={() => {
                  useAppStore.getState().openDetails(m.id, (m.media_type as 'movie' | 'tv') || 'movie');
                  setDropdownOpen(false);
                }}
              >
                {/* Thumbnail */}
                <div
                  className="flex-shrink-0 rounded overflow-hidden"
                  style={{ width: 40, height: 60, background: 'var(--surface-3)' }}
                >
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
                  <p style={{ fontSize: 14, fontWeight: 400 }} className="line-clamp-1">
                    {m.title || m.name}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                    {m.media_type === 'tv' ? 'Série' : 'Filme'}{getYear(m.release_date) ? ` · ${getYear(m.release_date)}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Always-visible filters */}
      {(movies.length > 0 || debouncedQuery) && (
        <div style={{ maxWidth: 640, margin: '0 auto 28px' }}>
          {/* Type pills */}
          <div className="flex gap-2 flex-wrap mb-4">
            {(['all', 'movie', 'tv'] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 13,
                  fontWeight: 400,
                  background: typeFilter === t ? '#4A90D9' : 'var(--surface-2)',
                  color: typeFilter === t ? '#fff' : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${typeFilter === t ? '#4A90D9' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
                }}
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
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                background: selectedGenre ? 'rgba(74,144,217,0.15)' : 'var(--surface-2)',
                border: `1px solid ${selectedGenre ? 'rgba(74,144,217,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: 'rgba(255,255,255,0.75)',
                outline: 'none',
              }}
            >
              <option value="">Gênero</option>
              {genres.map((g: Genre) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            {/* Rating */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                background: minRating > 0 ? 'rgba(74,144,217,0.15)' : 'var(--surface-2)',
                border: `1px solid ${minRating > 0 ? 'rgba(74,144,217,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: 'rgba(255,255,255,0.75)',
                outline: 'none',
              }}
            >
              <option value={0}>Nota mínima</option>
              <option value={6}>6+</option>
              <option value={7}>7+</option>
              <option value={8}>8+</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                background: sortBy !== 'popularity.desc' ? 'rgba(74,144,217,0.15)' : 'var(--surface-2)',
                border: `1px solid ${sortBy !== 'popularity.desc' ? 'rgba(74,144,217,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: 'rgba(255,255,255,0.75)',
                outline: 'none',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Recent searches — shown when input is empty */}
      {!query && searchHistory.length > 0 && (
        <div style={{ maxWidth: 640, margin: '0 auto 40px' }}>
          <h3 style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock className="w-3.5 h-3.5" /> Buscas recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term) => (
              <div
                key={term}
                className="flex items-center gap-1.5"
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onClick={() => setQuery(term)}
              >
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{term}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeHistory(term); }}
                  style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', padding: 2 }}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && filteredMovies.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
            {filteredMovies.length} resultado{filteredMovies.length !== 1 ? 's' : ''} para "{debouncedQuery}"
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12,
            }}
          >
            {filteredMovies.map((movie) => (
              <MovieCard
                key={`${movie.media_type}-${movie.id}`}
                movie={movie}
                size="lg"
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
