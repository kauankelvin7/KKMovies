/* KauanFlix — Trailer Modal v4
   Embeds YouTube trailers. Shows fallback "Buscar no YouTube" when no trailer found.
   Priority: Official PT-BR Trailer > Official Trailer > Teaser > any YouTube. */

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

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
    <div
      className="trailer-overlay"
      onClick={onClose}
      role="dialog"
      aria-label={`Trailer: ${title}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="trailer-modal animate-trailer-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="trailer-header">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-4 h-4 text-kf-accent flex-shrink-0" />
            <span className="text-sm text-kf-text-secondary truncate">
              {title} {trailer ? `— ${trailer.name}` : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-icon w-9 h-9 bg-white/5 hover:bg-kf-accent/30 flex-shrink-0"
            aria-label="Fechar trailer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {trailer ? (
          <div className="trailer-video-wrap">
            <iframe
              src={buildEmbedUrl(trailer.key)}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              title={`Trailer: ${title}`}
            />
          </div>
        ) : (
          /* Fallback — no trailer found */
          <div className="trailer-fallback">
            <Film className="w-16 h-16 text-kf-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Trailer não disponível</h3>
            <p className="text-sm text-kf-text-secondary mb-6 text-center max-w-sm">
              Não encontramos um trailer oficial para "{title}". Você pode buscar no YouTube.
            </p>
            <a
              href={buildSearchUrl(title, year)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2"
            >
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
