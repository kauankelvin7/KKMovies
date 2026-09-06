import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, RotateCw, Maximize } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { getStreamingUrl, getSeriesStreamingUrl } from '../../services/movieService';
import { historyService } from '../../services/storageService';

export function PlayerModal() {
  const { isOpen, movieId, movieTitle, posterPath, mediaType, episodeInfo, imdbId, closePlayer } = usePlayerStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  useEffect(() => {
    if (isOpen && movieId) historyService.add({ id: movieId, type: mediaType, title: movieTitle, posterPath });
  }, [isOpen, movieId, mediaType, movieTitle, posterPath]);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, [isOpen]);
  useEffect(() => {
    setLoading(true); setSlow(false); setFullscreenError('');
    if (!isOpen) return;
    const timer = setTimeout(() => setSlow(true), 15_000);
    return () => clearTimeout(timer);
  }, [isOpen, movieId, episodeInfo, reload]);
  if (!isOpen || !movieId) return null;
  const src = mediaType === 'tv' ? getSeriesStreamingUrl(movieId, episodeInfo?.season, episodeInfo?.episode) : getStreamingUrl(movieId, imdbId);
  return createPortal(
    <dialog ref={dialog} className="cinema-player" aria-label={`Assistir ${movieTitle}`} onCancel={event => { event.preventDefault(); closePlayer(); }}>
      <div className="player-toolbar">
        <div className="min-w-0"><p className="eyebrow">AGORA NO PLAYER</p><h2 className="truncate text-lg font-semibold">{movieTitle}</h2>
          {episodeInfo && <p className="text-sm text-white/60">Temporada {episodeInfo.season} · Episódio {episodeInfo.episode}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="glass-icon-btn" aria-label="Recarregar player" onClick={() => setReload(value => value + 1)}><RotateCw size={18} /></button>
          <button className="glass-icon-btn hidden sm:flex" aria-label="Tela cheia" onClick={() => { dialog.current?.requestFullscreen?.().catch(() => setFullscreenError('Use o botão de tela cheia dentro do player.')); }}><Maximize size={18} /></button>
          <button className="glass-icon-btn" aria-label="Fechar player" onClick={closePlayer}><X size={20} /></button>
        </div>
      </div>
      <div className="player-screen">
        {loading && <div className="player-loading pointer-events-none" role="status">Carregando player…</div>}
        <iframe key={`${src}-${reload}`} src={src} title={`Player de ${movieTitle}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope; web-share" allowFullScreen onLoad={() => setLoading(false)} />
      </div>
      <div className="player-help"><span>{fullscreenError || (slow && loading ? 'O carregamento está demorando. Tente recarregar ou abrir o player.' : 'Se aparecer uma verificação, conclua dentro do player.')}</span><a href={src} target="_blank" rel="noopener noreferrer" className="glass-button">Abrir player <ExternalLink size={15} /></a></div>
    </dialog>, document.body,
  );
}
