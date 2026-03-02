/* KauanFlix — Header / NavBar */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Film, Tv, Compass, Heart, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const NAV_LINKS = [
  { to: '/', label: 'Início', icon: null },
  { to: '/filmes', label: 'Filmes', icon: Film },
  { to: '/series', label: 'Séries', icon: Tv },
  { to: '/explorar', label: 'Explorar', icon: Compass },
  { to: '/top10', label: 'Top 10', icon: Trophy },
  { to: '/minha-lista', label: 'Minha Lista', icon: Heart },
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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { closeMobileMenu(); }, [location.pathname, closeMobileMenu]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
      setSearchOpen(false);
      setSearchInput('');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(8,8,15,0.97)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)]'
          : 'bg-gradient-to-b from-[rgba(8,8,15,0.95)] to-transparent'
      }`}
    >
      <div className="section-container flex items-center justify-between h-16 md:h-[72px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group" aria-label="KauanFlix Home">
          <span className="text-2xl md:text-3xl font-bold font-display tracking-wide text-gradient kauanflix-logo">
            KAUANFLIX
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => {
            const isActive = link.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive
                    ? 'active text-white bg-[rgba(123,47,255,0.15)]'
                    : 'text-kf-text-secondary hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar filmes..."
                  className="w-48 sm:w-64 h-9 pl-9 pr-3 text-sm bg-[rgba(255,255,255,0.08)] border border-[rgba(123,47,255,0.3)] rounded-full text-white placeholder-kf-text-muted focus:outline-none focus:border-kf-accent transition-all"
                  aria-label="Buscar filmes e séries"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kf-text-muted" />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchInput(''); }}
                  className="ml-2 text-kf-text-muted hover:text-white"
                  aria-label="Fechar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="btn-icon w-9 h-9 bg-transparent hover:bg-[rgba(255,255,255,0.08)]"
                aria-label="Abrir busca"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden btn-icon w-9 h-9 bg-transparent"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={closeMobileMenu} />
          <nav
            className="fixed top-0 right-0 bottom-0 w-72 z-50 md:hidden bg-kf-bg-secondary border-l border-[rgba(255,255,255,0.05)] flex flex-col animate-slide-down"
            aria-label="Menu mobile"
          >
            <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-xl font-display text-gradient">KAUANFLIX</span>
              <button onClick={closeMobileMenu} aria-label="Fechar menu">
                <X className="w-5 h-5 text-kf-text-muted" />
              </button>
            </div>
            <div className="flex flex-col py-2">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-[rgba(123,47,255,0.12)] border-r-2 border-kf-accent'
                        : 'text-kf-text-secondary hover:text-white hover:bg-[rgba(255,255,255,0.03)]'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </header>
  );
};
