# 🎬 TMDB API Integration Guide

## Overview

The Movie Database (TMDB) API is used to fetch all movie data, including:
- Movie posters and backdrops
- Movie information (title, overview, ratings)
- Genres and categories
- Recommendations and similar movies

## API Configuration

### Base URL
```
https://api.themoviedb.org/3
```

### Authentication
All requests require an API key passed as a query parameter:
```
?api_key=YOUR_API_KEY
```

## Image URLs

### Poster Images
```
https://image.tmdb.org/t/p/w500/{poster_path}
```

### Backdrop Images
```
https://image.tmdb.org/t/p/original/{backdrop_path}
```

### Available Sizes
- Poster: w92, w154, w185, w342, w500, w780, original
- Backdrop: w300, w780, w1280, original

## Endpoints Used in KKMovies

### 1. Trending Movies
```http
GET /trending/movie/week
Parameters:
  - api_key: string (required)
  - page: number (optional, default: 1)
```

**Response Example:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 12345,
      "title": "Movie Title",
      "overview": "Movie description...",
      "poster_path": "/path/to/poster.jpg",
      "backdrop_path": "/path/to/backdrop.jpg",
      "release_date": "2024-01-15",
      "vote_average": 8.5,
      "vote_count": 1234,
      "genre_ids": [28, 12, 878]
    }
  ],
  "total_pages": 500,
  "total_results": 10000
}
```

### 2. Popular Movies
```http
GET /movie/popular
Parameters:
  - api_key: string (required)
  - page: number (optional)
```

### 3. Top Rated Movies
```http
GET /movie/top_rated
Parameters:
  - api_key: string (required)
  - page: number (optional)
```

### 4. Now Playing / Latest Releases
```http
GET /movie/now_playing
Parameters:
  - api_key: string (required)
  - page: number (optional)
```

### 5. Discover Movies by Genre
```http
GET /discover/movie
Parameters:
  - api_key: string (required)
  - with_genres: number (genre ID)
  - page: number (optional)
  - sort_by: string (e.g., "popularity.desc")
```

### 6. Search Movies
```http
GET /search/movie
Parameters:
  - api_key: string (required)
  - query: string (search term)
  - page: number (optional)
```

### 7. Movie Details
```http
GET /movie/{movie_id}
Parameters:
  - api_key: string (required)
```

**Response includes additional fields:**
```json
{
  "id": 12345,
  "title": "Movie Title",
  "genres": [
    { "id": 28, "name": "Action" },
    { "id": 878, "name": "Science Fiction" }
  ],
  "runtime": 148,
  "budget": 200000000,
  "revenue": 2000000000,
  "status": "Released",
  "tagline": "The journey begins",
  "homepage": "https://movie-website.com"
}
```

### 8. Get Genres List
```http
GET /genre/movie/list
Parameters:
  - api_key: string (required)
```

**Response:**
```json
{
  "genres": [
    { "id": 28, "name": "Action" },
    { "id": 12, "name": "Adventure" },
    { "id": 16, "name": "Animation" },
    { "id": 35, "name": "Comedy" },
    { "id": 80, "name": "Crime" },
    { "id": 99, "name": "Documentary" },
    { "id": 18, "name": "Drama" },
    { "id": 10751, "name": "Family" },
    { "id": 14, "name": "Fantasy" },
    { "id": 36, "name": "History" },
    { "id": 27, "name": "Horror" },
    { "id": 10402, "name": "Music" },
    { "id": 9648, "name": "Mystery" },
    { "id": 10749, "name": "Romance" },
    { "id": 878, "name": "Science Fiction" },
    { "id": 10770, "name": "TV Movie" },
    { "id": 53, "name": "Thriller" },
    { "id": 10752, "name": "War" },
    { "id": 37, "name": "Western" }
  ]
}
```

### 9. Movie Recommendations
```http
GET /movie/{movie_id}/recommendations
Parameters:
  - api_key: string (required)
  - page: number (optional)
```

### 10. Similar Movies
```http
GET /movie/{movie_id}/similar
Parameters:
  - api_key: string (required)
  - page: number (optional)
```

## Rate Limits

### Free API Tier
- **40 requests per 10 seconds**
- **Unlimited total requests per day**

Our backend implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "status_code": 7,
  "status_message": "Invalid API key: You must be granted a valid key."
}
```

**404 Not Found:**
```json
{
  "status_code": 34,
  "status_message": "The resource you requested could not be found."
}
```

**429 Too Many Requests:**
```json
{
  "status_code": 25,
  "status_message": "Your request count is over the allowed limit."
}
```

## Best Practices

### 1. Cache Responses
- Genre list rarely changes → cache for 24 hours
- Popular/trending movies → cache for 1-4 hours
- Movie details → cache for 12-24 hours

### 2. Image Optimization
- Use appropriate image sizes:
  - Card view: w342 or w500
  - Detail view: original
  - Mobile: w342
  - Desktop: w500

### 3. Error Handling
- Always handle network errors
- Provide fallback images for missing posters
- Show user-friendly error messages

### 4. Performance
- Lazy load images
- Implement pagination
- Debounce search requests

## Implementation in KKMovies

### Backend Service (tmdb.service.ts)
```typescript
// Axios instance with TMDB configuration
private api: AxiosInstance = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: { api_key: process.env.TMDB_API_KEY }
});
```

### Frontend Helpers (helpers.ts)
```typescript
// Get full image URL
export const getImageUrl = (path: string | null, size = 'w500') => {
  if (!path) return '/placeholder-movie.jpg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
```

## Resources

- **Official Documentation**: https://developers.themoviedb.org/3
- **API Reference**: https://www.themoviedb.org/documentation/api
- **Get API Key**: https://www.themoviedb.org/settings/api
- **Community Forum**: https://www.themoviedb.org/talk

## Attribution

TMDB requires attribution when using their API:

> "This product uses the TMDB API but is not endorsed or certified by TMDB."

Include the TMDB logo on your application (already included in Footer component).

---

**Note:** Always keep your API key secure and never commit it to version control!
