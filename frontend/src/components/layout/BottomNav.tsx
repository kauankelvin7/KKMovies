/* KauanFlix — Mobile Bottom Navigation */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Compass, Heart } from 'lucide-react';

const BOTTOM_LINKS = [
  { to: '/', label: 'Início', icon: Home, exact: true },
  { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/explorar', label: 'Explorar', icon: Compass },
  { to: '/minha-lista', label: 'Minha Lista', icon: Heart },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="mobile-bottom-nav md:hidden" aria-label="Navegação inferior">
      {BOTTOM_LINKS.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon className="w-5 h-5" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
