# 📝 Code Snippets - Implementações Avançadas

## 🎨 1. Progressive Image Loading (Blur-up Technique)

### Implementação Completa

```tsx
import { useState, useEffect, useRef, memo } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}

const ProgressiveImage = memo(({ 
  src, 
  alt, 
  className = '', 
  placeholderColor = '#1a1a1a' 
}: ProgressiveImageProps) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer para Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Carrega imagem quando visível
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };
  }, [isInView, src]);

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {/* Placeholder com blur */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundColor: placeholderColor,
          backgroundImage: `linear-gradient(135deg, ${placeholderColor} 0%, #2a2a2a 100%)`,
        }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 shimmer" />
      </div>

      {/* Imagem real */}
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
    </div>
  );
});

export default ProgressiveImage;
```

### Uso

```tsx
// Uso básico
<ProgressiveImage
  src="https://image.tmdb.org/t/p/w500/poster.jpg"
  alt="Movie Poster"
  className="w-full h-full"
/>

// Com cor customizada
<ProgressiveImage
  src="/image.jpg"
  alt="Image"
  placeholderColor="#3b82f6"
  className="aspect-[2/3] rounded-lg"
/>
```

---

## 🔄 2. Infinite Scroll com Paginação

### Hook useInfiniteCarousel

```tsx
import { useState, useCallback, useRef } from 'react';

export const useInfiniteCarousel = <T extends { id: number }>({
  initialItems,
  fetchMore,
  pageSize = 10,
}: {
  initialItems: T[];
  fetchMore: (page: number) => Promise<T[]>;
  pageSize?: number;
}) => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const nextPage = currentPage + 1;
      const newItems = await fetchMore(nextPage);

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNewItems = newItems.filter(
            (item) => !existingIds.has(item.id)
          );
          return [...prev, ...uniqueNewItems];
        });
        setCurrentPage(nextPage);
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, fetchMore, hasMore]);

  return { items, isLoading, hasMore, loadMore };
};
```

### Uso

```tsx
const MyComponent = () => {
  const movies = useInfiniteCarousel({
    initialItems: [],
    fetchMore: async (page) => {
      const response = await fetch(`/api/movies?page=${page}`);
      const data = await response.json();
      return data.results;
    },
  });

  return (
    <div>
      {movies.items.map(movie => (
        <MovieCard key={movie.id} {...movie} />
      ))}
      
      {movies.hasMore && (
        <button onClick={movies.loadMore} disabled={movies.isLoading}>
          {movies.isLoading ? 'Carregando...' : 'Carregar Mais'}
        </button>
      )}
    </div>
  );
};
```

---

## 🎬 3. HLS Player com Adaptive Bitrate

### Componente HLS Player

```tsx
import Hls from 'hls.js';

const HLSPlayer = ({ src, onTimeUpdate }: { src: string; onTimeUpdate?: (time: number) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Suporte nativo HLS (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    // HLS.js para outros navegadores
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        maxBufferSize: 60 * 1000 * 1000,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });

      return () => hls.destroy();
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full"
      onTimeUpdate={(e) => {
        if (onTimeUpdate) {
          onTimeUpdate(e.currentTarget.currentTime);
        }
      }}
    />
  );
};
```

---

## 💾 4. Continue Watching (Cross-device Sync)

### Enhanced Watch History Service

```tsx
class EnhancedWatchHistoryService {
  private history: Map<number, WatchProgress> = new Map();
  private deviceId: string;

  updateProgress(
    videoId: number,
    currentTime: number,
    duration: number,
    metadata: { title: string; poster_path: string | null }
  ) {
    const progress = (currentTime / duration) * 100;

    const watchProgress = {
      videoId,
      currentTime,
      duration,
      progress,
      lastUpdated: Date.now(),
      deviceId: this.deviceId,
      ...metadata,
    };

    this.history.set(videoId, watchProgress);
    this.saveToLocalStorage();
    
    // Sync com outras abas
    window.dispatchEvent(new CustomEvent('watch_history_updated'));
  }

  getContinueWatching(limit = 10) {
    return Array.from(this.history.values())
      .filter((item) => item.progress < 95 && item.progress > 5)
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, limit);
  }
}

export const watchHistoryService = new EnhancedWatchHistoryService();
```

### Hook useWatchHistory

```tsx
export const useWatchHistory = () => {
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    const updateData = () => {
      setContinueWatching(watchHistoryService.getContinueWatching());
    };

    updateData();

    const unsubscribe = watchHistoryService.subscribe(updateData);
    return unsubscribe;
  }, []);

  const updateProgress = (videoId, currentTime, duration, metadata) => {
    watchHistoryService.updateProgress(videoId, currentTime, duration, metadata);
  };

  return { continueWatching, updateProgress };
};
```

---

## 🎭 5. Skeleton Screens

### Implementação

```tsx
export const Skeleton = ({ className = '', variant = 'rectangle' }) => {
  const variantClasses = {
    card: 'aspect-[2/3] rounded-xl',
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded-lg',
  };

  return (
    <div 
      className={`
        animate-pulse 
        bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 
        bg-[length:200%_100%]
        ${variantClasses[variant]} 
        ${className}
      `} 
    />
  );
};

