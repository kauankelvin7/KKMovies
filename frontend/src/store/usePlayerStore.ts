/* KauanFlix — Player Store (Zustand) */
import { create } from 'zustand';

export interface EpisodeInfo {
  season: number;
  episode: number;
  name: string;
  still_path: string | null;
  totalEpisodes?: number;
  totalSeasons?: number;
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
  resumePosition?: number;

  openPlayer: (opts: {
    streamUrl: string;
    movieId: number;
    movieTitle: string;
    posterPath?: string;
    backdropPath?: string;
    mediaType?: 'movie' | 'tv';
    episodeInfo?: EpisodeInfo | null;
    resumePosition?: number;
  }) => void;
  closePlayer: () => void;
  updateEpisode: (episode: EpisodeInfo) => void;
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
  resumePosition: undefined,

  openPlayer: ({
    streamUrl,
    movieId,
    movieTitle,
    posterPath = '',
    backdropPath = '',
    mediaType = 'movie',
    episodeInfo = null,
    resumePosition,
  }) =>
    set({
      isOpen: true,
      streamUrl,
      movieId,
      movieTitle,
      posterPath,
      backdropPath,
      mediaType,
      episodeInfo,
      resumePosition,
    }),

  closePlayer: () =>
    set({
      isOpen: false,
      streamUrl: '',
      movieId: null,
      movieTitle: '',
      posterPath: '',
      backdropPath: '',
      mediaType: 'movie',
      episodeInfo: null,
      resumePosition: undefined,
    }),

  updateEpisode: (episode) =>
    set((state) => ({ episodeInfo: episode, streamUrl: state.streamUrl })),
}));
