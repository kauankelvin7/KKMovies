import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const collections = [
  { name: 'Ação', movie: 28, tv: 10759, note: 'Adrenalina em cena', tone: 'ember' },
  { name: 'Comédia', movie: 35, tv: 35, note: 'Uma pausa para rir', tone: 'honey' },
  { name: 'Drama', movie: 18, tv: 18, note: 'Histórias que ficam', tone: 'plum' },
  { name: 'Ficção e fantasia', movie: 878, tv: 10765, note: 'Além do possível', tone: 'ocean' },
  { name: 'Animação', movie: 16, tv: 16, note: 'Outras formas de imaginar', tone: 'forest' },
  { name: 'Mistério', movie: 9648, tv: 9648, note: 'Junte as pistas', tone: 'slate' },
];

export function CatalogCollections({ type = 'movie' }: { type?: 'movie' | 'tv' }) {
  return <section className="catalog-collections section-container" aria-label="Explorar por gênero">
    <div className="collection-heading"><h2>Qual é o seu clima hoje?</h2><Link to={`/explorar?type=${type}`}>Todos os gêneros <ArrowUpRight size={16} /></Link></div>
    <div className="collection-links">{collections.map(item => <Link key={item.name} className={`collection-tile tone-${item.tone}`} to={`/explorar?type=${type}&genre=${item[type]}`}><span>{item.note}</span><strong>{item.name}</strong><ArrowUpRight size={19} aria-hidden="true" /></Link>)}</div>
  </section>;
}
