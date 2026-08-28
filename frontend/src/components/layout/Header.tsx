/* KauanFlix — Header (iOS Glass) */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/filmes', label: 'Filmes' },
  { to: '/series', label: 'Séries' },
  { to: '/explorar', label: 'Explorar' },
  { to: '/minha-lista', label: 'Minha Lista' },
];

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { closeMobileMenu(); }, [location.pathname, closeMobileMenu]);
  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
      setSearchOpen(false);
      setSearchInput('');
    }
  };

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header className={`ios-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="ios-nav-inner section-container">
        {/* Logo */}
        <Link to="/" className="ios-nav-logo" aria-label="KauanFlix Home">
          <span className="ios-nav-logo-text" style={{ fontSize: 20, letterSpacing: '0.18em' }}>
            KAUANFLIX
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`ios-nav-link ${isActive(link.to) ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="ios-search-field">
                <Search className="ios-search-icon w-4 h-4" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar filmes e séries"
                  className="ios-search-input"
                  aria-label="Buscar filmes e séries"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="ios-search-clear"
                    aria-label="Limpar busca"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchInput(''); }}
                className="ios-nav-link"
                style={{ padding: '6px 10px' }}
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="ios-nav-icon-btn"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={toggleMobileMenu}
            className="md:hidden ios-nav-icon-btn"
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Side Menu — estilo Settings do iOS */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden ios-menu-backdrop" onClick={closeMobileMenu} />
          <nav className="ios-side-menu md:hidden" aria-label="Menu mobile">
            <div className="ios-side-menu-header">
              <span className="ios-nav-logo-text" style={{ fontSize: 17 }}>KAUANFLIX</span>
              <button onClick={closeMobileMenu} className="ios-nav-icon-btn" aria-label="Fechar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="ios-side-menu-list">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`ios-side-menu-item ${isActive(link.to) ? 'active' : ''}`}
                >
                  <span className="ios-side-menu-item-indicator" />
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </header>
  );
};