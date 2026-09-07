import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, ArrowUpRight, Bookmark } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Brand } from './Brand';
const links = [{ to: '/', label: 'Início' }, { to: '/filmes', label: 'Filmes' }, { to: '/series', label: 'Séries' }, { to: '/explorar', label: 'Explorar' }, { to: '/minha-lista', label: 'Minha Lista' }];
export function Header() {
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useAppStore();
  const location = useLocation();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const active = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  useEffect(() => { closeMobileMenu(); }, [location.pathname, closeMobileMenu]);
  useEffect(() => {
    const el = dialog.current;
    if (!isMobileMenuOpen) { el?.close(); return; }
    const previous = document.body.style.overflow;
    el?.showModal(); document.body.style.overflow = 'hidden';
    const resize = () => { if (window.innerWidth >= 1024) closeMobileMenu(); };
    window.addEventListener('resize', resize);
    return () => { el?.close(); document.body.style.overflow = previous; window.removeEventListener('resize', resize); trigger.current?.focus(); };
  }, [isMobileMenuOpen, closeMobileMenu]);
  return <>
    <header className="site-header"><div className="site-header-inner">
      <Link to="/" className="brand-link" aria-label="KKMovies, início"><Brand /></Link>
      <nav className="desktop-links" aria-label="Navegação principal">{links.map(link => <Link key={link.to} to={link.to} className={active(link.to) ? 'active' : ''} aria-current={active(link.to) ? 'page' : undefined}>{link.label}</Link>)}</nav>
      <div className="header-actions"><Link className="glass-icon-btn" to="/buscar" aria-label="Buscar filmes e séries"><Search size={19} /></Link><button ref={trigger} className="glass-icon-btn mobile-menu-trigger" aria-label="Abrir menu" aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation" onClick={toggleMobileMenu}><Menu size={21} /></button></div>
    </div></header>
    {createPortal(<dialog ref={dialog} id="mobile-navigation" className="mobile-navigation" aria-label="Menu de navegação" onCancel={event => { event.preventDefault(); closeMobileMenu(); }} onClick={event => { if (event.target === event.currentTarget) closeMobileMenu(); }}>
      <div className="mobile-menu-panel"><div className="mobile-menu-heading"><Brand /><button className="glass-icon-btn" onClick={closeMobileMenu} aria-label="Fechar menu"><X size={20} /></button></div><p className="eyebrow">O QUE VAMOS ASSISTIR?</p><nav>{links.map((link, index) => <Link key={link.to} to={link.to} onClick={closeMobileMenu} className={active(link.to) ? 'active' : ''} aria-current={active(link.to) ? 'page' : undefined}><small>0{index + 1}</small>{link.label}<ArrowUpRight size={18} /></Link>)}</nav><Link className="mobile-library-link" to="/minha-lista" onClick={closeMobileMenu}><Bookmark size={20} /><span>Suas próximas histórias<small>Organize os títulos que quer assistir.</small></span></Link></div>
    </dialog>, document.body)}
  </>;
}
