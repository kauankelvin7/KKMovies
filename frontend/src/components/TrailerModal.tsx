/* KauanFlix — Trailer Modal (iOS Sheet) */
import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Film, ExternalLink } from 'lucide-react';
import type { Video } from '../types/movie';
import { pickBestTrailer, buildEmbedUrl, buildSearchUrl } from '../utils/trailerUtils';

interface Props {
  isOpen: boolean;
  videos: Video[];
  title: string;
  year?: string;
  onClose: () => void;
}

export const TrailerModal: React.FC<Props> = ({ isOpen, videos, title, year, onClose }) => {
  const trailer = pickBestTrailer(videos);

  const handleKeyDown = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-6" onClick={onClose} role="dialog" aria-label={`Trailer: ${title}`}>
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: 'blur(6px)' }} />

      <div
        className="glass-modal relative w-full md:max-w-3xl animate-trailer-in"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 24 }}
      >
        {/* Puxador estilo sheet iOS (só mobile) */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div style={{ width: 36, height: 5, borderRadius: 3, background: 'var(--glass-separator)' }} />
        </div>

        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '0.5px solid var(--glass-separator)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
            <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
              {title} {trailer ? `— ${trailer.name}` : ''}
            </span>
          </div>
          <button onClick={onClose} className="ios-nav-icon-btn flex-shrink-0" aria-label="Fechar trailer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {trailer ? (
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            <iframe
              src={buildEmbedUrl(trailer.key)}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              title={`Trailer: ${title}`}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <Film className="w-16 h-16 mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Trailer não disponível</h3>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Não encontramos um trailer oficial para "{title}". Você pode buscar no YouTube.
            </p>
            <a href={buildSearchUrl(title, year)} target="_blank" rel="noopener noreferrer" className="glass-button primary flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Buscar no YouTube
            </a>
          </div>
        )}
      </div>
    </div>,
    document.getElementById('portal-root') || document.body
  );
};