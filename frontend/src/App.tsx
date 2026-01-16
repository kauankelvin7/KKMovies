import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePageSimple from '@/pages/HomePageSimple';
import SearchPageSimple from '@/pages/SearchPageSimple';
import FilmesPage from '@/pages/FilmesPage';
import SeriesPage from '@/pages/SeriesPage';

/**
 * Main application component with routing
 */
function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePageSimple />} />
            <Route path="/filmes" element={<FilmesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/search" element={<SearchPageSimple />} />
            <Route path="*" element={<HomePageSimple />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
