# 🎬 Arquitetura de Plataforma de Streaming - KKMovies

## 📋 Stack Tecnológica Recomendada

### Frontend
```
├── React 18+ (TypeScript)
├── Vite 5.x (Build Tool)
├── TailwindCSS (Styling)
├── Video.js / HLS.js (Player com HLS/DASH)
├── React Query / SWR (Cache & State Management)
├── React Window (Virtual Scrolling)
├── Blurhash (Progressive Image Loading)
└── Web Vitals (Performance Monitoring)
```

### Backend
```
├── Node.js 20+ LTS
├── Express.js (API Gateway)
├── PostgreSQL 16 (Dados críticos: Auth, Payments, Users)
├── MongoDB 7 (Catálogo de filmes, metadados)
├── Redis 7 (Cache, Sessions, Rate Limiting)
├── JWT (Authentication) + Refresh Tokens
├── BullMQ (Job Queue para transcoding)
└── Socket.io (Real-time sync - Continue Watching)
```

### Infraestrutura & Streaming
```
├── AWS S3 (Object Storage - Vídeos originais)
├── AWS CloudFront (CDN - HLS/DASH delivery)
├── AWS MediaConvert / FFmpeg (Transcoding)
├── AWS Lambda (Serverless functions)
├── Docker + Kubernetes (Container orchestration)
├── Nginx (Reverse Proxy & Load Balancer)
└── PM2 (Process Manager)
```

### Segurança & DRM
```
├── Widevine DRM (Android/Chrome)
├── FairPlay DRM (Apple devices)
├── PlayReady DRM (Microsoft)
├── AWS KMS (Key Management)
├── Helmet.js (Security headers)
├── Rate Limiting (Redis-based)
└── SSL/TLS (Cloudflare/Let's Encrypt)
```

---

## 🎯 Implementações Prioritárias

### 1. Progressive Image Loading (✅ JÁ IMPLEMENTADO)
- ProgressiveImage.tsx com blur-up technique
- Intersection Observer para lazy loading
- Shimmer effect enquanto carrega

### 2. Virtual Scrolling (🚀 NOVO)
- React Window para listas longas
- Renderiza apenas itens visíveis
- Performance 10x em catálogos grandes

### 3. Skeleton Screens (🚀 NOVO)
- Estados de loading profissionais
- Previne CLS (Cumulative Layout Shift)
- UX premium durante fetch

### 4. Adaptive Bitrate Streaming (🚀 NOVO)
- HLS.js para reprodução adaptativa
- Múltiplas resoluções (360p, 720p, 1080p, 4K)
- Fallback automático baseado em bandwidth

### 5. Continue Watching (🚀 MELHORADO)
- Sincronização cross-device em tempo real
- Socket.io para sync instantânea
- Armazenamento híbrido (Redis + PostgreSQL)

### 6. Autenticação Robusta (🚀 NOVO)
- JWT Access Token (15min TTL)
- Refresh Token (30 dias, rotação automática)
- Redis para blacklist de tokens
- Multi-device session management

---

## 📊 Diagrama: Video Upload → Streaming Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VIDEO UPLOAD PIPELINE                        │
└─────────────────────────────────────────────────────────────────────┘

1. UPLOAD
   ┌──────────────┐
   │ Admin Panel  │
   │  (Frontend)  │
   └──────┬───────┘
          │ POST /api/videos/upload (multipart/form-data)
          ▼
   ┌──────────────┐
   │ API Gateway  │
   │  (Express)   │ ─── Validação (size, format, permissions)
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   AWS S3     │
   │  (Original)  │ ─── Upload direto via presigned URL
   └──────┬───────┘
          │
          │ S3 Event Notification
          ▼

2. TRANSCODING
   ┌──────────────┐
   │  BullMQ Job  │
   │    Queue     │ ─── Job: { videoId, s3Key, resolutions }
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ AWS Lambda   │
   │  (Trigger)   │ ─── Invoca MediaConvert / FFmpeg
   └──────┬───────┘
          │
          ▼
   ┌────────────────────────────────────────┐
   │        AWS MediaConvert / FFmpeg       │
   │                                        │
   │  Original (4K) → Transcode to:        │
   │  ├── 1080p (5000 kbps) HLS            │
   │  ├── 720p (2500 kbps) HLS             │
   │  ├── 480p (1000 kbps) HLS             │
   │  ├── 360p (500 kbps) HLS              │
   │  └── Thumbnails (Sprite sheet)        │
   │                                        │
   │  Output: .m3u8 (manifest) + .ts chunks│
   └────────┬───────────────────────────────┘
            │
            ▼
   ┌──────────────┐
   │   AWS S3     │
   │  (Processed) │ ─── s3://bucket/videos/{id}/playlist.m3u8
   └──────┬───────┘
          │
          ▼

