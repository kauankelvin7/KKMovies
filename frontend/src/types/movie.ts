/* KauanFlix — Movie & Media Types */

export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  logo_path?: string | null;       // TMDB logo image for hero banner
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: Genre[];
  adult: boolean;
  original_language: string;
  media_type?: string;
  // Extended details
  runtime?: number;
  tagline?: string;
  status?: string;
  budget?: number;
  revenue?: number;
  homepage?: string;
  imdb_id?: string;
  production_companies?: ProductionCompany[];
  spoken_languages?: SpokenLanguage[];
  belongs_to_collection?: Collection | null;
  // Series / TV fields when media_type = 'tv'
  name?: string;
  first_air_date?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Collection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

/* Series types */
export interface Series {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  media_type?: string;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  overview: string;
  air_date: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  vote_average: number;
  runtime: number;
}

/* API Response types */
export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

/* Watch History */
export interface WatchProgress {
  movieId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  progress: number; // 0-100
  currentTime: number; // seconds
  duration: number; // seconds
  lastWatched: number; // timestamp
  completed: boolean;
  media_type?: 'movie' | 'tv';
  episodeInfo?: {
    season: number;
    episode: number;
    name: string;
    still_path: string | null;
  };
}

/* My List */
export interface MyListItem {
  movieId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate: string;
  addedAt: number; // timestamp
  genres?: Genre[];
}

/* User Stats */
export interface UserStats {
  totalWatched: number;
  totalHoursWatched: number;
  favoriteGenre: string;
  genreBreakdown: Record<string, number>;
}

/* Search filters */
export interface SearchFilters {
  genre?: number;
  year?: number;
  minRating?: number;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'title.asc';
}

/* Category section */
export interface ContentSection {
  id: string;
  title: string;
  icon?: string;
  movies: Movie[];
  loading?: boolean;
}

/* Toast notification */
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}
