import { memo, useCallback } from 'react';
import { Play, Star } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';

interface OptimizedMediaCardProps {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  onPlay: () => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Card de mídia otimizado com Progressive Image Loading
 * CLS otimizado com aspect-ratio reservado
 */
const OptimizedMediaCard = memo(({
  title,
  poster_path,
  vote_average,
  release_date,
  onPlay,
  size = 'medium',
}: OptimizedMediaCardProps) => {
  const year = release_date ? new Date(release_date).getFullYear() : null;

  // Tamanhos responsivos com aspect-ratio fixo (previne CLS)
  const sizeClasses = {
    small: 'w-[140px] sm:w-[150px] md:w-[160px]',
    medium: 'w-[155px] sm:w-[170px] md:w-[185px] lg:w-[200px]',
    large: 'w-[175px] sm:w-[190px] md:w-[210px] lg:w-[230px]',
  };

  const getRatingColor = useCallback((rating: number) => {
    if (rating >= 7.5) return 'text-green-400 bg-green-500/20';
    if (rating >= 6) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-orange-400 bg-orange-500/20';
  }, []);

  const imageUrl = poster_path 
    ? `https://image.tmdb.org/t/p/w342${poster_path}`
    : '/placeholder-movie.jpg';

  return (
    <div
      className={`${sizeClasses[size]} flex-shrink-0 cursor-pointer group`}
      onClick={onPlay}
    >
      {/* Container com aspect-ratio fixo (previne CLS) */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 shadow-lg transition-transform duration-300 ease-out group-hover:scale-105 group-hover:shadow-2xl">
        
        {/* Progressive Image Loading */}
        <ProgressiveImage
          src={imageUrl}
          alt={title}
          className="w-full h-full"
        />

        {/* Overlay escuro no hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl">
              <Play size={24} className="text-white fill-white ml-1" />
            </div>
          </div>

          {/* Info no hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
              {title}
            </h3>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white font-medium">{vote_average.toFixed(1)}</span>
              </div>
              {year && (
                <span className="text-zinc-300">{year}</span>
              )}
            </div>
          </div>
        </div>

        {/* Rating badge (sempre visível) */}
        <div className={`absolute top-2 right-2 ${getRatingColor(vote_average)} px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 backdrop-blur-sm`}>
          <Star size={10} className="fill-current" />
          <span>{vote_average.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
});

OptimizedMediaCard.displayName = 'OptimizedMediaCard';

export default OptimizedMediaCard;