3. CDN DISTRIBUTION
   ┌──────────────┐
   │ CloudFront   │
   │     CDN      │ ─── Edge caching (global delivery)
   └──────┬───────┘
          │
          │ CDN URL: https://d1234.cloudfront.net/{id}/playlist.m3u8
          ▼

4. DRM ENCRYPTION (Optional)
   ┌──────────────┐
   │   AWS KMS    │
   │ (Key Mgmt)   │ ─── Gera chaves de encriptação
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Widevine   │
   │   FairPlay   │ ─── Encripta chunks HLS
   └──────┬───────┘
          │
          ▼

5. DATABASE UPDATE
   ┌──────────────┐
   │  PostgreSQL  │
   │  (Metadata)  │ ─── UPDATE videos SET status='ready', hls_url=...
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   MongoDB    │
   │  (Catalog)   │ ─── Indexação para busca rápida
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │    Redis     │
   │   (Cache)    │ ─── Cache de metadados (TTL 1h)
   └──────────────┘

6. CLIENT DELIVERY
   ┌──────────────┐
   │  User Device │
   │  (Browser)   │
   └──────┬───────┘
          │ GET /api/videos/{id}/stream
          ▼
   ┌──────────────┐
   │  HLS.js      │
   │  (Player)    │ ─── Adaptive bitrate switching
   └──────┬───────┘
          │
          │ Bandwidth detection → Select quality
          ▼
   ┌──────────────┐
   │  CloudFront  │
   │     CDN      │ ─── Stream .ts chunks (HTTPS)
   └──────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TEMPO TOTAL: ~5-15min (depende do tamanho do vídeo)                 │
│ - Upload: 1-3min (depende do tamanho e conexão)                     │
│ - Transcoding: 2-10min (depende da duração do vídeo)                │
│ - CDN Propagation: 1-2min                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Arquitetura de Banco de Dados Híbrida

### PostgreSQL (Dados Críticos)
```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  refresh_token_version INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Watch History (Cross-device sync)
CREATE TABLE watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  video_id VARCHAR(100) NOT NULL,
  timestamp_seconds INT NOT NULL,
  duration_seconds INT NOT NULL,
  device_id VARCHAR(100),
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id, device_id)
);

-- Subscriptions & Payments
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- active, cancelled, expired
  current_period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Videos (Metadata crítico)
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INT UNIQUE,
  title VARCHAR(500) NOT NULL,
  hls_url TEXT, -- CloudFront URL
  status VARCHAR(20) DEFAULT 'processing', -- processing, ready, failed
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX idx_watch_history_user ON watch_history(user_id, last_updated DESC);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);
CREATE INDEX idx_videos_status ON videos(status);
```

### MongoDB (Catálogo & Metadados)
```javascript
// Collection: movies
{
  _id: ObjectId("..."),
  tmdb_id: 12345,
  title: "Movie Title",
  overview: "Description...",
  poster_path: "/path.jpg",
  backdrop_path: "/backdrop.jpg",
  genres: [{ id: 28, name: "Action" }],
  vote_average: 8.5,
  release_date: "2024-01-01",
  runtime: 142,
  cast: [
    { name: "Actor Name", character: "Character", profile_path: "/actor.jpg" }
  ],
  videos: [
    { key: "youtube_id", site: "YouTube", type: "Trailer" }
  ],
  // Cache de relacionados
  similar_movies: [123, 456, 789],
  recommendations: [321, 654, 987],
  // Indexação
  search_text: "movie title action adventure...",
  created_at: ISODate("2024-01-01T00:00:00Z"),
  updated_at: ISODate("2024-01-01T00:00:00Z")
}

// Indexes
db.movies.createIndex({ tmdb_id: 1 }, { unique: true });
db.movies.createIndex({ search_text: "text" });
db.movies.createIndex({ "genres.id": 1 });
db.movies.createIndex({ vote_average: -1 });
db.movies.createIndex({ release_date: -1 });
```

### Redis (Cache & Real-time)
```
# Cache de metadados (TTL: 1h)
movie:{id}                    → JSON (movie data)
catalog:trending:page:{n}     → JSON (movies list)
catalog:popular:page:{n}      → JSON (movies list)

# Watch history sync (TTL: 24h)
watch:{user_id}:{video_id}    → JSON { timestamp, duration, device }

# Session management
session:{token_id}            → JSON { userId, deviceId, expiresAt }
refresh_token:{user_id}       → SET (active refresh tokens)

# Rate limiting
ratelimit:{ip}:{endpoint}     → Counter (TTL: 1min)
ratelimit:{user_id}:{action}  → Counter (TTL: 1h)

# Real-time presence
online_users                  → SET (user IDs)
watching:{video_id}           → SET (user IDs currently watching)
```

