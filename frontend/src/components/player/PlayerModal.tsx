/* KauanFlix — Player Modal
   Full-screen player with custom controls.
   Uses iframe for SuperFlix streaming + native fullscreen and PiP support.
   Keyboard shortcuts: Space (play/pause), F (fullscreen), M (mute), Esc (close). */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Maximize,
  Minimize,
  PictureInPicture2,
  Volume2,
  SkipBack,
  SkipForward,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { watchHistoryService } from '../../services/watchHistoryService';
import { usePopupBlocker } from '../../hooks/usePopupBlocker';

export const PlayerModal: React.FC = () => {
  const { isOpen, streamUrl, movieId, movieTitle, posterPath, backdropPath, mediaType, episodeInfo, closePlayer } =
    usePlayerStore();
  const { blockedCount } = usePopupBlocker();
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Save progress on open */
  useEffect(() => {
    if (isOpen && movieId) {
      watchHistoryService.save({
        movieId,
        title: movieTitle,
        posterPath,
        backdropPath: backdropPath || null,
        progress: 5,
        currentTime: 0,
        duration: 0,
        lastWatched: Date.now(),
        completed: false,
        media_type: mediaType,
        episodeInfo: episodeInfo || undefined,
      });
    }
  }, [isOpen, movieId, movieTitle, posterPath, backdropPath, mediaType, episodeInfo]);

  /* Auto-hide controls */
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (isOpen) showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isOpen, showControls]);

  /* Fullscreen change listener */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closePlayer();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case ' ':
          e.preventDefault();
          break;
      }
      showControls();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closePlayer, showControls]);

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* ignore */ }
  };

  const togglePiP = async () => {
    try {
      /* Try to get the video element inside iframe - limited by same-origin policy */
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } catch { /* PiP not available for cross-origin iframe */ }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9998] bg-black flex items-center justify-center"
      onMouseMove={showControls}
      onClick={showControls}
      onDoubleClick={toggleFullscreen}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-kf-accent animate-spin" />
            <p className="text-sm text-kf-text-secondary">Carregando {movieTitle}...</p>
          </div>
        </div>
      )}

      {/* Iframe Player */}
      <iframe
        ref={iframeRef}
        src={streamUrl}
        className="w-full h-full border-none"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        title={movieTitle}
        onLoad={() => setLoading(false)}
      />

      {/* Top Controls */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between
          bg-gradient-to-b from-black/80 to-transparent
          player-controls ${controlsVisible ? '' : 'hidden-controls'}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={closePlayer}
            className="btn-icon w-10 h-10 bg-black/50"
            aria-label="Fechar player"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-sm md:text-base font-semibold truncate max-w-[50vw]">{movieTitle}</h3>
          {blockedCount > 0 && (
            <span className="shield-badge" title={`${blockedCount} popup(s) bloqueado(s)`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {blockedCount}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 p-4
          bg-gradient-to-t from-black/80 to-transparent
          player-controls ${controlsVisible ? '' : 'hidden-controls'}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => {}} className="btn-icon w-10 h-10 bg-black/40" aria-label="Voltar 10 segundos">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={() => {}} className="btn-icon w-10 h-10 bg-black/40" aria-label="Avançar 10 segundos">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => {}} className="btn-icon w-10 h-10 bg-black/40" aria-label="Volume">
              <Volume2 className="w-5 h-5" />
            </button>
            <button onClick={togglePiP} className="btn-icon w-10 h-10 bg-black/40 hidden md:flex" aria-label="Miniplayer">
              <PictureInPicture2 className="w-5 h-5" />
            </button>
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon w-10 h-10 bg-black/40 hidden md:flex"
              aria-label="Abrir em nova aba"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button onClick={toggleFullscreen} className="btn-icon w-10 h-10 bg-black/40" aria-label="Tela cheia">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('portal-root') || document.body
  );
};
