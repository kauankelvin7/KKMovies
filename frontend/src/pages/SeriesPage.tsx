import React, { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import { ContentCarousel } from '../components/ContentCarousel';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import * as movieService from '../services/movieService';
import { SkeletonRow } from '../components/ui/Skeleton';
import type { Movie } from '../types/movie';

const SeriesPage: React.FC = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Séries — KauanFlix';
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [trendingRes, popularRes] = await Promise.allSettled([
          movieService.getTrendingSeries(),
          movieService.getPopularSeries(),
        ]);
        if (cancelled) return;

        const extract = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : r.value?.results || []) : [];

        const ensureTV = (items: Movie[]) => items.map((m) => ({ ...m, media_type: m.media_type || 'tv' }));

        setTrending(ensureTV(extract(trendingRes)));
        setPopular(ensureTV(extract(popularRes)));
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      document.title = 'KauanFlix — Seu cinema, do seu jeito';
    };
  }, []);

  if (error && trending.length === 0) {
    return <ErrorMessage message={error} />;
  }

  return (
    <main className="min-h-screen pt-24">
      <div className="section-container mb-6">
        <h1 className="section-title flex items-center gap-2">
          <Tv className="w-6 h-6 text-kf-accent" />
          Séries
        </h1>
      </div>

      {loading ? (
        <div className="section-container"><SkeletonRow count={12} /></div>
      ) : (
        <div className="space-y-2">
          <ContentCarousel title="Em Alta" movies={trending} loading={loading} />
          <ContentCarousel title="Populares" movies={popular} loading={loading} />
        </div>
      )}
    </main>
  );
};

export default SeriesPage;
