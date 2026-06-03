/* KauanFlix — Global App Store (Zustand) */
import { create } from 'zustand';
import type { ToastMessage, Genre } from '../types/movie';

interface DetailsModalState {
  isOpen: boolean;
  contentId: number | null;
  mediaType: 'movie' | 'tv';
}

interface AppState {
  /* Toast notifications */
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  /* Genres cache */
  genres: Genre[];
  setGenres: (genres: Genre[]) => void;

  /* Mobile menu */
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  /* Search */
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  /* Details Modal */
  detailsModal: DetailsModalState;
  openDetails: (contentId: number, mediaType: 'movie' | 'tv') => void;
  closeDetails: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  /* Toasts */
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  /* Genres */
  genres: [],
  setGenres: (genres) => set({ genres }),

  /* Mobile menu */
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  /* Search */
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  /* Details Modal */
  detailsModal: { isOpen: false, contentId: null, mediaType: 'movie' },
  openDetails: (contentId, mediaType) =>
    set({ detailsModal: { isOpen: true, contentId, mediaType } }),
  closeDetails: () =>
    set({ detailsModal: { isOpen: false, contentId: null, mediaType: 'movie' } }),
}));
