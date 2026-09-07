import { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Plus, Check, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl, getStreamingUrl, getSeriesStreamingUrl } from '../services/movieService';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { watchlistService } from '../services/storageService';
import type { Movie } from '../types/movie';

export function HeroBanner({ movies, loading }: { movies: Movie[]; loading?: boolean }) {
  const picks = useMemo(() => movies.filter(movie => movie.backdrop_path).slice(0, 5), [movies]);
  const [index, setIndex] = useState(0);
  const [inList, setInList] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || hovered || reducedMotion || picks.length < 2) return;
    const timer = setInterval(() => { if (!document.hidden) setIndex(value => (value + 1) % picks.length); }, 8000);
    return () => clearInterval(timer);
  }, [paused, hovered, reducedMotion, picks.length]);
  const movie = picks[index % Math.max(picks.length, 1)];
  const openPlayer = usePlayerStore(state => state.openPlayer);
  const toast = useAppStore(state => state.addToast);
  useEffect(() => {
    const update = () => { if (movie) setInList(watchlistService.isInList(movie.id, movie.media_type === 'tv' ? 'tv' : 'movie')); };
    update(); window.addEventListener('kkm-storage', update); window.addEventListener('storage', update);
    return () => { window.removeEventListener('kkm-storage', update); window.removeEventListener('storage', update); };
  }, [movie]);
  if (!movie && loading) return <section className="cinema-hero" aria-label="Carregando destaques" aria-busy="true"><div className="cinema-hero-content section-container"><p className="eyebrow">CARREGANDO DESTAQUES</p><div className="hero-loading-content"><div className="loading-title skeleton"/><div className="loading-line skeleton"/><div className="loading-line skeleton"/><div className="loading-actions skeleton"/></div></div></section>;
  if (!movie) return <section className="section-container pt-32 pb-10"><p className="eyebrow">KKMOVIES</p><h1 className="hero-title">Filmes e séries para explorar.</h1><Link className="glass-button mt-6" to="/explorar">Explorar catálogo <ArrowRight size={18} /></Link></section>;
  const isTV = movie.media_type === 'tv';
  const title = movie.title || movie.name || '';
  const toggleList = () => {
    const added = watchlistService.toggle({ id: movie.id, type: isTV ? 'tv' : 'movie', title, posterPath: movie.poster_path, backdropPath: movie.backdrop_path, voteAverage: movie.vote_average, releaseDate: movie.release_date });
    setInList(added); toast(added ? 'Adicionado à sua lista' : 'Removido da sua lista', 'success');
  };
  return <section className="cinema-hero" aria-label="Destaques do catálogo" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false); }} onTouchStart={event => { const point = event.touches[0]; touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null; }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={event => { const start = touch.current; touch.current = null; if (!start || picks.length < 2) return; const point = event.changedTouches[0]; const delta = point.clientX - start.x; if (Math.abs(delta) > 55 && Math.abs(delta) > Math.abs(point.clientY - start.y) * 1.5) { setIndex(value => (value + (delta < 0 ? 1 : picks.length - 1)) % picks.length); setPaused(true); } }}>
    <img key={movie.id} className="cinema-hero-art" src={getImageUrl(movie.backdrop_path, 'w1280')} alt="" fetchPriority="high" decoding="async" />
    <div className="cinema-hero-shade" />
    {picks.length > 1 && !reducedMotion && <button className="hero-pause absolute right-6 top-24 z-10" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? 'Retomar slides' : 'Pausar slides'}</button>}
    <div className="cinema-hero-content section-container">
      <p className="eyebrow"><span className="live-dot" /> EM DESTAQUE · {isTV ? 'SÉRIE' : 'FILME'}</p>
      <h1 className="hero-title">{title}</h1>
      <div className="hero-metadata"><span>{(movie.release_date || movie.first_air_date || '').slice(0, 4)}</span>{movie.vote_average > 0 && <span className="text-amber-200">★ {movie.vote_average.toFixed(1)}</span>}<span>{isTV ? 'Série' : 'Filme'}</span></div>
      <p className="hero-synopsis">{movie.overview}</p>
      <div className="hero-actions">
        <button className="glass-button primary" onClick={() => openPlayer({ streamUrl: isTV ? getSeriesStreamingUrl(movie.id) : getStreamingUrl(movie.id, movie.imdb_id), movieId: movie.id, movieTitle: title, posterPath: movie.poster_path || '', backdropPath: movie.backdrop_path || '', mediaType: isTV ? 'tv' : 'movie', imdbId: movie.imdb_id })}><Play size={19} fill="currentColor" /> Assistir agora</button>
        <button className="glass-button" onClick={toggleList} aria-pressed={inList}>{inList ? <Check size={19} /> : <Plus size={19} />} Minha lista</button>
        <Link className="hero-details" to={`/${isTV ? 'series' : 'filme'}/${movie.id}`}>Detalhes <ArrowRight size={17} /></Link>
      </div>
    </div>
    {picks.length > 1 && <div className="hero-pagination section-container"><span className="text-xs tracking-widest text-white/60">{String(index % picks.length + 1).padStart(2, '0')} <span className="text-white/30">/ {String(picks.length).padStart(2, '0')}</span></span><div className="flex items-center gap-2">{picks.map((pick, i) => <button key={pick.id} className={`hero-page ${i === index % picks.length ? 'active' : ''}`} aria-label={`Mostrar ${pick.title || pick.name}`} aria-pressed={i === index % picks.length} onClick={() => setIndex(i)} />)}<button className="glass-icon-btn" aria-label="Destaque anterior" onClick={() => setIndex((index + picks.length - 1) % picks.length)}><ChevronLeft size={17} /></button><button className="glass-icon-btn" aria-label="Próximo destaque" onClick={() => setIndex((index + 1) % picks.length)}><ChevronRight size={17} /></button></div></div>}
  </section>;
}
