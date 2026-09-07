import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpRight } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { historyService } from '../../services/storageService';
import { watchPath } from '../../player/policy';
import { Artwork } from '../Artwork';

export function PlayerModal() {
  const { isOpen, movieId, movieTitle, posterPath, backdropPath, mediaType, episodeInfo, closePlayer } = usePlayerStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, [isOpen]);
  if (!isOpen || !movieId) return null;
  const launch = () => {
    try {
      const path = watchPath({ id: movieId, type: mediaType, season: episodeInfo?.season, episode: episodeInfo?.episode });
      try { sessionStorage.setItem('kkm-watch-title', JSON.stringify({ id: movieId, type: mediaType, title: movieTitle })); } catch { /* Optional display metadata. */ }
      historyService.add({ id: movieId, type: mediaType, title: movieTitle, posterPath });
      // Replace the active document; the watch entry never imports catalog stores.
      window.location.assign(path);
    } catch { setError('Não foi possível abrir este título. Volte aos detalhes e tente novamente.'); }
  };
  return createPortal(
    <dialog ref={dialog} className="cinema-player playback-dialog" aria-labelledby="playback-title" onCancel={event => { event.preventDefault(); closePlayer(); }} onClick={event => { if (event.target === event.currentTarget) closePlayer(); }}>
      <div className="player-toolbar"><div className="min-w-0"><p className="eyebrow">ASSISTIR</p><h2 id="playback-title" className="truncate text-lg font-semibold">{movieTitle}</h2>{episodeInfo && <p className="text-sm text-white/60">Temporada {episodeInfo.season} · Episódio {episodeInfo.episode}</p>}</div><button className="glass-icon-btn" aria-label="Fechar" onClick={closePlayer}><X size={20}/></button></div>
      <div className="playback-summary"><Artwork paths={[backdropPath, posterPath]} title={movieTitle} size="w780" className="playback-art"/><div><h3>Pronto para assistir</h3><p>Abra o player para escolher as opções de áudio e servidor disponíveis para este título.</p><button className="glass-button primary" onClick={launch}>Abrir player <ArrowUpRight size={17}/></button>{error && <p role="alert">{error}</p>}</div></div>
    </dialog>, document.body,
  );
}
