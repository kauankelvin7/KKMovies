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
    <div className="py-3 md:py-4">
      {/* Header */}
      <div className="mb-3 md:mb-4 px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
            Continuar Assistindo
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400">
          Retome de onde você parou em qualquer dispositivo
        </p>
      </div>

      {/* Cards */}
      <div className="flex gap-3 md:gap-4 overflow-x-auto overflow-y-hidden pb-2 px-4 sm:px-6 md:px-8 scroll-smooth scrollbar-hide">
        {continueWatching.map((item) => {
          const imageUrl = item.poster_path
            ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
            : '/placeholder-movie.jpg';

          return (
            <div
              key={`${item.videoId}-${item.deviceId}`}
              className="w-[280px] sm:w-[320px] md:w-[360px] flex-shrink-0 cursor-pointer group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 shadow-lg mb-2">
                {/* Background Image */}
                <ProgressiveImage
                  src={imageUrl}
                  alt={item.title}
                  className="w-full h-full scale-110 blur-sm"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                  <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => navigate(`/watch/${item.videoId}`)}
                    className="w-16 h-16 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl"
                  >
                    <Play size={28} className="text-white fill-white ml-1" />
                  </button>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.videoId);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} className="text-white" />
                </button>

                {/* Progress percentage */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs font-semibold text-white">
                  {Math.round(item.progress)}%
                </div>
              </div>

              {/* Info */}
              <div>
                <h3 className="text-white text-sm font-semibold line-clamp-1 mb-1">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    {formatTimeRemaining(item.currentTime, item.duration)} restantes
                  </span>
                  {item.season && item.episode && (
                    <span>
                      T{item.season} E{item.episode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollbar hide CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
});

ContinueWatchingSection.displayName = 'ContinueWatchingSection';

export default ContinueWatchingSection;
