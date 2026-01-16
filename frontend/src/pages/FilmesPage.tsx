import { useEffect, useState, useRef, memo } from 'react';
import { ChevronLeft, ChevronRight, Play, Star, Clock, TrendingUp, Award, Calendar, Film } from 'lucide-react';
import movieService from '@/services/movieService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PlayerModal from '@/components/PlayerModal';
import { Movie } from '@/types/movie';

const SUPERFLIX_BASE = 'https://superflixapi.bond';

const FilmesPage = () => {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);

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
    setPlayerOpen(true);
  };

  const getStreamUrl = (movieId: number) => `${SUPERFLIX_BASE}/filme/${movieId}?quality=1080p`;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-12">
      {/* Header da página */}
      <div className="pt-10 pb-8 px-4 md:px-12 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center">
            <Film size={28} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Filmes
            </h1>
            <p className="text-gray-500 mt-1">Explore nossa coleção completa</p>
          </div>
        </div>
      </div>

      {error && <div className="px-4 md:px-12 py-4"><ErrorMessage message={error} /></div>}
      
      <div className="py-8 space-y-4">
        <CategoryRow 
          title="Em Cartaz" 
          subtitle="Nos cinemas agora"
          icon={<Clock size={22} className="text-primary-400" />}
          movies={nowPlaying} 
          onPlay={openPlayer} 
        />
        <CategoryRow 
          title="Populares" 
          subtitle="Os mais assistidos"
          icon={<TrendingUp size={22} className="text-orange-400" />}
          movies={popularMovies} 
          onPlay={openPlayer} 
        />
        <CategoryRow 
          title="Mais Bem Avaliados" 
          subtitle="Nota acima de 8"
          icon={<Award size={22} className="text-amber-400" />}
          movies={topRated} 
          onPlay={openPlayer} 
        />
        <CategoryRow 
          title="Em Breve" 
          subtitle="Próximos lançamentos"
          icon={<Calendar size={22} className="text-rose-400" />}
          movies={upcoming} 
          onPlay={openPlayer} 
        />
      </div>

      <PlayerModal
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
        streamUrl={currentMovie ? getStreamUrl(currentMovie.id) : ''}
        title={currentMovie?.title || ''}
      />
    </div>
  );
};

interface CategoryRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

const CategoryRow = ({ title, subtitle, icon, movies, onPlay }: CategoryRowProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 500;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!movies.length) return null;

  return (
    <div className="relative group/row py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 px-4 md:px-12">
        {icon}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      
      {/* Botão Esquerda */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 translate-y-4 z-20 w-12 h-36 bg-gradient-to-r from-[#0a0a0a] to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-all flex items-center justify-center"
      >
        <ChevronLeft size={28} />
      </button>
      
      {/* Slider */}
      <div ref={sliderRef} className="flex gap-3 overflow-x-auto pb-2 px-4 md:px-12 scroll-smooth scrollbar-hide">
        {movies.map((movie, index) => (
          <MovieCard key={`${movie.id}-${index}`} movie={movie} onPlay={onPlay} />
        ))}
      </div>
      
      {/* Botão Direita */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 translate-y-4 z-20 w-12 h-36 bg-gradient-to-l from-[#0a0a0a] to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-all flex items-center justify-center"
      >
        <ChevronRight size={28} />
      </button>
    </div>
  );
};

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
}

const MovieCard = memo(({ movie, onPlay }: MovieCardProps) => {
  return (
    <div 
      className="flex-shrink-0 w-[160px] md:w-[180px] cursor-pointer group"
      onClick={() => onPlay(movie)}
    >
      <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-dark-800">
        {movie.poster_path ? (
          <img
            src={movie.poster_path}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎬</div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl shadow-primary-500/40">
            <Play size={24} fill="white" className="text-white ml-1" />
          </div>
        </div>
        
        {/* Rating */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
          <Star size={12} fill="#f59e0b" className="text-amber-500" />
          {movie.vote_average?.toFixed(1)}
        </div>
        
        {/* Gradient Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
        
        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug">
            {movie.title}
          </h3>
          {movie.release_date && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(movie.release_date).getFullYear()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

MovieCard.displayName = 'MovieCard';

export default FilmesPage;