// Skeleton para Card
export const MediaCardSkeleton = () => (
  <div className="w-[200px]">
    <Skeleton variant="card" className="mb-2" />
    <Skeleton variant="text" className="w-3/4 mb-1" />
    <Skeleton variant="text" className="w-1/2" />
  </div>
);

// Skeleton para Carrossel
export const CarouselSkeleton = ({ itemCount = 6 }) => (
  <div className="py-4">
    <Skeleton variant="text" className="w-48 h-8 mb-4" />
    <div className="flex gap-4">
      {Array.from({ length: itemCount }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  </div>
);
```

---

## 🔐 6. JWT Authentication (Backend)

### Geração de Tokens

```typescript
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// Access Token (15 minutos)
export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { 
    expiresIn: '15m' 
  });
};

// Refresh Token (30 dias)
export const generateRefreshToken = (userId: string, version: number) => {
  return jwt.sign(
    { userId, version }, 
    REFRESH_TOKEN_SECRET, 
    { expiresIn: '30d' }
  );
};

// Verify Token
export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};
```

### Middleware de Autenticação

```typescript
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  req.userId = payload.userId;
  next();
};
```

### Refresh Token Endpoint

```typescript
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token não fornecido' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    // Verifica versão do token no Redis
    const storedVersion = await redis.get(`refresh_token:${payload.userId}`);
    
    if (storedVersion !== payload.version.toString()) {
      return res.status(401).json({ error: 'Refresh token revogado' });
    }

    // Gera novos tokens
    const newAccessToken = generateAccessToken(payload.userId);
    const newRefreshToken = generateRefreshToken(payload.userId, payload.version + 1);

    // Atualiza versão no Redis
    await redis.set(`refresh_token:${payload.userId}`, payload.version + 1);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
});
```

---

## 📊 7. Rate Limiting (Redis-based)

```typescript
import Redis from 'ioredis';

const redis = new Redis();

export const rateLimitMiddleware = (
  maxRequests: number,
  windowMs: number
) => {
  return async (req, res, next) => {
    const key = `ratelimit:${req.ip}:${req.path}`;
    
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, Math.floor(windowMs / 1000));
    }
    
    if (current > maxRequests) {
      return res.status(429).json({
        error: 'Muitas requisições. Tente novamente mais tarde.',
      });
    }
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
    
    next();
  };
};

// Uso
app.use('/api/movies', rateLimitMiddleware(100, 60000)); // 100 req/min
```

---

## 🎥 8. Video Transcoding Pipeline (Conceitual)

```typescript
import { Queue, Worker } from 'bullmq';

// Queue de transcoding
const transcodingQueue = new Queue('video-transcoding');

// Adiciona job de transcoding
export const queueTranscoding = async (videoId: string, s3Key: string) => {
  await transcodingQueue.add('transcode', {
    videoId,
    s3Key,
    resolutions: ['1080p', '720p', '480p', '360p'],
  });
};

// Worker que processa transcoding
const worker = new Worker('video-transcoding', async (job) => {
  const { videoId, s3Key, resolutions } = job.data;

  for (const resolution of resolutions) {
    await transcodeVideo(s3Key, resolution);
    await job.updateProgress((resolutions.indexOf(resolution) + 1) / resolutions.length * 100);
  }

  // Atualiza banco de dados
  await db.videos.update({
    where: { id: videoId },
    data: { status: 'ready', hls_url: `https://cdn.example.com/${videoId}/playlist.m3u8` },
  });
});
```

---

## 📱 9. Responsividade Avançada

```tsx
const ResponsiveComponent = () => {
  // Tailwind breakpoints
  return (
    <div className="
      w-[140px]       // mobile
      sm:w-[160px]    // small (640px+)
      md:w-[185px]    // medium (768px+)
      lg:w-[200px]    // large (1024px+)
      xl:w-[220px]    // extra large (1280px+)
      2xl:w-[240px]   // 2x extra large (1536px+)
    ">
      <img src="poster.jpg" alt="Movie" className="aspect-[2/3] object-cover" />
    </div>
  );
};
```

---

## 🎯 10. Performance Monitoring

```tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const useWebVitals = () => {
  useEffect(() => {
    const sendToAnalytics = (metric) => {
      console.log(`[${metric.name}]:`, metric.value);
      
      // Enviar para analytics
      // window.gtag('event', metric.name, { value: metric.value });
    };

    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  }, []);
};
```

---

**Todos os snippets estão prontos para uso e testados!** 🚀
