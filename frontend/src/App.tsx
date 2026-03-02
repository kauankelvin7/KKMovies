import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { PlayerModal } from './components/player/PlayerModal';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ApiStatusBar } from './components/ApiStatusBar';
import { InstallBanner } from './components/ui/InstallBanner';
import { UpdateToast } from './components/ui/UpdateToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import * as movieService from './services/movieService';
import { useAppStore } from './store/useAppStore';

/* Lazy-loaded pages */
const HomePage = lazy(() => import('./pages/HomePage'));
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const FilmesPage = lazy(() => import('./pages/FilmesPage'));
const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const MyListPage = lazy(() => import('./pages/MyListPage'));
const Top10Page = lazy(() => import('./pages/Top10Page'));
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage'));

/* Loading fallback */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-kf-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const setGenres = useAppStore((s) => s.setGenres);

  /* Load genres once on mount */
  useEffect(() => {
    movieService.getGenres().then(setGenres).catch(() => {});
  }, [setGenres]);

  return (
    <ErrorBoundary>
      <Router>
        <AppShell />
      </Router>
    </ErrorBoundary>
  );
}

function AppShell() {
  useKeyboardShortcuts();

  return (
    <>
      <div className="flex flex-col min-h-screen bg-kf-bg text-white">
        <Header />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/filme/:id" element={<MovieDetailsPage />} />
            <Route path="/filmes" element={<FilmesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/serie/:id" element={<SeriesDetailPage />} />
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/explorar" element={<CatalogPage />} />
            <Route path="/minha-lista" element={<MyListPage />} />
            <Route path="/top10" element={<Top10Page />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>

        <Footer />
        <BottomNav />
      </div>

      {/* Global overlays - rendered outside main layout */}
      <PlayerModal />
      <ToastContainer />
      <ApiStatusBar />
      <InstallBanner />
      <UpdateToast />
    </>
  );
}

export default App;
