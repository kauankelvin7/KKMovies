/* KauanFlix — useMovies hook
   Fetches and manages movie data for the homepage sections.
   Uses sequential batch loading to avoid 429 rate limiting. */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Movie, WatchProgress } from '../types/movie';
import * as movieService from '../services/movieService';
import { watchHistoryService } from '../services/watchHistoryService';
import { useAppStore } from '../store/useAppStore';

interface HomeData {
  trending: Movie[];
  popular: Movie[];
  topRated: Movie[];
  upcoming: Movie[];
  nowPlaying: Movie[];
  actionMovies: Movie[];
  comedyMovies: Movie[];
  dramaMovies: Movie[];
  horrorMovies: Movie[];
  inProgress: WatchProgress[];
  completed: WatchProgress[];
  loading: boolean;
  error: string | null;
}

const BATCH_DELAY = 200; // ms between batches

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useHomeMovies() {
  const [data, setData] = useState<HomeData>({
    trending: [], popular: [], topRated: [], upcoming: [], nowPlaying: [],
    actionMovies: [], comedyMovies: [], dramaMovies: [], horrorMovies: [],
    inProgress: [], completed: [],
    loading: true, error: null,
  });
  const setGenres = useAppStore((s) => s.setGenres);
  const abortRef = useRef(false);

  const fetchAll = useCallback(async () => {
    abortRef.current = false;
    setData((d) => ({ ...d, loading: true, error: null }));

    const extract = (res: PromiseSettledResult<any>) =>
      res.status === 'fulfilled'
        ? (Array.isArray(res.value) ? res.value : res.value?.results || [])
        : [];

    try {
      // Load local data immediately (no API call)
      setData((d) => ({
        ...d,
        inProgress: watchHistoryService.getInProgress(),
        completed: watchHistoryService.getCompleted(),
      }));

      // Batch 1: Essential above-the-fold content (2 requests)
      const [trendingRes, genresRes] = await Promise.allSettled([
        movieService.getTrending(),
        movieService.getGenres(),
      ]);
      if (abortRef.current) return;

      if (genresRes.status === 'fulfilled') {
        const gVal = genresRes.value as any;
        setGenres(Array.isArray(gVal) ? gVal : gVal?.genres || []);
      }
      setData((d) => ({ ...d, trending: extract(trendingRes) }));

      await delay(BATCH_DELAY);
      if (abortRef.current) return;

      // Batch 2: Popular + Top Rated (2 requests)
      const [popularRes, topRatedRes] = await Promise.allSettled([
        movieService.getPopular(),
        movieService.getTopRated(),
      ]);
      if (abortRef.current) return;
      setData((d) => ({ ...d, popular: extract(popularRes), topRated: extract(topRatedRes) }));

      await delay(BATCH_DELAY);
      if (abortRef.current) return;

      // Batch 3: Now Playing + Upcoming (2 requests)
      const [nowPlayingRes, upcomingRes] = await Promise.allSettled([
        movieService.getNowPlaying(),
        movieService.getUpcoming(),
      ]);
      if (abortRef.current) return;
      setData((d) => ({ ...d, nowPlaying: extract(nowPlayingRes), upcoming: extract(upcomingRes) }));

      await delay(BATCH_DELAY);
      if (abortRef.current) return;

      // Batch 4: Genre carousels (2 requests)
      const [actionRes, comedyRes] = await Promise.allSettled([
        movieService.getMoviesByGenre(28),
        movieService.getMoviesByGenre(35),
      ]);
      if (abortRef.current) return;
      setData((d) => ({ ...d, actionMovies: extract(actionRes), comedyMovies: extract(comedyRes) }));

      await delay(BATCH_DELAY);
      if (abortRef.current) return;

      // Batch 5: More genre carousels (2 requests)
      const [dramaRes, horrorRes] = await Promise.allSettled([
        movieService.getMoviesByGenre(18),
        movieService.getMoviesByGenre(27),
      ]);
      if (abortRef.current) return;
      setData((d) => ({
        ...d,
        dramaMovies: extract(dramaRes),
        horrorMovies: extract(horrorRes),
        loading: false,
      }));

    } catch (err: any) {
      if (!abortRef.current) {
        setData((d) => ({ ...d, loading: false, error: err.message || 'Erro ao carregar filmes' }));
      }
    }
  }, [setGenres]);

  useEffect(() => {
    fetchAll();
    return () => { abortRef.current = true; };
  }, [fetchAll]);

  return { ...data, refetch: fetchAll };
}

export function useMovieSearch(query: string, page = 1) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setMovies([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    movieService.searchMulti(query, page).then((res) => {
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
  }, [query, page]);

  return { movies, totalPages, loading, error };
}
