import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import SearchPageSimple from '@/pages/SearchPageSimple';
import FilmesPage from '@/pages/FilmesPage';
import SeriesPage from '@/pages/SeriesPage';
import { popupBlocker } from '@/services/popupBlockerService';

/**
 * Main application component with routing
 */
function App() {
  // Initialize popup blocker globally
  useEffect(() => {
    popupBlocker.enable();
    console.log('[KKMovies] App initialized with popup protection');
    
    return () => {
      // Keep popup blocker active
    };
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0a0a0a]" data-app-element>
        <Header />
        <main className="flex-grow" data-app-content>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/filmes" element={<FilmesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/search" element={<SearchPageSimple />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
