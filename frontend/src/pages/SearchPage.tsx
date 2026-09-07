import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Search, X, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { CatalogCollections } from '../components/CatalogCollections';
import { SkeletonCard } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import { useDebounce } from '../hooks/useDebounce';
import { useMovieSearch } from '../hooks/useMovies';
import { searchHistoryService } from '../services/storageService';

export default function SearchPage() {
  const location = useLocation();
  useEffect(() => {
    if (location.state?.focusSearch) document.querySelector<HTMLInputElement>('input[aria-label="Buscar filmes e séries"]')?.focus();
  }, [location.key, location.state]);
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const rawPage = Number(params.get('page') || 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 && rawPage <= 500 ? rawPage : 1;
  const type = params.get('type') === 'movie' ? 'movie' : params.get('type') === 'tv' ? 'tv' : 'all';
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [sort, setSort] = useState('relevance');
  const [history, setHistory] = useState(() => searchHistoryService.getAll());
  const [retry, setRetry] = useState(0);
  const term = useDebounce(query, 350);
  const { movies, loading, error, totalPages } = useMovieSearch(term, query === term ? page : 1, type, retry);
  const busy = loading || query !== term;
  const updateQuery = (value: string) => setParams(value ? { q: value, type } : { type }, { replace: true });
  useEffect(() => { document.title = query ? `Buscar “${query}” — KKMovies` : 'Buscar — KKMovies'; }, [query]);
  const results = useMemo(() => {
    const items = movies.filter(movie => movie.vote_average >= rating);
    if (sort === 'rating') items.sort((a,b) => b.vote_average - a.vote_average);
    if (sort === 'title') items.sort((a,b) => (a.title || a.name || '').localeCompare(b.title || b.name || '', 'pt-BR'));
    if (sort === 'recent') items.sort((a,b) => (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''));
    return items;
  }, [movies, rating, sort]);
  const saveSearch = () => { if (query.trim()) { searchHistoryService.add(query.trim()); setHistory(searchHistoryService.getAll()); } };
  return <main className="search-page section-container">
    <div className="page-heading"><div><h1>O que você quer assistir?</h1><p>Encontre filmes e séries pelo título.</p></div></div>
    <form className="search-box" role="search" onSubmit={event => { event.preventDefault(); saveSearch(); }}><Search size={23}/><input aria-label="Buscar filmes e séries" placeholder="Digite um título…" value={query} onChange={event => updateQuery(event.target.value)} autoComplete="off" maxLength={200}/>{query && <button type="button" aria-label="Limpar busca" onClick={() => updateQuery('')}><X size={19}/></button>}<button type="submit" className="search-submit">Buscar</button></form>
    <div className="search-controls"><div className="type-tabs">{[{ value: 'all', label: 'Tudo' }, { value: 'movie', label: 'Filmes' }, { value: 'tv', label: 'Séries' }].map(item => <button key={item.value} className={type === item.value ? 'active' : ''} aria-pressed={type === item.value} onClick={() => setParams({ q: query, type: item.value }, { replace: true })}>{item.label}</button>)}</div><button className="text-link" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(value => !value)}><SlidersHorizontal size={17}/> Filtros</button></div>
    {filtersOpen && <div className="search-filters"><label>Nota mínima<select value={rating} onChange={event => setRating(Number(event.target.value))}><option value={0}>Todas as notas</option><option value={6}>6 ou mais</option><option value={7}>7 ou mais</option><option value={8}>8 ou mais</option></select></label><label>Ordenar esta página<select value={sort} onChange={event => setSort(event.target.value)}><option value="relevance">Relevância</option><option value="rating">Melhor avaliação</option><option value="recent">Mais recentes</option><option value="title">Título A–Z</option></select></label><button className="text-link" onClick={() => { setRating(0); setSort('relevance'); }}>Restaurar filtros</button></div>}
    {!query.trim() ? <div className="search-start">{history.length > 0 && <section><h2>Buscas recentes</h2><div className="recent-searches">{history.map(value => <div key={value}><button onClick={() => updateQuery(value)}>{value}</button><button aria-label={`Remover busca ${value}`} onClick={() => { searchHistoryService.remove(value); setHistory(searchHistoryService.getAll()); }}><X size={14}/></button></div>)}</div></section>}<div className="search-destinations">{[{ title:'Filmes', text:'Explore o catálogo de cinema.', to:'/filmes' }, { title:'Séries', text:'Encontre sua próxima temporada.', to:'/series' }, { title:'Top 10', text:'Veja os destaques da semana.', to:'/top10' }].map(item => <Link key={item.to} to={item.to}><div><h2>{item.title}</h2><p>{item.text}</p></div><ArrowUpRight size={24}/></Link>)}</div></div> : busy ? <div aria-label="Buscando títulos" aria-busy="true" className="catalog-grid">{Array.from({ length: 12 }, (_, index) => <SkeletonCard key={index}/>)}</div> : error ? <ErrorMessage message={error} onRetry={() => setRetry(value => value + 1)}/> : <><div className="search-result-count" role="status">{results.length} {results.length === 1 ? 'título nesta página' : 'títulos nesta página'} para “{term}”</div>{results.length ? <div className="catalog-grid" onClickCapture={saveSearch}>{results.map(movie => <MovieCard key={`${movie.media_type}-${movie.id}`} movie={movie}/>)}</div> : <div className="collection-empty"><Search size={30}/><h2>Nenhum título nesta página</h2><p>{rating ? 'Reduza a nota mínima ou consulte a próxima página.' : 'Confira o nome ou tente outro título. Você também pode consultar a próxima página.'}</p>{rating > 0 && <button className="glass-button" onClick={() => setRating(0)}>Remover filtro de nota</button>}</div>}{totalPages > 1 && <nav className="search-pagination" aria-label="Páginas da busca"><button className="glass-button" disabled={page <= 1} onClick={() => setParams({ q: query, type, page: String(page - 1) })}>Anterior</button><span>Página {page} de {totalPages}</span><button className="glass-button" disabled={page >= totalPages} onClick={() => setParams({ q: query, type, page: String(page + 1) })}>Próxima</button></nav>}</>}
    {!query.trim() && <CatalogCollections type={type === 'tv' ? 'tv' : 'movie'} />}
  </main>;
}
