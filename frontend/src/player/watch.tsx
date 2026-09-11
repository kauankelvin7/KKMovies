import { useCallback, useEffect, useRef, useState } from 'react';
import { enterFullscreen, leaveFullscreen, fullscreenElement } from './fullscreen';
import { useTVMode } from '../hooks/useTVMode';
import { useTVNavigation } from '../hooks/useTVNavigation';
import { createRoot } from 'react-dom/client';
import { BlockerInstall } from '../components/BlockerInstall';
import { ArrowLeft, Maximize, Minimize, RotateCw, CircleHelp, X, LoaderCircle } from 'lucide-react';
import { parseWatchTarget, embedUrl, detailPath, PLAYER_PERMISSIONS } from './policy';
import type { WatchTarget } from './policy';
import './watch.css';
import '../tv.css';

function WatchPage() {
  const [revision, setRevision] = useState(0);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [title, setTitle] = useState('Player KKMovies');
  const page = useRef<HTMLElement>(null);
  const fullscreenButton = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const exitExpanded = useCallback(async () => {
    try { await leaveFullscreen(); setExpanded(false); setFullscreenNotice(''); requestAnimationFrame(() => fullscreenButton.current?.focus()); }
    catch { setFullscreenNotice('Use Voltar ou Escape do navegador para sair da tela cheia.'); }
  }, []);
  const expand = async () => {
    if (!page.current) return;
    // Called directly by OK/click: fullscreen requires a user gesture.
    const native = await enterFullscreen(page.current);
    setExpanded(true);
    setFullscreenNotice(native ? '' : 'Player ampliado. Este navegador não permitiu ocultar suas barras.');
  };
  useEffect(() => {
    const sync = () => { if (!fullscreenElement()) { setExpanded(false); requestAnimationFrame(() => fullscreenButton.current?.focus()); } };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync); };
  }, []);
  let target: WatchTarget | undefined;
  try { target = parseWatchTarget(location.pathname, location.search); } catch { /* Invalid routes never mount an iframe. */ }
  const src = target ? embedUrl(target) : '';
  const back = target ? detailPath(target) : '/';
  const { isTV } = useTVMode();
  const goBack = useCallback(() => { if (expanded || fullscreenElement()) void exitExpanded(); else if (helpOpen) setHelpOpen(false); else location.assign(back); }, [back, expanded, exitExpanded, helpOpen]);
  useTVNavigation(isTV, src, goBack);
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
  return <main ref={page} className={`watch-page${expanded ? ' watch-expanded' : ''}`}>
    {expanded && <button className="watch-exit-fullscreen" onClick={() => void exitExpanded()}><Minimize size={20} aria-hidden="true"/>Sair da tela cheia</button>}
    {fullscreenNotice && <p className="watch-fullscreen-notice" role="status">{fullscreenNotice}</p>}
    <header className="watch-toolbar">
      <a href={back} className="watch-back" aria-label="Voltar aos detalhes"><ArrowLeft size={22} aria-hidden="true"/><span>Voltar</span></a>
      <div className="watch-title"><span className="watch-eyebrow">KKMOVIES <i/> {target.type === 'tv' ? 'SÉRIE' : 'FILME'}</span><h1>{title}</h1><p>{target.type === 'tv' ? target.season !== undefined ? `Temporada ${target.season}${target.episode !== undefined ? ` · Episódio ${target.episode}` : ''}` : 'Temporadas disponíveis no player' : 'Seu cinema, do seu jeito.'}</p></div>
      <div className="watch-actions">
        <button className="watch-icon-button" aria-label="Recarregar player" title="Recarregar player" onClick={() => setRevision(value => value + 1)}><RotateCw size={21} aria-hidden="true"/></button>
        <button className="watch-icon-button" aria-label={helpOpen ? 'Fechar ajuda' : 'Ajuda com a reprodução'} title="Ajuda" aria-expanded={helpOpen} aria-controls="watch-help-panel" onClick={() => setHelpOpen(value => !value)}>{helpOpen ? <X size={21} aria-hidden="true"/> : <CircleHelp size={21} aria-hidden="true"/>}</button>
        <button ref={fullscreenButton} className="watch-fullscreen" onClick={() => void expand()}><Maximize size={21} aria-hidden="true"/><span>Tela cheia</span></button>
      </div>
    </header>
    <section className="watch-stage" aria-label="Reprodução">
      {!frameLoaded && <div className="watch-loading" role="status"><LoaderCircle size={32} aria-hidden="true"/><strong>Preparando sua sessão</strong><span>Carregando o player…</span></div>}
      <iframe key={`${src}-${revision}`} src={src} title={`Player de ${title}`} allow={PLAYER_PERMISSIONS} allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setFrameLoaded(true)} />
    </section>
    <footer className="watch-help"><p role="status">{!online ? 'Sem conexão. Reconecte-se e use Recarregar.' : !frameLoaded && delayed ? 'Está demorando mais que o esperado. Tente recarregar o player.' : 'Áudio e legendas: use as opções disponíveis no vídeo.'}</p>{isTV && <p className="watch-remote-hint"><kbd>↑ ↓ ← →</kbd> Navegar <kbd>OK</kbd> Selecionar</p>}</footer>
    <section id="watch-help-panel" className="watch-help-panel" hidden={!helpOpen || expanded} aria-label="Ajuda com a reprodução"><h2>Precisa de ajuda?</h2><p>Use Recarregar se o vídeo não responder. Áudio, legendas e servidores dependem das opções oferecidas pelo player.</p><BlockerInstall /><p>O player externo pode exibir anúncios. Se aparecer “Acesso bloqueado para este site”, a origem de reprodução não foi autorizada pelo provedor.</p></section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<WatchPage />);
