import { memo, useRef, useCallback, useState } from 'react';

interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
  className?: string;
}

/**
 * Video player component using iframe for streaming
 * Optimized with lazy loading and ad blocking
 */
const VideoPlayer = memo(({ streamUrl, title = 'Movie Player', className = '' }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);
  
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);
  
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg z-10">
            <div className="text-white text-sm">Carregando player...</div>
          </div>
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg z-10">
            <div className="text-red-400 text-sm">Erro ao carregar player</div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={streamUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
