/* KauanFlix — Header v4 (HBO Max style)
   - Logo: Inter 300, letter-spacing, accent blue
   - Nav links: underline indicator on active (not bg highlight)
   - Search: inline expand in header
   - No purple anywhere */

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
    const handleScroll = () => setScrolled(window.scrollY > 40);
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
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: scrolled
          ? 'rgba(5,5,8,0.97)'
          : 'linear-gradient(to bottom, rgba(5,5,8,0.9) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : 'none',
        transition: 'background 300ms ease, backdrop-filter 300ms ease, border-color 300ms ease',
      }}
    >
      <div
        className="flex items-center justify-between h-16 md:h-[70px]"
        style={{ padding: '0 clamp(16px, 5vw, 80px)' }}
      >
        {/* Logo */}
        <Link to="/" className="flex-shrink-0" aria-label="KauanFlix Home">
          <span
            className="kauanflix-logo"
            style={{
              fontSize: 22,
              fontWeight: 300,
              letterSpacing: '0.2em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            KAUANFLIX
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => {
            const isActive = link.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link text-sm ${isActive ? 'active' : ''}`}
                style={{ fontWeight: 400 }}
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
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar..."
                    style={{
                      width: 220,
                      height: 36,
                      paddingLeft: 36,
                      paddingRight: 12,
                      fontSize: 14,
                      background: 'var(--surface-2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'white',
                      outline: 'none',
                    }}
                    aria-label="Buscar filmes e séries"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchInput(''); }}
                  className="btn-icon"
                  style={{ width: 32, height: 32, background: 'transparent' }}
                  aria-label="Fechar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="btn-icon"
                style={{ width: 36, height: 36, background: 'transparent' }}
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden btn-icon"
            style={{ width: 36, height: 36, background: 'transparent' }}
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(5,5,8,0.7)' }}
            onClick={closeMobileMenu}
          />
          <nav
            className="fixed top-0 right-0 bottom-0 w-64 z-50 md:hidden flex flex-col"
            style={{
              background: 'var(--surface-1)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              animation: 'slideDown 0.25s ease-out',
            }}
            aria-label="Menu mobile"
          >
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="kauanflix-logo" style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.2em' }}>
                KAUANFLIX
              </span>
              <button onClick={closeMobileMenu} className="btn-icon" style={{ width: 32, height: 32, background: 'transparent' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col py-2">
              {NAV_LINKS.map((link) => {
                const isActive = link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center px-5 py-3.5 text-sm font-normal"
                    style={{
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                      borderRight: isActive ? '2px solid #4A90D9' : '2px solid transparent',
                      background: isActive ? 'rgba(74,144,217,0.08)' : 'transparent',
                      transition: 'background 150ms ease, color 150ms ease',
                    }}
                  >
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
