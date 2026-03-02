# KauanFlix — Seu cinema, do seu jeito 🎬

A Netflix-inspired streaming platform built with **React 18 + TypeScript + Tailwind CSS** and a **Node.js/Express** backend that proxies TMDB.

![KauanFlix](https://img.shields.io/badge/KauanFlix-7B2FFF?style=for-the-badge&logo=tv&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏠 **Home** | Hero banner with auto-rotate, Top 10 ranked, genre carousels |
| 🎬 **Movie Details** | Full details, cast, trailer link, similar movies |
| 🔍 **Search** | Debounced search with genre/rating/sort filters |
| 🧭 **Explore** | Infinite-scroll catalog with grid/list toggle |
| 📺 **Series** | Browse trending series, season/episode picker |
| ❤️ **My List** | Save movies to a personal watchlist (localStorage) |
| 🔥 **Top 10** | Ranked trending movies with large rank numbers |
| ▶️ **Player** | Fullscreen iframe player with PiP, keyboard shortcuts |
| 📊 **Stats** | Watch history, progress tracking, hours watched |
| 🔔 **Toasts** | Success/error/info notifications |
| 🎨 **Design System** | Purple electric accent, Bebas Neue + Inter fonts |
| 📱 **Responsive** | Mobile-first with hamburger drawer |
| ⚡ **Performance** | Lazy-loaded routes, 5-min API cache, code splitting |

## 🏗 Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router v6, Axios, Lucide Icons

**Backend:** Node.js, Express, TypeScript — proxies TMDB API with caching

## 📁 Project Structure

```
KauanFlix/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/        # Header, Footer
│       │   ├── player/        # PlayerModal (iframe)
│       │   ├── ui/            # Skeleton, Toast, StarRating, ErrorBoundary
│       │   ├── HeroBanner.tsx
│       │   ├── MovieCard.tsx
│       │   └── ContentCarousel.tsx
│       ├── pages/             # HomePage, MovieDetails, Search, Catalog, Series, MyList, Top10, Filmes
│       ├── services/          # api, movieService, watchHistory, myList, searchHistory
│       ├── store/             # useAppStore, usePlayerStore (Zustand)
│       ├── hooks/             # useMovies, useDebounce, useIntersectionObserver
│       ├── types/             # Movie, Series, WatchProgress, etc.
│       └── utils/             # helpers
└── backend/
    └── src/
        ├── routes/            # movie, series, streaming
        ├── controllers/
        ├── services/          # TMDB proxy, SuperFlix
        └── middleware/        # error, logger
```

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd KauanFlix

# Install both frontend and backend
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# → Set TMDB_API_KEY

# Frontend (optional overrides)
cp frontend/.env.example frontend/.env
```

### 3. Run

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173**

## 🔑 Environment Variables

### Backend `.env`
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `TMDB_API_KEY` | — | Your TMDB v3 API key |
| `TMDB_BASE_URL` | `https://api.themoviedb.org/3` | TMDB API base URL |

### Frontend `.env` (optional)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend API URL |
| `VITE_SUPERFLIX_BASE` | `https://superflixapi.bond` | Streaming provider |

## 🎨 Design System

- **Background:** `#08080F` (deep dark)
- **Accent:** `#7B2FFF → #BF5AF2` (purple electric gradient)
- **Fonts:** Bebas Neue (titles), Inter (UI), Roboto (body)
- **Spacing:** 8px grid
- **Components:** Glass morphism cards, skeleton loading, smooth transitions

## ⌨️ Keyboard Shortcuts (Player)

| Key | Action |
|-----|--------|
| `Esc` | Close player |
| `F` | Toggle fullscreen |
| `Space` | Play/Pause |

## 📝 License

MIT

---

**Feito com 💜 por Kauan**
