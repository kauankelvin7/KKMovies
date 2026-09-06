import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Clapperboard, Sparkles } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { HeroBanner } from '../components/HeroBanner';
import { ContentCarousel } from '../components/ContentCarousel';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import * as movieService from '../services/movieService';
import type { Movie } from '../types/movie';

const FilmesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const fetchMovies = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError(null);
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await movieService.getPopular(pageNum);
      const results = Array.isArray(res) ? res : res.results || [];
      setMovies(previous => pageNum === 1 ? results : [...previous, ...results.filter(item => !previous.some(saved => saved.id === item.id))]);
      setTotalPages(res.total_pages || 1);
      setPage(pageNum);
    } catch (requestError: any) {
      setError(requestError.message || 'Não foi possível carregar os filmes.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setHighlightsLoading(true);
    Promise.allSettled([
      movieService.getNowPlaying(),
      movieService.getTopRated(),
      movieService.getUpcoming(),
    ]).then(([nowResult, ratedResult, upcomingResult]) => {
      if (cancelled) return;
      const read = (result: PromiseSettledResult<any>) => result.status === 'fulfilled'
        ? (Array.isArray(result.value) ? result.value : result.value?.results || [])
        : [];
      setNowPlaying(read(nowResult));
      setTopRated(read(ratedResult));
      setUpcoming(read(upcomingResult));
    }).finally(() => { if (!cancelled) setHighlightsLoading(false); });
    return () => { cancelled = true; };
  }, [retry]);

  useEffect(() => {
    fetchMovies(1);
    document.title = 'Filmes — KKMovies';
    return () => { document.title = 'KKMovies — Seu cinema, do seu jeito'; };
  }, [fetchMovies, retry]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !error && !loadingRef.current && page < totalPages) fetchMovies(page + 1);
    }, { rootMargin: '240px 0px', threshold: 0.05 });
    const element = observerRef.current;
    if (element) observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, [page, totalPages, fetchMovies, error]);

  const retryAll = () => setRetry(value => value + 1);
  const featured = nowPlaying.length ? nowPlaying : movies;

  if (error && movies.length === 0 && !featured.length) return <ErrorMessage message={error} onRetry={retryAll} />;

  return (
    <main className="movies-page page-enter">
      <HeroBanner movies={featured} loading={loading || highlightsLoading} />

      <section className="movies-index section-container" aria-labelledby="movies-index-title">
        <div>
          <p className="eyebrow"><Sparkles size={13}/> CATÁLOGO DE CINEMA</p>
          <h2 id="movies-index-title">Filmes para todos os momentos</h2>
          <p>Descubra lançamentos, títulos premiados e os favoritos do público em uma seleção atualizada.</p>
        </div>
        <div className="movies-index-actions">
          <a href="#catalogo"><ArrowDown size={16}/> Ver catálogo</a>
          <Link to="/explorar?type=movie">Filtrar filmes <ArrowUpRight size={15}/></Link>
        </div>
      </section>

      <div className="movies-curation">
        <ContentCarousel title="Em cartaz agora" movies={nowPlaying} loading={highlightsLoading} landscape />
        <ContentCarousel title="Mais bem avaliados" movies={topRated} loading={highlightsLoading} />
        <ContentCarousel title="Próximos lançamentos" movies={upcoming} loading={highlightsLoading} landscape />
      </div>

      <section id="catalogo" className="movies-catalog section-container" aria-labelledby="catalog-title">
        <header className="movies-catalog-heading">
          <div>
            <p className="eyebrow"><Clapperboard size={13}/> TODOS OS FILMES</p>
            <h2 id="catalog-title">Populares no catálogo</h2>
          </div>
          {!loading && <span>{movies.length} títulos carregados</span>}
        </header>

        {loading ? <SkeletonGrid count={12} /> : (
          <div className="catalog-grid">
            {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
          </div>
        )}

        {error && movies.length > 0 && <div className="catalog-notice" role="alert"><span>{error}</span><button onClick={retryAll}>Tentar novamente</button></div>}
        {!loading && page < totalPages && <div className="load-more-row"><button className="glass-button" disabled={loadingMore} onClick={() => fetchMovies(page + 1)}>{loadingMore ? 'Carregando…' : 'Carregar mais filmes'}</button></div>}
        <div ref={observerRef} className="catalog-sentinel" aria-hidden="true" />
      </section>
    </main>
  );
};

export default FilmesPage;