---

## 🔐 Segurança & DRM

### JWT Authentication Flow
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Login (email, password)
       ▼
┌─────────────┐
│     API     │
└──────┬──────┘
       │ 2. Validate credentials
       │ 3. Generate tokens:
       │    - Access Token (15min, JWT)
       │    - Refresh Token (30d, stored in Redis)
       ▼
┌─────────────┐
│   Client    │ ─── Store tokens (httpOnly cookie)
└──────┬──────┘
       │ 4. API Request (with Access Token)
       ▼
┌─────────────┐
│     API     │ ─── Verify JWT signature
└──────┬──────┘
       │ 5. Token expired?
       ▼
┌─────────────┐
│   Client    │ ─── Send Refresh Token
└──────┬──────┘
       │ 6. Refresh Token Request
       ▼
┌─────────────┐
│     API     │
└──────┬──────┘
       │ 7. Validate Refresh Token (Redis)
       │ 8. Rotate: New Access + New Refresh Token
       │ 9. Invalidate old Refresh Token
       ▼
┌─────────────┐
│   Client    │ ─── Update tokens
└─────────────┘
```

### DRM Implementation
```javascript
// HLS with Widevine/FairPlay
const drmConfig = {
  widevine: {
    licenseUrl: 'https://api.example.com/drm/widevine/license',
    certificateUrl: 'https://api.example.com/drm/widevine/cert'
  },
  fairplay: {
    licenseUrl: 'https://api.example.com/drm/fairplay/license',
    certificateUrl: 'https://api.example.com/drm/fairplay/cert'
  }
};

// FFmpeg transcoding com DRM
ffmpeg -i input.mp4 \
  -c:v h264 -b:v 5000k -s 1920x1080 \
  -c:a aac -b:a 128k \
  -hls_time 10 \
  -hls_key_info_file key_info.txt \  # Encryption
  -hls_playlist_type vod \
  -hls_segment_filename "1080p_%03d.ts" \
  1080p.m3u8
```

---

## 🎯 Roadmap de Implementação

### Fase 1: Foundation (Semana 1-2) ✅
- [x] Progressive Image Loading
- [x] Infinite Scroll básico
- [x] Cache no frontend
- [x] Otimizações Core Web Vitals

### Fase 2: Advanced UX (Semana 3-4) 🚀
- [ ] Skeleton Screens
- [ ] Virtual Scrolling (React Window)
- [ ] Error boundaries
- [ ] Offline support (Service Worker)

### Fase 3: Streaming (Semana 5-6) 🚀
- [ ] HLS.js integration
- [ ] Adaptive bitrate switching
- [ ] Thumbnail preview (sprite sheets)
- [ ] Quality selector

### Fase 4: Backend Híbrido (Semana 7-8) 🚀
- [ ] PostgreSQL setup
- [ ] MongoDB integration
- [ ] Redis cluster
- [ ] Database migration scripts

### Fase 5: Continue Watching (Semana 9-10) 🚀
- [ ] Real-time sync (Socket.io)
- [ ] Cross-device sync
- [ ] Watch history analytics
- [ ] Resume playback

### Fase 6: Security (Semana 11-12) 🚀
- [ ] JWT + Refresh Tokens
- [ ] Rate limiting avançado
- [ ] DRM basic (Widevine)
- [ ] Security headers

### Fase 7: Transcoding Pipeline (Semana 13-14) 🚀
- [ ] AWS S3 integration
- [ ] FFmpeg transcoding
- [ ] BullMQ job queue
- [ ] CDN setup (CloudFront)

### Fase 8: Production Ready (Semana 15-16) 🚀
- [ ] Load testing
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics 4)

---

## 📦 Próximas Implementações

Vou adicionar agora (de forma segura):

1. ✅ **Skeleton Screens** - Loading states profissionais
2. ✅ **Virtual Scrolling** - Performance em listas grandes
3. ✅ **HLS Player** - Adaptive bitrate streaming
4. ✅ **Continue Watching Enhanced** - Sync em tempo real
5. ✅ **Auth JWT** - Refresh tokens + segurança

---

**Todas as implementações serão incrementais e não quebrarão o sistema atual!** 🛡️
