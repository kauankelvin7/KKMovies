import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getTrending } from '../services/movieService';
import { Artwork } from '../components/Artwork';
import { SkeletonCard } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import type { Movie } from '../types/movie';

export default function Top10Page() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    document.title = 'Top 10 da semana — KKMovies';
    setLoading(true); setError(null);
    getTrending().then(data => { if (!cancelled) setMovies(data.results.slice(0, 10)); })
      .catch(() => { if (!cancelled) setError('Não conseguimos carregar os destaques da semana.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retry]);
  if (error) return <ErrorMessage message={error} onRetry={() => setRetry(value => value + 1)}/>;
  return <main className="ranking-page section-container">
    <div className="ranking-heading"><div><p className="eyebrow">EM ALTA NO CATÁLOGO</p><h1>TOP <span>10</span></h1><p>Os filmes em destaque nesta semana.</p></div><Link className="text-link" to="/filmes">Todos os filmes <ArrowUpRight size={17}/></Link></div>
    {loading ? <div className="catalog-grid">{Array.from({ length: 10 }, (_, index) => <SkeletonCard key={index}/>)}</div> : <div className="ranking-grid">{movies.map((movie, index) => <Link className="ranking-card" key={movie.id} to={`/filme/${movie.id}`} aria-label={`${index + 1}º lugar: ${movie.title}`}>
      <div className="ranking-art"><span className="ranking-number" aria-hidden="true">{index + 1}</span><Artwork paths={[movie.poster_path]} title={movie.title} className="ranking-poster"/><span className="ranking-open"><ArrowUpRight size={20}/></span></div>
      <div className="ranking-caption"><h2>{movie.title}</h2><p>{movie.release_date?.slice(0,4)}{movie.vote_average > 0 ? ` · ★ ${movie.vote_average.toFixed(1)}` : ''}</p></div>
    </Link>)}</div>}
    {!loading && !movies.length && <div className="collection-empty"><p>Não há destaques disponíveis agora.</p><Link className="glass-button" to="/explorar">Explorar catálogo</Link></div>}
  </main>;
}
