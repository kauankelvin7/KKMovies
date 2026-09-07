import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { parseWatchTarget, embedUrl, detailPath, PLAYER_PERMISSIONS } from './policy';
import type { WatchTarget } from './policy';
import './watch.css';

function WatchPage() {
  const [revision, setRevision] = useState(0);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [title, setTitle] = useState('Player KKMovies');
  let target: WatchTarget | undefined;
  try { target = parseWatchTarget(location.pathname, location.search); } catch { /* Invalid routes never mount an iframe. */ }
  const src = target ? embedUrl(target) : '';
  const back = target ? detailPath(target) : '/';
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener('online', sync); window.addEventListener('offline', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); };
  }, []);
  useEffect(() => {
    setFrameLoaded(false); setDelayed(false);
    const timer = window.setTimeout(() => setDelayed(true), 15000);
    return () => window.clearTimeout(timer);
  }, [src, revision]);
  useEffect(() => {
    if (!target) return;
    // The isolated entry reads only this ephemeral title, never the application stores.
    try {
      const saved = JSON.parse(sessionStorage.getItem('kkm-watch-title') || 'null');
      if (saved?.id === target.id && saved?.type === target.type && typeof saved.title === 'string') {
        const name = saved.title.slice(0, 200);
        setTitle(name); document.title = `${name} — KKMovies`;
      }
      sessionStorage.removeItem('kkm-watch-title');
    } catch { /* Playback also works when storage is unavailable. */ }
  }, [src]);
  if (!target) return <main className="watch-invalid"><h1>Endereço de reprodução inválido</h1><p>Escolha um título no catálogo para continuar.</p><a href="/">Voltar ao catálogo</a></main>;
  return <main className="watch-page">
    <header className="watch-toolbar"><a href={back} className="watch-back" aria-label="Voltar aos detalhes">← <span>Voltar</span></a><div className="watch-title"><h1>{title}</h1><p>{target.type === 'tv' ? target.season !== undefined ? `Temporada ${target.season}${target.episode !== undefined ? ` · Episódio ${target.episode}` : ''}` : 'Selecione a temporada no player' : 'Filme'}</p></div><button onClick={() => setRevision(value => value + 1)}>Recarregar</button></header>
    <section className="watch-stage" aria-label="Reprodução">
      {!frameLoaded && <p className="watch-loading" role="status">Carregando player…</p>}
      <iframe key={`${src}-${revision}`} src={src} title={`Player de ${title}`} allow={PLAYER_PERMISSIONS} referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setFrameLoaded(true)} />
    </section>
    <footer className="watch-help"><p role="status">{!online ? 'Você está sem conexão. Reconecte-se e recarregue o player.' : !frameLoaded && delayed ? 'O player está demorando para responder. Você pode recarregar ou voltar aos detalhes.' : 'Idioma, servidor e tela cheia estão nos controles do player.'}</p><p>O player externo pode exibir anúncios.</p></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<WatchPage />);
