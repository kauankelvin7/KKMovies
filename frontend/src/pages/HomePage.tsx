import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  TrendingUp, 
  Award, 
  Calendar, 
  Film, 
  Tv, 
  Sparkles, 
  Heart,
  History,
  Flame,
  Zap,
  Globe2
} from 'lucide-react';
import movieService from '@/services/movieService';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PlayerModal from '@/components/PlayerModal';
import HeroBanner from '@/components/HeroBanner';
import ContentCarousel from '@/components/ContentCarousel';
import MediaCard from '@/components/MediaCard';
import { watchHistoryService, WatchedItem } from '@/services/watchHistoryService';
import { popupBlocker } from '@/services/popupBlockerService';
import { Movie } from '@/types/movie';
import { useTheme } from '@/App';

const SUPERFLIX_BASE = 'https://superflixapi.bond';

interface Serie {
  id: number;
  name: string;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  overview: string;
  first_air_date: string;
  genre_ids?: number[];
  original_language?: string;
}

interface ContentItem {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: 'movie' | 'series';
}

// Gêneros específicos
const ANIME_GENRE_ID = 16; // Animation

// Helper para filtrar K-Dramas
const isKDrama = (item: Serie) => {
  return item.original_language === 'ko';
};

const HomePage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  // States for movies
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  
  // States for series
  const [popularSeries, setPopularSeries] = useState<Serie[]>([]);
  const [topRatedSeries, setTopRatedSeries] = useState<Serie[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<Serie[]>([]);
  
  // States for anime
  const [animeSeries, setAnimeSeries] = useState<Serie[]>([]);
  const [animeMovies, setAnimeMovies] = useState<Movie[]>([]);
  
  // States for K-Drama/Dorama
  const [kDramas, setKDramas] = useState<Serie[]>([]);
  
  // States for recommendations
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchedItem[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<WatchedItem[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null);
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');

  // Initialize popup blocker
  useEffect(() => {
    popupBlocker.enable();
    return () => {
      // Keep popup blocker active even after unmount
    };
  }, []);

  // Load watch history
  useEffect(() => {
    const loadWatchHistory = () => {
      setContinueWatching(watchHistoryService.getContinueWatching());
      setRecentlyWatched(watchHistoryService.getRecentlyWatched(10));
    };
    
    loadWatchHistory();
    // Update on focus
    window.addEventListener('focus', loadWatchHistory);
    return () => window.removeEventListener('focus', loadWatchHistory);
  }, []);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch movies
        const [popularRes, topRatedRes, nowPlayingRes, upcomingRes] = await Promise.all([
          movieService.getPopular(),
          movieService.getTopRated(),
          movieService.getLatestReleases(),
          movieService.getUpcoming(),
        ]);
        
        setPopularMovies(popularRes.results.slice(0, 20));
        setTopRatedMovies(topRatedRes.results.slice(0, 20));
        setNowPlaying(nowPlayingRes.results.slice(0, 20));
        setUpcomingMovies(upcomingRes.results.slice(0, 20));
        
        // Fetch series
        try {
          const [popularSeriesRes, topRatedSeriesRes, trendingSeriesRes] = await Promise.all([
            api.get('/series/popular'),
            api.get('/series/top-rated'),
            api.get('/series/trending'),
          ]);
          
          const allPopularSeries = popularSeriesRes.data.results || [];
          const allTopRatedSeries = topRatedSeriesRes.data.results || [];
          const allTrendingSeries = trendingSeriesRes.data.results || [];
          
          // Filtrar K-Dramas das séries normais
          setPopularSeries(allPopularSeries.filter((s: Serie) => !isKDrama(s)).slice(0, 20));
          setTopRatedSeries(allTopRatedSeries.filter((s: Serie) => !isKDrama(s)).slice(0, 20));
          setTrendingSeries(allTrendingSeries.filter((s: Serie) => !isKDrama(s)).slice(0, 20));
          
          // Coletar K-Dramas de todas as fontes
          const kDramasList = [
            ...allPopularSeries.filter((s: Serie) => isKDrama(s)),
            ...allTopRatedSeries.filter((s: Serie) => isKDrama(s)),
            ...allTrendingSeries.filter((s: Serie) => isKDrama(s)),
          ];
          
          // Remover duplicados por ID
          const uniqueKDramas = kDramasList.filter((item, index, self) => 
            index === self.findIndex((t) => t.id === item.id)
          );
          
          setKDramas(uniqueKDramas.slice(0, 20));
        } catch (seriesError) {
          console.log('Series API not available:', seriesError);
        }
        
        // Fetch anime (separar por idioma japonês)
        try {
          const [animeSeriesRes, animeMoviesRes] = await Promise.all([
            api.get('/series/discover', { params: { genreId: ANIME_GENRE_ID, language: 'ja' } }),
            movieService.getByGenre(ANIME_GENRE_ID),
          ]);
          
          setAnimeSeries(animeSeriesRes.data.results?.slice(0, 20) || []);
          
          // Filtrar apenas animes japoneses dos filmes
          const japaneseAnimes = (animeMoviesRes.results || []).filter((m: Movie) => 
            m.original_language === 'ja'
          );
          setAnimeMovies(japaneseAnimes.slice(0, 20));
        } catch (animeError) {
          console.log('Anime API not available:', animeError);
        }
        
        // Generate smart recommendations based on watch history
        generateRecommendations();
        
      } catch (err) {
        setError('Falha ao carregar conteúdo. Tente novamente.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Generate smart recommendations with intelligent logic
  const generateRecommendations = useCallback(async () => {
    // Lista de todos os gêneros disponíveis
    const allGenres = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
    
    // Obtém mix inteligente de gêneros (favoritos + hora do dia + descoberta)
    const smartGenres = watchHistoryService.getSmartGenreMix(allGenres);
    const rotationSeed = watchHistoryService.getRotationSeed();
    
    if (smartGenres.length === 0) {
      // Sem gêneros, não faz nada
      return;
    }
    
    try {
      const recommendedItems: ContentItem[] = [];
      
      // Busca conteúdo de cada gênero do mix inteligente (limitado a 3 para performance)
      const genresToFetch = smartGenres.slice(0, 3);
      
      await Promise.all(genresToFetch.map(async (genreId) => {
        try {
          const [movieRecs, seriesRecs] = await Promise.all([
            movieService.getByGenre(genreId, 1),
            api.get('/series/discover', { params: { genreId } }).catch(() => ({ data: { results: [] } })),
          ]);
          
          // Adiciona filmes
          movieRecs.results.slice(0, 4).forEach((movie: Movie) => {
            recommendedItems.push({
              ...movie,
              media_type: 'movie',
            });
          });
          
          // Adiciona séries
          (seriesRecs.data.results || []).slice(0, 4).forEach((serie: Serie) => {
            recommendedItems.push({
              id: serie.id,
              title: serie.name,
              name: serie.name,
              poster_path: serie.poster_path,
              backdrop_path: serie.backdrop_path,
              vote_average: serie.vote_average,
              first_air_date: serie.first_air_date,
              genre_ids: serie.genre_ids,
              media_type: 'series',
            });
          });
        } catch (e) {
          console.log('Error fetching recommendations for genre:', genreId);
        }
      }));
      
      // Remove duplicatas
      const uniqueItems = recommendedItems.filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id && t.media_type === item.media_type)
      );
      
      // Shuffle determinístico baseado no seed de rotação (muda a cada 4 horas)
      const shuffled = watchHistoryService.shuffleWithSeed(uniqueItems, rotationSeed);
      
      // Diversifica para não ter gêneros repetidos seguidos
      const diversified = watchHistoryService.diversifyContent(shuffled);
      
      setRecommendations(diversified.slice(0, 20));
    } catch (err) {
      console.error('Error generating recommendations:', err);
    }
  }, []);

  const openPlayer = useCallback((item: ContentItem, type: 'movie' | 'series' = 'movie') => {
    setCurrentContent(item);
    setContentType(type);
    setPlayerOpen(true);
    
    // Add to watch history
    watchHistoryService.addToHistory({
      id: item.id,
      type,
      title: item.title || item.name || '',
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      genre_ids: item.genre_ids || [],
      progress: 5, // Started watching
    });
    
    // Update local state
    setContinueWatching(watchHistoryService.getContinueWatching());
    setRecentlyWatched(watchHistoryService.getRecentlyWatched(10));
  }, []);

  const getStreamUrl = useCallback((id: number, type: 'movie' | 'series') => {
    if (type === 'series') {
      return `${SUPERFLIX_BASE}/serie/${id}/1/1`;
    }
    return `${SUPERFLIX_BASE}/filme/${id}`;
  }, []);

  // Convert to ContentItem format
  const movieToContent = useCallback((movie: Movie): ContentItem => ({
    ...movie,
    media_type: 'movie',
  }), []);

  const serieToContent = useCallback((serie: Serie): ContentItem => ({
    id: serie.id,
    title: serie.name,
    name: serie.name,
    poster_path: serie.poster_path,
    backdrop_path: serie.backdrop_path,
    vote_average: serie.vote_average,
    overview: serie.overview,
    first_air_date: serie.first_air_date,
    genre_ids: serie.genre_ids,
    media_type: 'series',
  }), []);

  // Hero items - mix of movies and series
  const heroItems = [
    ...nowPlaying.slice(0, 4).map(movieToContent),
    ...trendingSeries.slice(0, 4).map(serieToContent),
  ].sort(() => Math.random() - 0.5).slice(0, 8);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" data-app-element data-app-content>
      {/* Hero Banner */}
      <HeroBanner
        items={heroItems}
        onPlay={(item) => openPlayer(item, item.media_type || 'movie')}
      />

      {error && (
        <div className="px-4 md:px-12 py-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-20 mt-4 sm:mt-8 md:mt-12 pb-8 sm:pb-12 space-y-2 sm:space-y-3 md:space-y-4">
        
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <ContentCarousel
            title="Continuar Assistindo"
            subtitle="De onde você parou"
            icon={<History size={22} />}
            className="animate-fade-slide-up"
          >
            {continueWatching.map((item) => (
              <MediaCard
                key={`continue-${item.id}-${item.type}`}
                {...item}
                title={item.title}
                onPlay={() => openPlayer(item as unknown as ContentItem, item.type)}
                onRemove={(id, type) => {
                  watchHistoryService.removeFromHistory(id, type);
                  setContinueWatching(watchHistoryService.getContinueWatching());
                }}
              />
            ))}
          </ContentCarousel>
        )}

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <ContentCarousel
            title="Para Você"
            subtitle="Baseado no que você assistiu"
            icon={<Sparkles size={22} className="text-purple-400" />}
            className="animate-fade-slide-up stagger-1"
          >
            {recommendations.map((item) => (
              <MediaCard
                key={`rec-${item.id}-${item.media_type}`}
                {...item}
                title={item.title || item.name || ''}
                onPlay={() => openPlayer(item, item.media_type || 'movie')}
              />
            ))}
          </ContentCarousel>
        )}

        {/* FILMES Section */}
        <div className="section-divider" />
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4 sm:pt-6 md:pt-8 pb-1">
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Film size={24} className="text-primary-500 sm:w-7 sm:h-7" />
            Filmes
            <span className={`text-xs sm:text-sm font-normal ml-1 sm:ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Os melhores para você</span>
          </h2>
        </div>

        <ContentCarousel
          title="Em Cartaz"
          subtitle="Lançamentos nos cinemas"
          icon={<Clock size={22} className="text-primary-400" />}
          showViewAll
          onViewAll={() => navigate('/filmes')}
        >
          {nowPlaying.map((movie) => (
            <MediaCard
              key={`now-${movie.id}`}
              {...movieToContent(movie)}
              title={movie.title}
              onPlay={() => openPlayer(movieToContent(movie), 'movie')}
            />
          ))}
        </ContentCarousel>

        <ContentCarousel
          title="Populares"
          subtitle="Os mais assistidos"
          icon={<TrendingUp size={22} className="text-orange-400" />}
        >
          {popularMovies.map((movie) => (
            <MediaCard
              key={`pop-${movie.id}`}
              {...movieToContent(movie)}
              title={movie.title}
              onPlay={() => openPlayer(movieToContent(movie), 'movie')}
            />
          ))}
        </ContentCarousel>

        <ContentCarousel
          title="Mais Bem Avaliados"
          subtitle="Nota acima de 8"
          icon={<Award size={22} className="text-amber-400" />}
        >
          {topRatedMovies.map((movie) => (
            <MediaCard
              key={`top-${movie.id}`}
              {...movieToContent(movie)}
              title={movie.title}
              onPlay={() => openPlayer(movieToContent(movie), 'movie')}
            />
          ))}
        </ContentCarousel>

        <ContentCarousel
          title="Em Breve"
          subtitle="Próximos lançamentos"
          icon={<Calendar size={22} className="text-rose-400" />}
        >
          {upcomingMovies.filter((movie) => {
            // Filtrar apenas filmes com data de lançamento futura
            if (!movie.release_date) return false;
            const releaseDate = new Date(movie.release_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return releaseDate > today;
          }).map((movie) => (
            <MediaCard
              key={`up-${movie.id}`}
              {...movieToContent(movie)}
              title={movie.title}
              onPlay={() => openPlayer(movieToContent(movie), 'movie')}
              isUpcoming={true}
            />
          ))}
        </ContentCarousel>

        {/* SÉRIES Section */}
        {popularSeries.length > 0 && (
          <>
            <div className="section-divider" />
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4 sm:pt-6 md:pt-8 pb-1">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Tv size={24} className="text-blue-500 sm:w-7 sm:h-7" />
                Séries
                <span className={`text-xs sm:text-sm font-normal ml-1 sm:ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Maratonar agora</span>
              </h2>
            </div>

            <ContentCarousel
              title="Em Alta"
              subtitle="Trending agora"
              icon={<Flame size={22} className="text-red-500" />}
              showViewAll
              onViewAll={() => navigate('/series')}
            >
              {trendingSeries.map((serie) => (
                <MediaCard
                  key={`trend-${serie.id}`}
                  {...serieToContent(serie)}
                  title={serie.name}
                  onPlay={() => openPlayer(serieToContent(serie), 'series')}
                />
              ))}
            </ContentCarousel>

            <ContentCarousel
              title="Populares"
              subtitle="As mais assistidas"
              icon={<Heart size={22} className="text-pink-500" />}
            >
              {popularSeries.map((serie) => (
                <MediaCard
                  key={`popserie-${serie.id}`}
                  {...serieToContent(serie)}
                  title={serie.name}
                  onPlay={() => openPlayer(serieToContent(serie), 'series')}
                />
              ))}
            </ContentCarousel>

            <ContentCarousel
              title="Mais Bem Avaliadas"
              subtitle="Crítica e público aprovam"
              icon={<Award size={22} className="text-amber-400" />}
            >
              {topRatedSeries.map((serie) => (
                <MediaCard
                  key={`topserie-${serie.id}`}
                  {...serieToContent(serie)}
                  title={serie.name}
                  onPlay={() => openPlayer(serieToContent(serie), 'series')}
                />
              ))}
            </ContentCarousel>
          </>
        )}

        {/* ANIMES Section */}
        {(animeSeries.length > 0 || animeMovies.length > 0) && (
          <>
            <div className="section-divider" />
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4 sm:pt-6 md:pt-8 pb-1">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-pink-400 sm:w-6 sm:h-6" />
                </div>
                Animes
                <span className={`text-xs sm:text-sm font-normal ml-1 sm:ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>O melhor do Japão</span>
              </h2>
            </div>

            {animeSeries.length > 0 && (
              <ContentCarousel
                title="Séries de Anime"
                subtitle="Os mais populares"
                icon={<TrendingUp size={22} className="text-pink-400" />}
              >
                {animeSeries.map((serie) => (
                  <MediaCard
                    key={`anime-${serie.id}`}
                    {...serieToContent(serie)}
                    title={serie.name}
                    onPlay={() => openPlayer(serieToContent(serie), 'series')}
                  />
                ))}
              </ContentCarousel>
            )}

            {animeMovies.length > 0 && (
              <ContentCarousel
                title="Filmes de Anime"
                subtitle="Obras-primas japonesas"
                icon={<Award size={22} className="text-purple-400" />}
              >
                {animeMovies.map((movie) => (
                  <MediaCard
                    key={`animemovie-${movie.id}`}
                    {...movieToContent(movie)}
                    title={movie.title}
                    onPlay={() => openPlayer(movieToContent(movie), 'movie')}
                  />
                ))}
              </ContentCarousel>
            )}
          </>
        )}

        {/* DORAMAS Section */}
        {kDramas.length > 0 && (
          <>
            <div className="section-divider" />
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4 sm:pt-6 md:pt-8 pb-1">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Globe2 size={20} className="text-red-400 sm:w-6 sm:h-6" />
                </div>
                Doramas
                <span className={`text-xs sm:text-sm font-normal ml-1 sm:ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>K-Dramas imperdíveis</span>
              </h2>
            </div>

            <ContentCarousel
              title="K-Dramas Populares"
              subtitle="Os favoritos da Coreia"
              icon={<Heart size={22} className="text-red-400" />}
            >
              {kDramas.map((serie) => (
                <MediaCard
                  key={`kdrama-${serie.id}`}
                  {...serieToContent(serie)}
                  title={serie.name}
                  onPlay={() => openPlayer(serieToContent(serie), 'series')}
                />
              ))}
            </ContentCarousel>
          </>
        )}

        {/* Recently Watched */}
        {recentlyWatched.length > 0 && (
          <>
            <div className="section-divider" />
            <ContentCarousel
              title="Assistidos Recentemente"
              subtitle="Seu histórico"
              icon={<History size={22} className="text-gray-400" />}
            >
              {recentlyWatched.map((item) => (
                <MediaCard
                  key={`recent-${item.id}-${item.type}`}
                  {...item}
                  title={item.title}
                  isWatched
                  onPlay={() => openPlayer(item as unknown as ContentItem, item.type)}
                />
              ))}
            </ContentCarousel>
          </>
        )}
      </div>

      {/* Player Modal */}
      <PlayerModal
        isOpen={playerOpen}
        onClose={() => {
          setPlayerOpen(false);
          // Update progress when closing
          if (currentContent) {
            watchHistoryService.updateProgress(
              currentContent.id,
              contentType,
              30 // Simulated progress
            );
            setContinueWatching(watchHistoryService.getContinueWatching());
          }
        }}
        streamUrl={currentContent ? getStreamUrl(currentContent.id, contentType) : ''}
        title={currentContent?.title || currentContent?.name || ''}
      />
    </div>
  );
};

export default memo(HomePage);
