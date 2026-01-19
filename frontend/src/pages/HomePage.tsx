import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  TrendingUp, 
  Film, 
  Tv, 
  Sparkles, 
  Flame
} from 'lucide-react';
import movieService from '@/services/movieService';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PlayerModal from '@/components/PlayerModal';
import HeroBanner from '@/components/HeroBanner';
import ContentCarousel from '@/components/ContentCarousel';
import MediaCard from '@/components/MediaCard';
import { watchHistoryService } from '@/services/watchHistoryService';
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

const HomePage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  // States for movies - REDUZIDO: apenas 2 categorias principais
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  
  // States for series - REDUZIDO: apenas 1 categoria
  const [trendingSeries, setTrendingSeries] = useState<Serie[]>([]);
  
  // States for recommendations - mantido para personalização
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  
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

  // Fetch all data - OTIMIZADO: apenas 3 requisições em vez de 10+
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch apenas os essenciais - REDUZIDO de 8 para 3 requisições
        const [popularRes, nowPlayingRes, trendingSeriesRes] = await Promise.all([
          movieService.getPopular(),
          movieService.getLatestReleases(),
          api.get('/series/trending').catch(() => ({ data: { results: [] } })),
        ]);
        
        // Limitar a 12 itens por categoria para reduzir memória
        setPopularMovies(popularRes.results.slice(0, 12));
        setNowPlaying(nowPlayingRes.results.slice(0, 12));
        setTrendingSeries(trendingSeriesRes.data.results?.slice(0, 12) || []);
        
        // Generate smart recommendations (mais leve)
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

  // Generate smart recommendations with intelligent logic - OTIMIZADO
  const generateRecommendations = useCallback(async () => {
    // Lista reduzida de gêneros populares
    const popularGenres = [28, 12, 35, 878, 53]; // Ação, Aventura, Comédia, Sci-Fi, Thriller
    
    // Obtém mix inteligente de gêneros (apenas 2 para reduzir carga)
    const smartGenres = watchHistoryService.getSmartGenreMix(popularGenres).slice(0, 2);
    const rotationSeed = watchHistoryService.getRotationSeed();
    
    if (smartGenres.length === 0) {
      // Sem histórico, usa gêneros padrão
      smartGenres.push(28, 35); // Ação e Comédia
    }
    
    try {
      const recommendedItems: ContentItem[] = [];
      
      // Busca apenas 1 gênero para otimizar
      const genreId = smartGenres[0];
      
      try {
        const movieRecs = await movieService.getByGenre(genreId, 1);
        
        // Adiciona apenas 8 filmes (reduzido de 12+)
        movieRecs.results.slice(0, 8).forEach((movie: Movie) => {
          recommendedItems.push({
            ...movie,
            media_type: 'movie',
          });
        });
      } catch (e) {
        console.log('Error fetching recommendations');
      }
      
      // Remove duplicatas
      const uniqueItems = recommendedItems.filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      );
      
      // Shuffle determinístico
      const shuffled = watchHistoryService.shuffleWithSeed(uniqueItems, rotationSeed);
      
      setRecommendations(shuffled.slice(0, 12)); // Reduzido de 20 para 12
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

  // Hero items - mix otimizado (apenas 5 itens)
  const heroItems = [
    ...nowPlaying.slice(0, 3).map(movieToContent),
    ...trendingSeries.slice(0, 2).map(serieToContent),
  ];

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

      {/* Main Content - REDUZIDO: 4 carrosséis em vez de 13+ */}
      <div className="relative z-20 mt-4 sm:mt-8 md:mt-12 pb-8 sm:pb-12 space-y-2 sm:space-y-3 md:space-y-4">

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

        {/* FILMES - REDUZIDO para 2 categorias */}
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

        {/* SÉRIES - REDUZIDO para 1 categoria */}
        {trendingSeries.length > 0 && (
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
          }
        }}
        streamUrl={currentContent ? getStreamUrl(currentContent.id, contentType) : ''}
        title={currentContent?.title || currentContent?.name || ''}
      />
    </div>
  );
};

export default memo(HomePage);
