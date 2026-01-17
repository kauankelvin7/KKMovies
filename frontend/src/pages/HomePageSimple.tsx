import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Play, Info, Star, Clock, TrendingUp, Award, Calendar, Film } from 'lucide-react';
import movieService from '@/services/movieService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PlayerModal from '@/components/PlayerModal';
import { Movie } from '@/types/movie';

const SUPERFLIX_BASE = 'https://superflixapi.bond';

const HomePageSimple = () => {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);

  // Top 6 filmes para o slider
  const featuredMovies = nowPlaying.slice(0, 6);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
  }, [featuredMovies.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  }, [featuredMovies.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Auto-slide a cada 5 segundos
  useEffect(() => {
    if (!isAutoPlaying || featuredMovies.length === 0) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, featuredMovies.length]);

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
        console.error('Error loading data:', err);
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

  const getStreamUrl = (movieId: number) => {
    return `${SUPERFLIX_BASE}/filme/${movieId}?quality=1080p`;
  };

  if (loading) return <LoadingSpinner />;

  const currentFeatured = featuredMovies[currentSlide];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Slider Section */}
      {featuredMovies.length > 0 && (
        <section 
          className="relative h-[80vh] overflow-hidden"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Slides */}
          {featuredMovies.map((movie, index) => (
            <div
              key={movie.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentSlide 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-105'
              }`}
            >
              {/* Background */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: movie.backdrop_path 
                    ? `url(${movie.backdrop_path})`
                    : 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)',
                }}
              />
              
              {/* Gradientes */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/20" />
            </div>
          ))}

          {/* Conteúdo do Slide Atual */}
          {currentFeatured && (
            <div className="relative z-10 h-full flex items-center">
              <div className="container-custom">
                <div className="max-w-2xl space-y-5">
                  {/* Badges */}
                  <div className="flex items-center gap-3 animate-fade-in">
                    <span className="px-3 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-full flex items-center gap-1.5">
                      <TrendingUp size={14} />
                      Em Alta
                    </span>
                    <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-gray-200 text-sm rounded-full flex items-center gap-1.5">
                      <Film size={14} />
                      Filme
                    </span>
                  </div>

                  {/* Título */}
                  <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
                    {currentFeatured.title}
                  </h1>

                  {/* Info */}
                  <div className="flex items-center gap-4 text-gray-300">
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Star size={18} fill="currentColor" />
                      {currentFeatured.vote_average?.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={16} />
                      {new Date(currentFeatured.release_date || '').getFullYear()}
                    </span>
                  </div>

                  {/* Sinopse */}
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed line-clamp-3">
                    {currentFeatured.overview || 'Assista agora em alta qualidade.'}
                  </p>

                  {/* Botões */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      onClick={() => openPlayer(currentFeatured)}
                      className="flex items-center gap-2 px-7 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary-500/30"
                    >
                      <Play size={20} fill="white" />
                      Assistir Agora
                    </button>
                    <button
                      className="flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/10"
                    >
                      <Info size={20} />
                      Mais Detalhes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setas de Navegação */}
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all duration-300 backdrop-blur-sm opacity-60 hover:opacity-100"
            aria-label="Anterior"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all duration-300 backdrop-blur-sm opacity-60 hover:opacity-100"
            aria-label="Próximo"
          >
            <ChevronRight size={28} />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {featuredMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-10 h-2.5 bg-primary-500'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Barra de Progresso */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / featuredMovies.length) * 100}%` }}
            />
          </div>
        </section>
      )}

      {error && <div className="px-4 md:px-12 py-4"><ErrorMessage message={error} /></div>}
      
      {/* Categorias */}
      <div className="pt-12 pb-10 space-y-2 relative z-20">
        <CategoryRow 
          title="Em Cartaz" 
          subtitle="Lançamentos nos cinemas"
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

      {/* Player Modal */}
      <PlayerModal
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
        streamUrl={currentMovie ? getStreamUrl(currentMovie.id) : ''}
        title={currentMovie?.title || ''}
      />
    </div>
  );
};

// Componente de Categoria
interface CategoryRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

const CategoryRow = memo(({ title, subtitle, icon, movies, onPlay }: CategoryRowProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 600;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  if (!movies.length) return null;

  return (
    <div className="category-row relative group/row py-4">
      {/* Header da Categoria */}
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
        className="absolute left-0 top-1/2 translate-y-2 z-20 w-12 h-36 bg-gradient-to-r from-[#0a0a0a] to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
      >
        <ChevronLeft size={28} />
      </button>
      
      {/* Slider */}
      <div ref={sliderRef} className="category-slider">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onPlay={onPlay} />
        ))}
      </div>
      
      {/* Botão Direita */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 translate-y-2 z-20 w-12 h-36 bg-gradient-to-l from-[#0a0a0a] to-transparent text-white opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
      >
        <ChevronRight size={28} />
      </button>
    </div>
  );
});

CategoryRow.displayName = 'CategoryRow';

// Componente de Card
interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
}

const MovieCard = memo(({ movie, onPlay }: MovieCardProps) => {
  return (
    <div 
      className="movie-card w-[160px] md:w-[180px] cursor-pointer group"
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
          <div className="w-full h-full bg-dark-700 flex items-center justify-center">
            <Film size={48} className="text-gray-600 opacity-50" />
          </div>
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

export default HomePageSimple;
