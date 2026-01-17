import { useState, useEffect, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Play, Info, Star, Calendar, Film, Tv } from 'lucide-react';

interface FeaturedItem {
  id: number;
  title: string;
  name?: string;
  overview?: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: 'movie' | 'series';
}

interface HeroBannerProps {
  items: FeaturedItem[];
  onPlay: (item: FeaturedItem) => void;
  onInfo?: (item: FeaturedItem) => void;
  autoPlayInterval?: number;
}

// Mapeamento de gêneros
const genreNames: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Cinema TV',
  53: 'Thriller',
  10752: 'Guerra',
  37: 'Faroeste',
  // TV Genres
  10759: 'Ação & Aventura',
  10762: 'Kids',
  10763: 'Notícias',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasia',
  10766: 'Novela',
  10767: 'Talk Show',
  10768: 'Guerra & Política',
};

/**
 * Hero Banner estilo Netflix/MegaFlix com slides automáticos
 */
const HeroBanner = memo(({
  items,
  onPlay,
  onInfo,
  autoPlayInterval = 6000,
}: HeroBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const featuredItems = items.slice(0, 8);
  const currentItem = featuredItems[currentIndex];

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % featuredItems.length);
  }, [currentIndex, featuredItems.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentIndex - 1 + featuredItems.length) % featuredItems.length);
  }, [currentIndex, featuredItems.length, goToSlide]);

  // Auto-slide
  useEffect(() => {
    if (!isAutoPlaying || featuredItems.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, autoPlayInterval, featuredItems.length]);

  if (!featuredItems.length || !currentItem) return null;

  const getTitle = (item: FeaturedItem) => item.title || item.name || 'Sem título';
  const getYear = (item: FeaturedItem) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };
  const getGenres = (item: FeaturedItem) => {
    return item.genre_ids?.slice(0, 3).map(id => genreNames[id]).filter(Boolean).join(', ') || '';
  };

  return (
    <section
      className="hero-banner relative h-[85vh] min-h-[600px] overflow-hidden pb-24"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      data-app-element
    >
      {/* Background Slides */}
      {featuredItems.map((item, index) => (
        <div
          key={item.id}
          className={`hero-slide absolute inset-0 transition-all duration-700 ease-out ${
            index === currentIndex
              ? 'opacity-100 scale-100 z-10'
              : 'opacity-0 scale-105 z-0'
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: item.backdrop_path
                ? `url(${item.backdrop_path})`
                : `linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)`,
            }}
          />

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/30" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container-custom">
          <div className="max-w-2xl space-y-6 animate-slide-up">
            {/* Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="hero-badge hero-badge-primary">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                RECOMENDADO
              </span>
              <span className="hero-badge hero-badge-secondary flex items-center gap-1.5">
                {currentItem.media_type === 'series' ? (
                  <><Tv size={14} /> Série</>
                ) : (
                  <><Film size={14} /> Filme</>
                )}
              </span>
            </div>

            {/* Title */}
            <h1 className="hero-title text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              {getTitle(currentItem)}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-4 flex-wrap text-gray-300">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold text-lg">
                <Star size={20} fill="currentColor" />
                {currentItem.vote_average?.toFixed(1)}
              </span>
              {getYear(currentItem) && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  {getYear(currentItem)}
                </span>
              )}
              {getGenres(currentItem) && (
                <span className="text-gray-400">
                  {getGenres(currentItem)}
                </span>
              )}
            </div>

            {/* Overview */}
            <p className="hero-overview text-gray-300 text-base md:text-lg leading-relaxed line-clamp-3 max-w-xl">
              {currentItem.overview || 'Assista agora em alta qualidade.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => onPlay(currentItem)}
                className="hero-btn hero-btn-primary"
              >
                <Play size={22} fill="white" />
                Assistir Agora
              </button>
              
              {onInfo && (
                <button
                  onClick={() => onInfo(currentItem)}
                  className="hero-btn hero-btn-secondary"
                >
                  <Info size={22} />
                  Mais Detalhes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="hero-arrow hero-arrow-left"
        aria-label="Anterior"
      >
        <ChevronLeft size={32} strokeWidth={2.5} />
      </button>
      <button
        onClick={nextSlide}
        className="hero-arrow hero-arrow-right"
        aria-label="Próximo"
      >
        <ChevronRight size={32} strokeWidth={2.5} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {featuredItems.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              goToSlide(index);
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 10000);
            }}
            className={`hero-indicator transition-all duration-300 ${
              index === currentIndex
                ? 'hero-indicator-active'
                : 'hero-indicator-inactive'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar - com fundo para ficar sempre visível */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-4">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / featuredItems.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Thumbnail Preview (Right Side) */}
      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 flex-col gap-3">
        {featuredItems.slice(0, 4).map((item, index) => (
          <button
            key={item.id}
            onClick={() => {
              goToSlide(index);
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 10000);
            }}
            className={`hero-thumbnail group transition-all duration-300 ${
              index === currentIndex
                ? 'hero-thumbnail-active'
                : 'hero-thumbnail-inactive'
            }`}
          >
            <img
              src={item.poster_path || item.backdrop_path || ''}
              alt={getTitle(item)}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors rounded-lg" />
            <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
              <p className="text-white text-xs font-medium truncate">{getTitle(item)}</p>
              <p className="text-gray-400 text-[10px]">{getYear(item)}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
});

HeroBanner.displayName = 'HeroBanner';

export default HeroBanner;
