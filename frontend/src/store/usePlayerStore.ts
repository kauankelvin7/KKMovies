/* KauanFlix — Player Store (Zustand) */
import { create } from 'zustand';

interface EpisodeInfo {
  season: number;
  episode: number;
  name: string;
  still_path: string | null;
}

interface PlayerState {
  isOpen: boolean;
  streamUrl: string;
  movieId: number | null;
  movieTitle: string;
  posterPath: string;
  backdropPath: string;
  mediaType: 'movie' | 'tv';
  episodeInfo: EpisodeInfo | null;

  openPlayer: (opts: {
    streamUrl: string;
    movieId: number;
    movieTitle: string;
    posterPath?: string;
    backdropPath?: string;
    mediaType?: 'movie' | 'tv';
    episodeInfo?: EpisodeInfo | null;
  }) => void;
  closePlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isOpen: false,
  streamUrl: '',
  movieId: null,
  movieTitle: '',
  posterPath: '',
  backdropPath: '',
  mediaType: 'movie',
  episodeInfo: null,

  openPlayer: ({ streamUrl, movieId, movieTitle, posterPath = '', backdropPath = '', mediaType = 'movie', episodeInfo = null }) =>
    set({ isOpen: true, streamUrl, movieId, movieTitle, posterPath, backdropPath, mediaType, episodeInfo }),

  closePlayer: () =>
    set({ isOpen: false, streamUrl: '', movieId: null, movieTitle: '', posterPath: '', backdropPath: '', mediaType: 'movie', episodeInfo: null }),
}));
