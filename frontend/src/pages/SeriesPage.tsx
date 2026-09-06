import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv } from 'lucide-react';
import { ContentCarousel } from '../components/ContentCarousel';
import { HeroBanner } from '../components/HeroBanner';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import * as movieService from '../services/movieService';
import { SkeletonRow } from '../components/ui/Skeleton';
import type { Movie } from '../types/movie';

const SeriesPage: React.FC = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [rated, setRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Séries — KKMovies';
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [trendingRes, popularRes, ratedRes] = await Promise.allSettled([
          movieService.getTrendingSeries(),
          movieService.getPopularSeries(),
          movieService.discoverMovies({ type: 'tv', sort_by: 'vote_average.desc', 'vote_average.gte': 7 }),
        ]);
        if (cancelled) return;
        if (trendingRes.status === 'rejected' && popularRes.status === 'rejected' && ratedRes.status === 'rejected') throw trendingRes.reason;

        const extract = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : r.value?.results || []) : [];

        const ensureTV = (items: Movie[]) => items.map((m) => ({ ...m, media_type: m.media_type || 'tv' }));

        setTrending(ensureTV(extract(trendingRes)));
        setPopular(ensureTV(extract(popularRes)));
        setRated(ensureTV(extract(ratedRes)));
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      document.title = 'KKMovies — Seu cinema, do seu jeito';
    };
  }, [retry]);

  if (error && trending.length === 0) {
    return <ErrorMessage message={error} onRetry={() => setRetry(value => value + 1)} />;
  }

  return (
    <main className="min-h-screen pb-24">
      <HeroBanner movies={trending.length ? trending : popular.length ? popular : rated} loading={loading} />
      <section className="movies-index section-container"><div><p className="eyebrow">TEMPORADAS E EPISÓDIOS</p><h2>O universo das séries</h2><p>Os destaques da semana e as séries mais bem avaliadas, com temporadas e episódios organizados em cada título.</p></div><div className="movies-index-actions"><Link to="/explorar?type=tv">Todas as séries</Link><Link to="/buscar?type=tv">Buscar uma série</Link></div></section>

      {loading ? (
        <div className="section-container"><SkeletonRow count={12} /></div>
      ) : (
        <div className="movies-curation">
          <ContentCarousel title="Séries em alta" movies={trending} loading={loading} landscape />
          <ContentCarousel title="Favoritas do público" movies={popular} loading={loading} />
          <ContentCarousel title="Mais bem avaliadas" movies={rated} loading={loading} />
        </div>
      )}
    </main>
  );
};

export default SeriesPage;
