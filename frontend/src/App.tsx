import { BrowserRouter as Router, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { PlayerModal } from './components/player/PlayerModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ApiStatusBar } from './components/ApiStatusBar';
import { InstallBanner } from './components/ui/InstallBanner';
import { UpdateToast } from './components/ui/UpdateToast';
import { SkeletonCard } from './components/ui/Skeleton';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import * as movieService from './services/movieService';
import { useAppStore } from './store/useAppStore';

/* Lazy-loaded pages */
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'));
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
  return <div className="route-loading section-container" role="status" aria-label="Carregando página"><div className="route-loading-heading skeleton"/><p>Preparando o catálogo…</p><div className="catalog-grid">{Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index}/>)}</div></div>;
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
  const location = useLocation();
  const navigate = useNavigate();
  const details = useAppStore(state => state.detailsModal);
  const closeDetails = useAppStore(state => state.closeDetails);
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    if (details.isOpen && details.contentId) {
      navigate(`/${details.mediaType === 'tv' ? 'series' : 'filme'}/${details.contentId}`);
      closeDetails();
    }
  }, [details, navigate, closeDetails]);

  return (
    <>
      <div
        className="flex flex-col min-h-screen"
        style={{ background: 'var(--surface-0)', color: 'white' }}
      >
        <a className="skip-link glass-button primary" href="#page-content">Pular para o conteúdo</a>
        <Header />

        <Suspense fallback={<PageLoader />}>
          <div id="page-content" tabIndex={-1}><AnimatedPage>
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
              <Route path="/filme/:id" element={<MovieDetailsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AnimatedPage></div>
        </Suspense>

        <Footer />
        <BottomNav />
      </div>

      {/* Global overlays */}
      <SettingsModal />
      <PlayerModal />
      <ToastContainer />
      <ApiStatusBar />
      <InstallBanner />
      <UpdateToast />
    </>
  );
}

function NotFoundPage() {
  return <main className="section-container min-h-[70vh] flex flex-col items-start justify-center gap-5 pt-24"><p className="eyebrow">404 · PÁGINA NÃO ENCONTRADA</p><h1 className="hero-title">Essa cena não existe.</h1><p className="text-white/60">O endereço pode ter mudado. Encontre filmes e séries no catálogo.</p><Link to="/explorar" className="glass-button primary">Explorar catálogo</Link></main>;
}
export default App;
