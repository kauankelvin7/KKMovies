import { create } from 'zustand';
export interface EpisodeInfo {
  season: number;
  episode: number;
  name: string;
  still_path: string | null;
  totalEpisodes?: number;
  totalSeasons?: number;
}
interface PlayerOptions {
  streamUrl: string;
  movieId: number;
  movieTitle: string;
  posterPath?: string;
  backdropPath?: string;
  mediaType?: 'movie' | 'tv';
  episodeInfo?: EpisodeInfo | null;
  resumePosition?: number;
  imdbId?: string;
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
  imdbId?: string;
  openPlayer: (options: PlayerOptions) => void;
  closePlayer: () => void;
  updateEpisode: (episode: EpisodeInfo) => void;
}
const initial = { isOpen: false, streamUrl: '', movieId: null, movieTitle: '', posterPath: '', backdropPath: '', mediaType: 'movie' as const, episodeInfo: null, resumePosition: undefined, imdbId: undefined };
export const usePlayerStore = create<PlayerState>(set => ({
  ...initial,
  openPlayer: options => set({ ...initial, ...options, isOpen: true }),
  closePlayer: () => set(initial),
  updateEpisode: episodeInfo => set({ episodeInfo }),
}));
