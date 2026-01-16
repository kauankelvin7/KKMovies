import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Home, Film, Tv, Search } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Início', icon: <Home size={18} /> },
    { path: '/filmes', label: 'Filmes', icon: <Film size={18} /> },
    { path: '/series', label: 'Séries', icon: <Tv size={18} /> },
    { path: '/search', label: 'Buscar', icon: <Search size={18} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="glass sticky top-0 z-50">
      <nav className="container-custom py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* K com Play integrado */}
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#fb923c'}} />
                    <stop offset="100%" style={{stopColor: '#ea580c'}} />
                  </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="18" fill="#1a1a1a" stroke="url(#logoGradient)" strokeWidth="2"/>
                {/* K + Play */}
                <path d="M12 8 L12 32 L16 32 L16 22 L16 8 Z" fill="url(#logoGradient)"/>
                <path d="M16 18 L22 8 L27 8 L19 20 Z" fill="url(#logoGradient)"/>
                <path d="M16 22 L16 32 L30 27 Z" fill="#f97316"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold bg-gradient-to-r from-orange-400 to-orange-500 text-transparent bg-clip-text leading-tight">KKMovies</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-dark-800/50 rounded-full p-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative px-5 py-2.5 rounded-full font-medium transition-all duration-300
                  flex items-center gap-2 overflow-hidden
                  ${isActive(item.path)
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <span className="absolute inset-0 bg-primary-400/20 animate-pulse rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full bg-dark-800 text-white transition-transform duration-300 hover:scale-105 active:scale-95"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className={`w-6 h-6 transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-64 mt-4' : 'max-h-0'}`}>
          <div className="space-y-2 pb-2">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  block px-4 py-3 rounded-xl font-medium transition-all duration-300
                  flex items-center gap-3
                  ${isActive(item.path)
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-300 hover:bg-dark-800 hover:translate-x-2'
                  }
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
