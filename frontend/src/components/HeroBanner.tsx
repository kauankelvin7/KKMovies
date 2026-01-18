import { useState, useEffect, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Play, Info, Star, Calendar, Film, Tv } from 'lucide-react';
import { useTheme } from '@/App';

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
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const { isDarkMode } = useTheme();

  // Theme-aware colors
  const bgColor = isDarkMode ? '#0a0a0a' : '#f8fafc';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  const featuredItems = items.slice(0, 8);
  const currentItem = featuredItems[currentIndex];

  // Reset expanded state when slide changes
  useEffect(() => {
    setIsOverviewExpanded(false);
  }, [currentIndex]);

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

          {/* Gradients - Theme aware with blur edges */}
          <div 
            className="absolute inset-0 transition-colors duration-300"
            style={{ background: `linear-gradient(to right, ${bgColor} 0%, ${bgColor}cc 30%, transparent 70%)` }}
          />
          <div 
            className="absolute inset-0 transition-colors duration-300"
            style={{ background: `linear-gradient(to top, ${bgColor} 0%, transparent 50%, ${bgColor}4d 100%)` }}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 h-48 transition-colors duration-300"
            style={{ background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor}e6 40%, transparent 100%)` }}
          />
          {/* Side blur edges */}
          <div 
            className="absolute top-0 bottom-0 right-0 w-32 transition-colors duration-300"
            style={{ background: `linear-gradient(to left, ${bgColor}80 0%, transparent 100%)` }}
          />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl lg:max-w-2xl space-y-3 sm:space-y-4 md:space-y-6 animate-slide-up">
            {/* Badge */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="hero-badge hero-badge-primary text-xs sm:text-sm">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse" />
                RECOMENDADO
              </span>
              <span className="hero-badge hero-badge-secondary flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
                {currentItem.media_type === 'series' ? (
                  <><Tv size={12} className="sm:w-[14px] sm:h-[14px]" /> Série</>
                ) : (
                  <><Film size={12} className="sm:w-[14px] sm:h-[14px]" /> Filme</>
                )}
              </span>
            </div>

            {/* Title */}
            <h1 className={`hero-title text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black ${textColor} leading-tight tracking-tight`}>
              {getTitle(currentItem)}
            </h1>

            {/* Meta Info */}
            <div className={`flex items-center gap-2 sm:gap-4 flex-wrap ${textSecondary} text-sm sm:text-base`}>
              <span className="flex items-center gap-1 sm:gap-1.5 text-amber-500 font-bold text-base sm:text-lg">
                <Star size={16} className="sm:w-5 sm:h-5" fill="currentColor" />
                {currentItem.vote_average?.toFixed(1)}
              </span>
              {getYear(currentItem) && (
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar size={14} className="sm:w-4 sm:h-4" />
                  {getYear(currentItem)}
                </span>
              )}
              {getGenres(currentItem) && (
                <span className={`${textMuted} hidden sm:inline`}>
                  {getGenres(currentItem)}
                </span>
              )}
            </div>

            {/* Overview with Read More */}
            <div className="hidden xs:block max-w-xl">
              <p className={`hero-overview ${textSecondary} text-sm sm:text-base md:text-lg leading-relaxed transition-all duration-300 ${
                isOverviewExpanded ? '' : 'line-clamp-2'
              }`}>
                {currentItem.overview || 'Assista agora em alta qualidade.'}
              </p>
              {currentItem.overview && currentItem.overview.length > 120 && (
                <button
                  onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                  className="text-primary-400 hover:text-primary-300 text-sm font-medium mt-1 transition-colors"
                >
                  {isOverviewExpanded ? 'Ler menos' : 'Ler mais...'}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-4 pt-1 sm:pt-2">
              <button
                onClick={() => onPlay(currentItem)}
                className="hero-btn hero-btn-primary text-sm sm:text-base px-4 sm:px-8 py-2.5 sm:py-4"
              >
                <Play size={18} className="sm:w-[22px] sm:h-[22px]" fill="white" />
                <span className="hidden xs:inline">Assistir</span>
                <span className="xs:hidden">▶</span>
              </button>
              
              {onInfo && (
                <button
                  onClick={() => onInfo(currentItem)}
                  className="hero-btn hero-btn-secondary text-sm sm:text-base px-4 sm:px-8 py-2.5 sm:py-4"
                >
                  <Info size={18} className="sm:w-[22px] sm:h-[22px]" />
                  <span className="hidden sm:inline">Mais Detalhes</span>
                  <span className="sm:hidden">Info</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - hidden on mobile */}
      <button
        onClick={prevSlide}
        className="hero-arrow hero-arrow-left hidden sm:flex"
        aria-label="Anterior"
      >
        <ChevronLeft size={28} strokeWidth={2.5} className="md:w-8 md:h-8" />
      </button>
      <button
        onClick={nextSlide}
        className="hero-arrow hero-arrow-right hidden sm:flex"
        aria-label="Próximo"
      >
        <ChevronRight size={28} strokeWidth={2.5} className="md:w-8 md:h-8" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2">
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
                ? 'hero-indicator-active w-8 sm:w-12 h-2 sm:h-3'
                : 'hero-indicator-inactive w-2 sm:w-3 h-2 sm:h-3'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar - com fundo para ficar sempre visível */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div 
          className="pt-6 sm:pt-8 pb-3 sm:pb-4 px-4 transition-colors duration-300"
          style={{ background: `linear-gradient(to top, ${bgColor}cc 0%, transparent 100%)` }}
        >
          <div className={`h-0.5 sm:h-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-full overflow-hidden`}>
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / featuredItems.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Thumbnail Preview (Right Side) - Only on large screens */}
      <div className="hidden xl:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 flex-col gap-3">
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
