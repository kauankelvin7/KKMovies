/* KauanFlix — Bottom Navigation (iOS Tab Bar) */
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
    <nav className="ios-tab-bar safe-bottom md:hidden" aria-label="Navegação mobile">
      <div className="ios-tab-bar-inner">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`ios-tab-bar-item ${isActive ? 'active' : ''}`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="ios-tab-bar-icon-wrap">
                {isActive && <span className="ios-tab-bar-indicator" style={{ top: -6 }} />}
                <Icon
                  className={`w-6 h-6 ${isActive ? 'ios-tab-bar-icon-active' : ''}`}
                  fill={isActive && (Icon === Heart) ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </span>
              <span className="ios-tab-bar-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};