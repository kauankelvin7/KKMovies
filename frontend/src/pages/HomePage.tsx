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
    <main className="min-h-screen bg-[var(--surface-0)] pb-20 sm:pb-28 page-enter">

      {/* Hero Banner — 100vh com gradiente cinematográfico nativo */}
      <HeroBanner movies={trending} loading={loading} />

      {/* 
        Carousels Container
        - Overlap responsivo sobre o Hero (-mt-24 no mobile, -mt-32 no desktop)
        - bg-gradient garante uma transição suave da arte do Hero para o fundo escuro
      */}
      <div className="relative z-10 mt-4 sm:mt-8 flex flex-col gap-6 sm:gap-10">

        {/* Layer de transição invisível para suavisar a entrada do primeiro carrossel */}
        <div className="absolute inset-0 top-0 h-40 bg-gradient-to-b from-transparent to-[var(--surface-0)] pointer-events-none -z-10" />

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