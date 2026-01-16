# KKMovies - Online Movie Streaming Platform

A modern movie streaming platform built with React, TypeScript, Tailwind CSS, and Node.js.

## 🎬 Features

- **Movie Discovery**: Browse movies by categories, trending, popular, and latest releases
- **Search Functionality**: Find any movie you want to watch
- **TMDB Integration**: High-quality movie posters and information
- **Recommendations**: Smart movie recommendations based on ratings
- **User-Friendly Interface**: Clean and responsive design

## 📁 Project Structure

```
KKMovies/
├── frontend/          # React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utility functions
│   └── public/
└── backend/           # Node.js + Express + TypeScript
    ├── src/
    │   ├── routes/       # API routes
    │   ├── controllers/  # Route controllers
    │   ├── services/     # Business logic
    │   ├── middleware/   # Express middleware
    │   └── types/        # TypeScript types
    └── dist/
```

## 🚀 Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## 🔑 Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_TMDB_API_KEY=your_tmdb_api_key
```

### Backend (.env)
```
PORT=3001
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
```

## 📝 License

MIT
