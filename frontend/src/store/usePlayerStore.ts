import { create } from 'zustand';
import type { StreamingServer, TMDBEmbedStream } from '../types/tmdbEmbed';

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
  server: StreamingServer;
  availableStreams: TMDBEmbedStream[];
  selectedStream: TMDBEmbedStream | null;
  imdbId?: string;

  openPlayer: (opts: {
    streamUrl: string;
    movieId: number;
    movieTitle: string;
    posterPath?: string;
    backdropPath?: string;
    mediaType?: 'movie' | 'tv';
    episodeInfo?: EpisodeInfo | null;
    resumePosition?: number;
    server?: StreamingServer;
    availableStreams?: TMDBEmbedStream[];
    selectedStream?: TMDBEmbedStream | null;
    imdbId?: string;
  }) => void;
  closePlayer: () => void;
  updateEpisode: (episode: EpisodeInfo) => void;
  setServer: (server: StreamingServer) => void;
  setStreams: (streams: TMDBEmbedStream[]) => void;
  selectStream: (stream: TMDBEmbedStream | null) => void;
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
  server: 'superflix',
  availableStreams: [],
  selectedStream: null,
  imdbId: undefined,

  openPlayer: ({
    streamUrl,
    movieId,
    movieTitle,
    posterPath = '',
    backdropPath = '',
    mediaType = 'movie',
    episodeInfo = null,
    resumePosition,
    server = 'superflix',
    availableStreams = [],
    selectedStream = null,
    imdbId,
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
      server,
      availableStreams,
      selectedStream,
      imdbId,
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
      server: 'superflix',
      availableStreams: [],
      selectedStream: null,
      imdbId: undefined,
    }),

  updateEpisode: (episode) =>
    set((state) => ({ episodeInfo: episode, streamUrl: state.streamUrl })),

  setServer: (server) => set({ server }),
  setStreams: (streams) => set({ availableStreams: streams }),
  selectStream: (stream) => set({
    selectedStream: stream,
    streamUrl: stream?.url || '',
  }),
}));
