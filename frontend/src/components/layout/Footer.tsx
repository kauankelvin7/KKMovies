import React from 'react';
import { Brand } from './Brand';
import { Link } from 'react-router-dom';
import { Github, Heart } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="border-t border-[var(--glass-separator)] mt-16 bg-[var(--surface-0)]/40 backdrop-blur-xl transition-colors duration-200">
    <div className="section-container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-muted)]">

      {/* Brand */}
      <div className="flex items-center gap-2">
        <Link to="/" className="brand-link" aria-label="KKMovies, início"><Brand /></Link>
        <span className="text-[var(--text-muted)] hidden sm:inline">—</span>
        <span className="text-[var(--text-secondary)] text-xs sm:text-sm">
          Seu cinema, do seu jeito.
        </span>
      </div>

      {/* Author & Repository */}
      <div className="flex items-center gap-4 text-xs sm:text-sm">
        <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          Feito com <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> por Kauan
        </span>

        <span className="w-1 h-1 rounded-full bg-[var(--text-hint)]" />

        <a
          href="https://github.com/kauankelvin7/"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-icon-btn !w-8 !h-8 text-[var(--text-secondary)] hover:text-white transition-colors"
          aria-label="GitHub Repository"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>

      {/* Legal & API Disclaimer */}
      <p className="text-xs text-[var(--text-hint)] text-center md:text-right max-w-xs leading-relaxed">
        Dados fornecidos por TMDB. Este projeto não hospeda conteúdo audiovisual.
      </p>

    </div>
  </footer>
);
