import { useEffect, useState } from 'react';
import { Clock, TrendingUp, Award, Calendar, Film } from 'lucide-react';
import movieService from '@/services/movieService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PlayerModal from '@/components/PlayerModal';
import ContentCarousel from '@/components/ContentCarousel';
import MediaCard from '@/components/MediaCard';
import { watchHistoryService } from '@/services/watchHistoryService';
import { Movie } from '@/types/movie';
import { useTheme } from '@/App';

const SUPERFLIX_BASE = 'https://superflixapi.bond';

const FilmesPage = () => {
  const { isDarkMode } = useTheme();
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [popularRes, topRatedRes, nowPlayingRes, upcomingRes] = await Promise.all([
          movieService.getPopular(),
          movieService.getTopRated(),
          movieService.getLatestReleases(),
          movieService.getUpcoming(),
        ]);
        setPopularMovies(popularRes.results.slice(0, 20));
        setTopRated(topRatedRes.results.slice(0, 20));
        setNowPlaying(nowPlayingRes.results.slice(0, 20));
        setUpcoming(upcomingRes.results.slice(0, 20));
      } catch (err) {
        setError('Falha ao carregar filmes.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openPlayer = (movie: Movie) => {
    setCurrentMovie(movie);
    setStreamUrl(`${SUPERFLIX_BASE}/filme/${movie.id}`);
    setPlayerOpen(true);
    
    watchHistoryService.addToHistory({
      id: movie.id,
      type: 'movie',
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      genre_ids: movie.genre_ids || [],
      progress: 5,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center pt-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-12 pt-20" data-app-element>
      {/* Header da página */}
      <div className="pt-10 pb-8 px-4 md:px-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500/30 to-primary-600/10 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Film size={28} className="text-primary-400" />
          </div>
          <div>
            <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Filmes
            </h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Explore nossa coleção completa</p>
          </div>
        </div>
      </div>

      {error && <div className="px-4 md:px-12 py-4"><ErrorMessage message={error} /></div>}
      
      <div className="py-8 space-y-8">
        <ContentCarousel 
          title="Em Cartaz" 
          subtitle="Nos cinemas agora"
          icon={<Clock size={22} className="text-primary-400" />}
        >
          {nowPlaying.map((movie) => (
            <MediaCard
              key={`now-${movie.id}`}
              id={movie.id}
              title={movie.title}
              poster_path={movie.poster_path}
              backdrop_path={movie.backdrop_path}
              vote_average={movie.vote_average}
              release_date={movie.release_date}
              genre_ids={movie.genre_ids}
              media_type="movie"
              onPlay={() => openPlayer(movie)}
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
              id={movie.id}
              title={movie.title}
              poster_path={movie.poster_path}
              backdrop_path={movie.backdrop_path}
              vote_average={movie.vote_average}
              release_date={movie.release_date}
              genre_ids={movie.genre_ids}
              media_type="movie"
              onPlay={() => openPlayer(movie)}
            />
          ))}
        </ContentCarousel>

        <ContentCarousel 
          title="Mais Bem Avaliados" 
          subtitle="Nota acima de 8"
          icon={<Award size={22} className="text-amber-400" />}
        >
          {topRated.map((movie) => (
            <MediaCard
              key={`top-${movie.id}`}
              id={movie.id}
              title={movie.title}
              poster_path={movie.poster_path}
              backdrop_path={movie.backdrop_path}
              vote_average={movie.vote_average}
              release_date={movie.release_date}
              genre_ids={movie.genre_ids}
              media_type="movie"
              onPlay={() => openPlayer(movie)}
            />
          ))}
        </ContentCarousel>

        <ContentCarousel 
          title="Em Breve" 
          subtitle="Próximos lançamentos"
          icon={<Calendar size={22} className="text-rose-400" />}
        >
          {upcoming.map((movie) => (
            <MediaCard
              key={`up-${movie.id}`}
              id={movie.id}
              title={movie.title}
              poster_path={movie.poster_path}
              backdrop_path={movie.backdrop_path}
              vote_average={movie.vote_average}
              release_date={movie.release_date}
              genre_ids={movie.genre_ids}
              media_type="movie"
              onPlay={() => openPlayer(movie)}
            />
          ))}
        </ContentCarousel>
      </div>

      <PlayerModal
        isOpen={playerOpen}
        onClose={() => {
          setPlayerOpen(false);
          setStreamUrl('');
        }}
        streamUrl={streamUrl}
        title={currentMovie?.title || ''}
      />
    </div>
  );
};

export default FilmesPage;
