/* KauanFlix — Footer */
import React from 'react';
import { Github, Heart } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="border-t border-[rgba(255,255,255,0.05)] mt-16">
    <div className="section-container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-kf-text-muted">
      <div className="flex items-center gap-2">
        <span className="font-display text-lg text-gradient">KAUANFLIX</span>
        <span className="text-kf-text-muted">— Seu cinema, do seu jeito.</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          Feito com <Heart className="w-3 h-3 text-kf-danger" fill="currentColor" /> por Kauan
        </span>
        <a
          href="https://github.com/kauankelvin7/KKMovies"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
          aria-label="GitHub"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>

      <p className="text-xs text-kf-text-muted">
        Dados fornecidos por TMDB. Este projeto não hospeda conteúdo audiovisual.
      </p>
    </div>
  </footer>
);
