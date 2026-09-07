import { useState, useEffect, useCallback, useRef } from 'react';
import type { Movie } from '../types/movie';
import * as movieService from '../services/movieService';
const loaders = {
  trending: () => movieService.getTrending(),
  popular: () => movieService.getPopular(),
  series: () => movieService.getPopularSeries(),
  trendingSeries: () => movieService.getTrendingSeries(),
  nowPlaying: () => movieService.getNowPlaying(),
  topRated: () => movieService.getTopRated(),
  actionMovies: () => movieService.getMoviesByGenre(28),
  comedyMovies: () => movieService.getMoviesByGenre(35),
};
type Section = keyof typeof loaders;
const keys = Object.keys(loaders) as Section[];
const empty: Record<Section, Movie[]> = { trending: [], popular: [], series: [], trendingSeries: [], nowPlaying: [], topRated: [], actionMovies: [], comedyMovies: [] };
export function useHomeMovies() {
  const [data, setData] = useState(empty);
  const [pending, setPending] = useState<Section[]>(keys);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const fetchAll = useCallback(async () => {
    const current = ++generation.current;
    setPending(keys); setError(null);
    const results = await Promise.allSettled(keys.map(async key => {
      try {
        const response = await loaders[key]();
        const items: Movie[] = Array.isArray(response) ? response : response.results || [];
        if (current === generation.current) setData(previous => ({ ...previous, [key]: items }));
        return items;
      } finally { if (current === generation.current) setPending(previous => previous.filter(item => item !== key)); }
    }));
    if (current !== generation.current) return;
    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length) setError(failed.length === keys.length ? 'Não conseguimos atualizar o catálogo agora.' : 'Algumas seleções não puderam ser atualizadas.');
  }, []);
  useEffect(() => { fetchAll(); return () => { generation.current++; }; }, [fetchAll]);
  return { ...data, loading: pending.length > 0, pending, error, refetch: fetchAll };
}

export function useMovieSearch(query: string, page = 1, type: 'all' | 'movie' | 'tv' = 'all', retry = 0) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setMovies([]); setLoading(false); setError(null); setTotalPages(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const request = type === 'movie' ? movieService.searchMovies(query, page) : type === 'tv' ? movieService.searchSeries(query, page) : movieService.searchMulti(query, page);
    request.then((res) => {
      if (cancelled) return;
      const results = Array.isArray(res) ? res : res.results || [];
      setMovies(results);
      setTotalPages(res.total_pages || 1);
      setLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setError(err.message || 'Erro na busca');
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [query, page, type, retry]);

  return { movies, totalPages, loading, error };
}
