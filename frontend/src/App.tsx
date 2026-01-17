import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import SearchPageSimple from '@/pages/SearchPageSimple';
import FilmesPage from '@/pages/FilmesPage';
import SeriesPage from '@/pages/SeriesPage';
import { popupBlocker } from '@/services/popupBlockerService';

// Theme Context (sem localStorage - reseta ao recarregar)
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/**
 * Main application component with routing
 */
function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Initialize popup blocker globally
  useEffect(() => {
    popupBlocker.enable();
    console.log('[KKMovies] App initialized with popup protection');
    
    return () => {
      // Keep popup blocker active
    };
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <Router>
        <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-100'}`} data-app-element>
          <Header />
          <main className="flex-grow pt-20 md:pt-24" data-app-content>
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
    </ThemeContext.Provider>
  );
}

export default App;
