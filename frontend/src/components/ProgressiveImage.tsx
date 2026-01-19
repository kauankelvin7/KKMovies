import { useState, useEffect, useRef, memo } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}

/**
 * Progressive Image Loading com Blur-up technique
 * Otimizado para Core Web Vitals (LCP)
 */
const ProgressiveImage = memo(({ src, alt, className = '', placeholderColor = '#1a1a1a' }: ProgressiveImageProps) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer para Lazy Loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Desconecta após carregar
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Carrega 50px antes de aparecer
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Carrega imagem quando entra na viewport
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      console.error('Erro ao carregar imagem:', src);
      setIsLoaded(true); // Remove loading state mesmo com erro
    };
  }, [isInView, src]);

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {/* Placeholder de baixa resolução com blur */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundColor: placeholderColor,
          backgroundImage: `linear-gradient(135deg, ${placeholderColor} 0%, #2a2a2a 100%)`,
        }}
      >
        {/* Shimmer effect enquanto carrega */}
        <div className="absolute inset-0 shimmer" />
      </div>

      {/* Imagem real com fade-in suave */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* CSS inline para shimmer effect */}
      <style>{`
        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
});

ProgressiveImage.displayName = 'ProgressiveImage';

export default ProgressiveImage;
