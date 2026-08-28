import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { PlayerModal } from './components/player/PlayerModal';
import { DetailsModal } from './components/DetailsModal';
import { SettingsModal } from './components/SettingsModal';
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
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const FilmesPage = lazy(() => import('./pages/FilmesPage'));
const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage')); // <-- IMPORTADO AQUI
const MyListPage = lazy(() => import('./pages/MyListPage'));
const Top10Page = lazy(() => import('./pages/Top10Page'));

/* Loading fallback — minimal spinner */
function PageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--surface-0)' }}
    >
      <div
        className="rounded-full border-[2px]"
        style={{
          width: 32,
          height: 32,
          borderColor: 'rgba(74,144,217,0.2)',
          borderTopColor: '#8E6FD6',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

/* Page transition wrapper */
function AnimatedPage({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  );
}

function App() {
  const setGenres = useAppStore((s) => s.setGenres);

  useEffect(() => {
    movieService.getGenres().then(setGenres).catch(() => { });
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
      <div
        className="flex flex-col min-h-screen"
        style={{ background: 'var(--surface-0)', color: 'white' }}
      >
        <Header />

        <Suspense fallback={<PageLoader />}>
          <AnimatedPage>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/filmes" element={<FilmesPage />} />
              <Route path="/series" element={<SeriesPage />} />
              <Route path="/series/:id" element={<SeriesDetailPage />} /> {/* <-- ROTA ADICIONADA */}
              <Route path="/serie/:id" element={<SeriesDetailPage />} />  {/* <-- SUPORTE AO SINGULAR */}
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/explorar" element={<CatalogPage />} />
              <Route path="/minha-lista" element={<MyListPage />} />
              <Route path="/top10" element={<Top10Page />} />
              {/* Legacy routes redirect to modal via HomePage */}
              <Route path="/filme/:id" element={<MovieDetailsRedirect />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </AnimatedPage>
        </Suspense>

        <Footer />
        <BottomNav />
      </div>

      {/* Global overlays */}
      <DetailsModal />
      <SettingsModal />
      <PlayerModal />
      <ToastContainer />
      <ApiStatusBar />
      <InstallBanner />
      <UpdateToast />
    </>
  );
}

/* Redirect legacy /filme/:id to modal via homepage */
function MovieDetailsRedirect() {
  const location = useLocation();
  const openDetails = useAppStore((s) => s.openDetails);
  const id = location.pathname.split('/')[2];

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      openDetails(Number(id), 'movie');
    }
  }, [id, openDetails]);

  return <HomePage />;
}

export default App;