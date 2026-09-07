import { useRef, useState, useEffect, useId, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';
import { SkeletonRow } from './ui/Skeleton';
import type { Movie } from '../types/movie';
interface Props { title: string; description?: string; movies: Movie[]; loading?: boolean; landscape?: boolean; ranked?: boolean; viewAllLink?: string; icon?: React.ReactNode; progressMap?: Map<number, { progress: number }> }
export function ContentCarousel({ title, description, movies, loading, landscape, ranked, viewAllLink }: Props) {
  const items = useMemo(() => {
    const seen = new Set<string>();
    return movies.filter(movie => {
      const key = `${movie.media_type === 'tv' ? 'tv' : 'movie'}-${movie.id}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, ranked ? 10 : 20);
  }, [movies, ranked]);
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef({ start: 0, scroll: 0, active: false, moved: false });
  const [position, setPosition] = useState({ left: false, right: false, progress: 0 });
  const label = useId();
  useEffect(() => {
    const el = rail.current; if (!el) return;
    const update = () => { const max = el.scrollWidth - el.clientWidth; setPosition({ left: el.scrollLeft > 3, right: el.scrollLeft < max - 3, progress: max > 0 ? el.scrollLeft / max : 1 }); };
    const observer = new ResizeObserver(update); observer.observe(el);
    el.addEventListener('scroll', update, { passive: true }); update();
    return () => { observer.disconnect(); el.removeEventListener('scroll', update); };
  }, [items, loading]);
  const move = (direction: number) => { const el = rail.current; if (el) el.scrollBy({ left: direction * el.clientWidth * .85, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  if (!loading && !movies.length) return null;
  return <section className={`content-shelf ${ranked ? 'ranked-shelf' : ''}`} aria-labelledby={label} aria-busy={loading || undefined}>
    <div className="shelf-heading section-container"><div className="shelf-heading-copy">{ranked && <span className="shelf-rank-label" aria-hidden="true">TOP 10</span>}<div><h2 id={label}>{title}</h2>{description && <p className="shelf-description">{description}</p>}</div></div><div className="shelf-actions">{viewAllLink && <Link to={viewAllLink}>Ver tudo <ArrowUpRight size={15} /></Link>}<button className="glass-icon-btn" onClick={() => move(-1)} disabled={!position.left || loading} aria-label={`Anteriores em ${title}`}><ChevronLeft size={18} /></button><button className="glass-icon-btn" onClick={() => move(1)} disabled={!position.right || loading} aria-label={`Próximos em ${title}`}><ChevronRight size={18} /></button></div></div>
    {loading && !movies.length ? <div className="section-container"><SkeletonRow count={6} landscape={landscape} /></div> : <div ref={rail} className={`shelf-rail ${landscape ? 'landscape-rail' : ''}`} tabIndex={0} aria-label={`${title}. Use as setas ou arraste para navegar.`}
      onKeyDown={event => { if (event.target === event.currentTarget && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}
      onDragStart={event => event.preventDefault()}
      onPointerDown={event => { if (event.pointerType !== 'mouse' || event.button !== 0) return; drag.current = { start: event.clientX, scroll: event.currentTarget.scrollLeft, active: true, moved: false }; }}
      onPointerMove={event => { const state = drag.current; if (!state.active) return; const delta = event.clientX - state.start; if (Math.abs(delta) > 7) { state.moved = true; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('dragging'); event.currentTarget.scrollLeft = state.scroll - delta; } }}
      onPointerUp={event => { drag.current.active = false; event.currentTarget.classList.remove('dragging'); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={event => { drag.current.active = false; event.currentTarget.classList.remove('dragging'); }}
      onPointerLeave={() => { if (!drag.current.moved) drag.current.active = false; }}
      onClickCapture={event => { if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); drag.current.moved = false; } }}>
      {items.map((movie, index) => <MovieCard key={`${movie.media_type}-${movie.id}`} movie={movie} rank={ranked ? index + 1 : undefined} landscape={landscape} />)}
    </div>}
    {(position.left || position.right) && <div className="shelf-footer section-container" aria-hidden="true"><div className="shelf-progress"><i style={{ transform: `translateX(${position.progress * 300}%)` }} /></div></div>}
  </section>;
}
