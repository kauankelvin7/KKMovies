interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
  className?: string;
}

/**
 * Video player component using iframe for streaming
 */
const VideoPlayer = ({ streamUrl, title = 'Movie Player', className = '' }: VideoPlayerProps) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
        <iframe
          src={streamUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
