import { NavLink } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
import { remoteKey } from '../../tv/navigation';
import { Home, Film, Tv, Search, Compass, Bookmark, Trophy, Settings, Menu, ChevronLeft, X } from 'lucide-react';
import { Brand } from './Brand';
import { useAppStore } from '../../store/useAppStore';

const links = [
  { to: '/', label: 'Início', icon: Home }, { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/filmes', label: 'Filmes', icon: Film }, { to: '/series', label: 'Séries', icon: Tv },
  { to: '/explorar', label: 'Explorar', icon: Compass }, { to: '/top10', label: 'Top 10', icon: Trophy },
  { to: '/minha-lista', label: 'Minha lista', icon: Bookmark },
];
export function TVSidebar({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const openSettings = useAppStore(state => state.openSettings);
  const panel = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    (panel.current?.querySelector<HTMLElement>('[aria-current="page"]') || panel.current?.querySelector<HTMLElement>('nav a'))?.focus();
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [open]);
  return <>
    <button type="button" className="tv-menu-indicator" hidden={open} onClick={onOpen} aria-label="Abrir menu de navegação. Use a seta esquerda no início da linha ou pressione OK aqui." aria-expanded={open} aria-controls="tv-navigation">
      <Menu aria-hidden="true" size={26}/><span>Menu</span><ChevronLeft aria-hidden="true" size={22}/>
    </button>
    {open && <div className="tv-menu-backdrop" aria-hidden="true" onClick={onClose}/>}
    <aside id="tv-navigation" ref={panel} hidden={!open} className="tv-sidebar" role="dialog" aria-modal={open ? true : undefined} aria-label="Menu de navegação" onKeyDown={event => {
      const key = remoteKey(event.key, event.keyCode);
      if (key === 'Escape' || key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (key === 'Tab') {
        const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('a, button') || []);
        const index = items.indexOf(document.activeElement as HTMLElement);
        event.preventDefault(); items[(index + (event.shiftKey ? items.length - 1 : 1)) % items.length]?.focus();
      }
    }}><div className="tv-sidebar-heading"><Brand /><button type="button" onClick={onClose} aria-label="Fechar menu"><X aria-hidden="true" size={24}/></button></div><nav aria-label="Navegação principal">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={onClose}><Icon aria-hidden="true" size={24}/><span>{label}</span></NavLink>)}<button onClick={() => { onClose(); openSettings(); }}><Settings aria-hidden="true" size={24}/>Preferências</button></nav><p>↑ ↓ Navegar · OK Selecionar<br/>→ ou Voltar: fechar menu</p></aside></>;
}
