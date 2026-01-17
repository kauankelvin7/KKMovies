import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Film, Tv, Search, Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

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
          ? 'bg-[#0a0a0a]/95 backdrop-blur-xl shadow-lg shadow-black/20' 
          : 'bg-gradient-to-b from-black/80 to-transparent'
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
                <circle cx="20" cy="20" r="18" fill="#1a1a1a" stroke="url(#logoGradient)" strokeWidth="2" filter="url(#glow)"/>
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
          <div className="hidden md:flex items-center gap-1 bg-dark-800/60 backdrop-blur-md rounded-full p-1.5 border border-white/5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative px-6 py-2.5 rounded-full font-medium transition-all duration-300
                  flex items-center gap-2.5 overflow-hidden
                  ${isActive(item.path)
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
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
            <Link
              to="/search"
              className={`
                p-3 rounded-full transition-all duration-300
                ${isActive('/search')
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                }
              `}
              title="Pesquisar"
            >
              <Search size={20} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-3 rounded-full bg-dark-800/80 text-white transition-all duration-300 hover:bg-dark-700 active:scale-95 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X size={24} className="transition-transform duration-300" />
            ) : (
              <Menu size={24} className="transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-dark-800/90 backdrop-blur-xl rounded-2xl p-2 border border-white/5 space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300
                  ${isActive(item.path)
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-300 hover:bg-white/5 active:bg-white/10'
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
            <div className="border-t border-white/10 my-2" />
            <Link
              to="/search"
              onClick={() => setIsMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300
                ${isActive('/search')
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:bg-white/5'
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
