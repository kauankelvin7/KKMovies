import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getImageUrl } from '../services/movieService';
import type { Movie } from '../types/movie';

export function CatalogSpotlight({ movie, label = 'Vale uma sessão' }: { movie?: Movie; label?: string }) {
  if (!movie?.backdrop_path) return null;
  const title = movie.title || movie.name;
  return <section className="catalog-spotlight section-container" aria-label={`${label}: ${title}`}>
    <Link to={`/${movie.media_type === 'tv' ? 'series' : 'filme'}/${movie.id}`} className="spotlight-card">
      <img src={getImageUrl(movie.backdrop_path, 'w1280')} alt="" loading="lazy" decoding="async" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
      <div className="spotlight-copy"><span className="eyebrow">{label}</span><h2>{title}</h2><p>{movie.overview}</p><span className="spotlight-cta">Conhecer o título <ArrowRight size={17} /></span></div>
    </Link>
  </section>;
}
