import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, X, Clock } from 'lucide-react';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import ProgressiveImage from './ProgressiveImage';

/**
 * Continue Watching Component
 * Exibe filmes/séries em progresso com sync cross-device
 */
const ContinueWatchingSection = memo(() => {
  const navigate = useNavigate();
  const { continueWatching, removeItem } = useWatchHistory();

  if (continueWatching.length === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  const formatTimeRemaining = (currentTime: number, duration: number) => {
    const remaining = duration - currentTime;
    return formatTime(remaining);
  };

  return (
    <div className="py-4 md:py-6 fade-in-section">
      {/* Header */}
      <div className="mb-4 section-container">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-blue-dim)] border border-[var(--accent-blue-border)] flex items-center justify-center">
            <Clock className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <h2 className="text-[17px] md:text-[20px] font-normal tracking-wide text-white m-0">
            Continuar Assistindo
          </h2>
        </div>
        <p className="text-[13px] text-[var(--text-muted)] font-light pl-10">
          Retome de onde você parou em qualquer dispositivo
        </p>
      </div>

      {/* Cards Scroll Container */}
      <div className="relative carousel-container section-container">
        <div className="carousel-scroll flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth scrollbar-hide">
          {continueWatching.map((item) => {
            const imageUrl = item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : '/placeholder-movie.jpg';

            return (
              <div
                key={`${item.videoId}-${item.deviceId}`}
                className="w-[280px] sm:w-[320px] md:w-[350px] flex-shrink-0 cursor-pointer group flex flex-col gap-2"
              >
                {/* Thumbnail Container (Glass Card Style) */}
                <div className="relative aspect-video rounded-xl overflow-hidden glass-card border border-[var(--glass-separator)] group-hover:border-[var(--accent-blue-border)] shadow-md group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
                  {/* Background Image with blur */}
                  <ProgressiveImage
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-full scale-110 filter blur-[2px] opacity-70 object-cover"
                  />

                  {/* Dark overlay for contrast */}
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[rgba(255,255,255,0.15)] z-10">
                    <div
                      className="h-full bg-[var(--accent-blue)] transition-all rounded-r-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  {/* Hover Overlay with Glass Play Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                    <button
                      onClick={() => navigate(`/watch/${item.videoId}`)}
                      className="w-14 h-14 rounded-full bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-separator)] flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl"
                      aria-label="Assistir"
                    >
                      <Play size={24} className="text-white fill-white ml-0.5" />
                    </button>
                  </div>

                  {/* Remove button (Glass style) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.videoId);
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-[var(--glass-separator)] hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    aria-label="Remover"
                  >
                    <X size={14} className="text-white" />
                  </button>

                  {/* Progress percentage pill */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-[var(--glass-separator)] rounded-md text-[11px] font-semibold text-white z-10">
                    {Math.round(item.progress)}%
                  </div>
                </div>

                {/* Info Container */}
                <div className="px-0.5">
                  <h3 className="text-[14px] font-medium text-[var(--text-primary)] line-clamp-1 tracking-tight mb-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)] font-medium">
                    <span className="text-[var(--accent-blue)]">
                      {formatTimeRemaining(item.currentTime, item.duration)} restantes
                    </span>
                    {item.season && item.episode && (
                      <span className="bg-[rgba(118,118,128,0.15)] px-2 py-0.5 rounded text-[10px] text-[var(--text-secondary)]">
                        T{item.season} E{item.episode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ContinueWatchingSection.displayName = 'ContinueWatchingSection';

export default ContinueWatchingSection;