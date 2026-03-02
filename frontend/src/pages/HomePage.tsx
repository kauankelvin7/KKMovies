/* KauanFlix — Home Page */
import React, { useMemo } from 'react';
import { Flame, Star, Clock, CheckCircle, Clapperboard, Trophy, Swords, Laugh, Drama, Ghost } from 'lucide-react';
import { HeroBanner } from '../components/HeroBanner';
import { ContentCarousel } from '../components/ContentCarousel';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import { useHomeMovies } from '../hooks/useMovies';
import type { WatchProgress, Movie } from '../types/movie';

/* Build a progress map for "Continue Assistindo" */
function buildProgressMap(items: WatchProgress[]): Map<number, WatchProgress> {
  return new Map(items.map((w) => [w.movieId, w]));
}

/* Convert WatchProgress to Movie shape for carousel display */
function progressToMovies(items: WatchProgress[]): Movie[] {
  return items.map((w) => ({
    id: w.movieId,
    title: w.episodeInfo
      ? `${w.title} · S${String(w.episodeInfo.season).padStart(2, '0')}E${String(w.episodeInfo.episode).padStart(2, '0')}`
      : w.title,
    overview: '',
    poster_path: w.posterPath,
    // For series episodes, prefer still_path as backdrop for landscape cards
    backdrop_path: (w.episodeInfo?.still_path) || w.backdropPath,
    release_date: '',
    vote_average: 0,
    vote_count: 0,
    popularity: 0,
    adult: false,
    original_language: 'pt',
    media_type: w.media_type,
  }));
}

const HomePage: React.FC = () => {
  const {
    trending, popular, topRated, upcoming, nowPlaying,
    actionMovies, comedyMovies, dramaMovies, horrorMovies,
    inProgress, completed,
    loading, error, refetch,
  } = useHomeMovies();

  const progressMap = useMemo(() => buildProgressMap(inProgress), [inProgress]);
  const inProgressMovies = useMemo(() => progressToMovies(inProgress), [inProgress]);
  const completedMovies = useMemo(() => progressToMovies(completed), [completed]);

  if (error && trending.length === 0) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  return (
    <main className="min-h-screen">
      {/* Hero Banner */}
      <HeroBanner movies={trending} loading={loading} />

      <div className="relative z-10 -mt-16 space-y-0">
        {/* Continue Assistindo */}
        {inProgressMovies.length > 0 && (
          <ContentCarousel
            title="Continue Assistindo"
            icon={<Clock className="w-5 h-5 text-kf-info" />}
            movies={inProgressMovies}
            landscape
            progressMap={progressMap}
          />
        )}

        {/* Top 10 Brasil */}
        <ContentCarousel
          title="Top 10 no Brasil"
          icon={<Flame className="w-5 h-5 text-red-500" />}
          movies={(trending || []).slice(0, 10)}
          loading={loading}
          ranked
        />

        {/* Populares */}
        <ContentCarousel
          title="Populares"
          icon={<Star className="w-5 h-5 text-kf-yellow" />}
          movies={popular}
          loading={loading}
        />

        {/* Lançamentos */}
        <ContentCarousel
          title="Lançamentos Recentes"
          icon={<Clapperboard className="w-5 h-5 text-kf-success" />}
          movies={upcoming}
          loading={loading}
        />

        {/* Em Cartaz */}
        <ContentCarousel
          title="Em Cartaz"
          movies={nowPlaying}
          loading={loading}
        />

        {/* Mais Bem Avaliados */}
        <ContentCarousel
          title="Mais Bem Avaliados"
          icon={<Trophy className="w-5 h-5 text-kf-yellow" />}
          movies={topRated}
          loading={loading}
        />

        {/* Gêneros */}
        <ContentCarousel
          title="Ação"
          icon={<Swords className="w-5 h-5 text-red-400" />}
          movies={actionMovies}
          loading={loading}
        />

        <ContentCarousel
          title="Comédia"
          icon={<Laugh className="w-5 h-5 text-yellow-400" />}
          movies={comedyMovies}
          loading={loading}
        />

        <ContentCarousel
          title="Drama"
          icon={<Drama className="w-5 h-5 text-blue-400" />}
          movies={dramaMovies}
          loading={loading}
        />

        <ContentCarousel
          title="Terror"
          icon={<Ghost className="w-5 h-5 text-green-400" />}
          movies={horrorMovies}
          loading={loading}
        />

        {/* Já Assistidos */}
        {completedMovies.length > 0 && (
          <ContentCarousel
            title="Já Assistidos"
            icon={<CheckCircle className="w-5 h-5 text-kf-success" />}
            movies={completedMovies}
          />
        )}
      </div>
    </main>
  );
};

export default HomePage;
