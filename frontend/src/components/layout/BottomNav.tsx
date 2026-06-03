/* KauanFlix — Bottom Navigation (Mobile) v4
   4 items: Home / Buscar / Minha Lista / Recentes
   Active: accent blue */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, Clock } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/minha-lista', label: 'Minha Lista', icon: Heart },
  { to: '/explorar', label: 'Recentes', icon: Clock },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="mobile-bottom-nav md:hidden safe-bottom" aria-label="Navegação mobile">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const isActive = to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={isActive ? 'active' : ''}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
