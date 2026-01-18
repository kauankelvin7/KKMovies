import { memo } from 'react';
import { Play, Star, Clock, Check, Film, Tv, X, Calendar } from 'lucide-react';
import { useTheme } from '@/App';

interface MediaCardProps {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: 'movie' | 'series';
  progress?: number;
  isWatched?: boolean;
  isUpcoming?: boolean;
  onPlay: (item: any) => void;
  onRemove?: (id: number, type: 'movie' | 'series') => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Card de mídia estilo Netflix com animações suaves
 */
const MediaCard = memo(({
  id,
  title,
  name,
  poster_path,
  backdrop_path,
  vote_average,
  release_date,
  first_air_date,
  genre_ids,
  media_type,
  progress,
  isWatched,
  isUpcoming,
  onPlay,
  onRemove,
  size = 'medium',
}: MediaCardProps) => {
  const { isDarkMode } = useTheme();
  const displayTitle = title || name || 'Sem título';
  const year = release_date || first_air_date 
    ? new Date(release_date || first_air_date || '').getFullYear() 
    : null;

  // Responsive size classes
  const sizeClasses = {
    small: 'w-[120px] xs:w-[130px] sm:w-[140px] md:w-[150px] lg:w-[160px]',
    medium: 'w-[130px] xs:w-[140px] sm:w-[155px] md:w-[170px] lg:w-[185px] xl:w-[200px]',
    large: 'w-[150px] xs:w-[160px] sm:w-[175px] md:w-[190px] lg:w-[210px] xl:w-[230px]',
  };

  const item = {
    id,
    title: displayTitle,
    name,
    poster_path,
    backdrop_path,
    vote_average,
    release_date,
    first_air_date,
    genre_ids,
    media_type,
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 7.5) return 'text-green-400 bg-green-500/20';
    if (rating >= 6) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  return (
    <div
      className={`media-card ${sizeClasses[size]} flex-shrink-0 cursor-pointer group`}
      onClick={() => onPlay(item)}
      data-app-element
    >
      <div className={`media-card-inner aspect-[2/3] relative rounded-xl overflow-hidden shadow-lg transition-colors duration-300 ${isDarkMode ? 'bg-dark-800' : 'bg-gray-100'}`}>
        {/* Poster Image */}
        {poster_path ? (
          <img
            src={poster_path}
            alt={displayTitle}
            className="media-card-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-dark-700 to-dark-900' : 'bg-gradient-to-br from-gray-200 to-gray-300'}`}>
            <Film size={48} className={`opacity-50 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
        )}

        {/* Rating Badge */}
        <div className={`media-card-rating absolute top-3 right-3 ${getRatingColor(vote_average)} px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 backdrop-blur-sm`}>
          <Star size={12} fill="currentColor" />
          {vote_average?.toFixed(1)}
        </div>

        {/* Media Type Badge */}
        {media_type && !isUpcoming && (
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wide flex items-center gap-1">
            {media_type === 'series' ? (
              <><Tv size={10} /> Série</>
            ) : (
              <><Film size={10} /> Filme</>
            )}
          </div>
        )}

        {/* Upcoming Badge */}
        {isUpcoming && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-600 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-lg animate-pulse">
            <Calendar size={11} />
            Em Breve
          </div>
        )}

        {/* Watched Badge */}
        {isWatched && (
          <div className="absolute top-3 left-3 bg-primary-500/80 backdrop-blur-sm text-white p-1.5 rounded-full">
            <Check size={12} strokeWidth={3} />
          </div>
        )}

        {/* Remove Button - Always visible for better UX */}
        {onRemove && progress !== undefined && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id, media_type || 'movie');
            }}
            className="absolute top-2 left-2 w-7 h-7 bg-red-500/95 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 z-20 shadow-lg hover:scale-110 backdrop-blur-sm"
            title="Remover"
          >
            <X size={14} strokeWidth={3} />
          </button>
        )}

        {/* Hover Overlay */}
        <div className="media-card-overlay absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">

          {/* Play Button */}
          <div className="media-card-play-btn w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75 shadow-2xl shadow-primary-500/50">
            <Play size={28} fill="white" className="text-white ml-1" />
          </div>

          {/* Quick Info */}
          <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
            <div className="flex items-center gap-2 text-gray-300 text-xs mb-2">
              {year && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {year}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

        {/* Progress Bar (for continue watching) */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Title & Year */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
          <h3 className="media-card-title font-semibold text-sm text-white line-clamp-2 leading-snug mb-1">
            {displayTitle}
          </h3>
          {year && (
            <p className="text-xs text-gray-400">{year}</p>
          )}
        </div>
      </div>
    </div>
  );
});

MediaCard.displayName = 'MediaCard';

export default MediaCard;
