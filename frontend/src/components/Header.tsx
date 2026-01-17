import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Film, Tv, Search, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/App';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Início', icon: <Home size={18} /> },
    { path: '/filmes', label: 'Filmes', icon: <Film size={18} /> },
    { path: '/series', label: 'Séries', icon: <Tv size={18} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? isDarkMode 
            ? 'bg-[#0a0a0a]/95 backdrop-blur-xl shadow-lg shadow-black/20' 
            : 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/10'
          : isDarkMode
            ? 'bg-gradient-to-b from-black/80 to-transparent'
            : 'bg-gradient-to-b from-white/80 to-transparent'
      }`}
      data-app-element
    >
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              {/* K com Play integrado */}
              <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#fb923c'}} />
                    <stop offset="100%" style={{stopColor: '#ea580c'}} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="20" cy="20" r="18" fill={isDarkMode ? "#1a1a1a" : "#ffffff"} stroke="url(#logoGradient)" strokeWidth="2" filter="url(#glow)"/>
                {/* K + Play */}
                <path d="M12 8 L12 32 L16 32 L16 22 L16 8 Z" fill="url(#logoGradient)"/>
                <path d="M16 18 L22 8 L27 8 L19 20 Z" fill="url(#logoGradient)"/>
                <path d="M16 22 L16 32 L30 27 Z" fill="#f97316"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-orange-400 via-primary-500 to-orange-600 text-transparent bg-clip-text leading-tight tracking-tight">
                KKMovies
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className={`hidden md:flex items-center gap-1 backdrop-blur-md rounded-full p-1.5 border ${
            isDarkMode ? 'bg-dark-800/60 border-white/5' : 'bg-white/60 border-black/5'
          }`}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative px-6 py-2.5 rounded-full font-medium transition-all duration-300
                  flex items-center gap-2.5 overflow-hidden
                  ${isActive(item.path)
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : isDarkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-black hover:bg-black/10'
                  }
                `}
              >
                <span className={`transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <span className="absolute inset-0 bg-primary-400/20 animate-pulse rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                  : 'bg-black/5 text-gray-700 hover:bg-black/10 hover:text-black border border-black/10'
              }`}
              title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <Link
              to="/search"
              className={`
                p-3 rounded-full transition-all duration-300
                ${isActive('/search')
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : isDarkMode
                    ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                    : 'bg-black/5 text-gray-700 hover:bg-black/10 hover:text-black border border-black/10'
                }
              `}
              title="Pesquisar"
            >
              <Search size={20} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-dark-800/80 text-white'
                  : 'bg-white/80 text-gray-800'
              } backdrop-blur-sm`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button
              className={`p-3 rounded-full transition-all duration-300 active:scale-95 backdrop-blur-sm ${
                isDarkMode ? 'bg-dark-800/80 text-white hover:bg-dark-700' : 'bg-white/80 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X size={24} className="transition-transform duration-300" />
              ) : (
                <Menu size={24} className="transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className={`backdrop-blur-xl rounded-2xl p-2 border space-y-1 ${
            isDarkMode ? 'bg-dark-800/90 border-white/5' : 'bg-white/90 border-black/5'
          }`}>
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300
                  ${isActive(item.path)
                    ? 'bg-primary-500 text-white'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-white/5 active:bg-white/10'
                      : 'text-gray-700 hover:bg-black/5 active:bg-black/10'
                  }
                `}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: isMenuOpen ? 'slideUp 0.3s ease-out forwards' : 'none'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <div className={`border-t my-2 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`} />
            <Link
              to="/search"
              onClick={() => setIsMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300
                ${isActive('/search')
                  ? 'bg-primary-500 text-white'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-white/5'
                    : 'text-gray-700 hover:bg-black/5'
                }
              `}
            >
              <Search size={18} />
              <span>Pesquisar</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
