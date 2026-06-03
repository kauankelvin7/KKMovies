/* KauanFlix — Home Page v4 */
import React, { useMemo } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ContentCarousel } from '../components/ContentCarousel';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import { useHomeMovies } from '../hooks/useMovies';
import type { Movie } from '../types/movie';
import { historyService } from '../services/storageService';

/* Convert history items to Movie shapes for the carousel */
function historyToMovies(): Movie[] {
  return historyService.getRecent(20).map((h) => ({
    id: h.id,
    title: h.title,
    overview: '',
    poster_path: h.posterPath,
    backdrop_path: null,
    release_date: '',
    vote_average: 0,
    vote_count: 0,
    popularity: 0,
    adult: false,
    original_language: 'pt',
    media_type: h.type,
  }));
}

const HomePage: React.FC = () => {
  const {
    trending, popular, topRated, upcoming, nowPlaying,
    actionMovies, comedyMovies, dramaMovies, horrorMovies,
    loading, error, refetch,
  } = useHomeMovies();

  const continueWatching = useMemo(() => historyToMovies(), []);

  if (error && trending.length === 0) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  return (
    <main className="min-h-screen">
      {/* Hero Banner — 100vh */}
      <HeroBanner movies={trending} loading={loading} />

      {/* Carousels — overlap with banner bottom */}
      <div className="relative z-10" style={{ marginTop: -60 }}>

        {/* 1. Continue Assistindo */}
        {continueWatching.length > 0 && (
          <ContentCarousel
            title="Continue Assistindo"
            movies={continueWatching}
            viewAllLink="/explorar"
          />
        )}

        {/* 2. Em Alta Hoje */}
        <ContentCarousel
          title="Em Alta Hoje"
          movies={(trending || []).slice(0, 10)}
          loading={loading}
          ranked
          viewAllLink="/top10"
        />

        {/* 3. Populares */}
        <ContentCarousel
          title="Populares"
          movies={popular}
          loading={loading}
        />

        {/* 4. Lançamentos */}
        <ContentCarousel
          title="Lançamentos Recentes"
          movies={upcoming}
          loading={loading}
        />

        {/* 5. Em Cartaz */}
        <ContentCarousel
          title="Em Cartaz"
          movies={nowPlaying}
          loading={loading}
        />

        {/* 6. Mais Bem Avaliados */}
        <ContentCarousel
          title="Mais Bem Avaliados"
          movies={topRated}
          loading={loading}
        />

        {/* Genre carousels */}
        <ContentCarousel
          title="Ação"
          movies={actionMovies}
          loading={loading}
        />

        <ContentCarousel
          title="Comédia"
          movies={comedyMovies}
          loading={loading}
        />

        <ContentCarousel
          title="Drama"
          movies={dramaMovies}
          loading={loading}
        />

        <ContentCarousel
          title="Terror"
          movies={horrorMovies}
          loading={loading}
        />
      </div>
    </main>
  );
};

export default HomePage;
