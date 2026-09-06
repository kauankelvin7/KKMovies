import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, RotateCw, Film, Tv, Bookmark } from 'lucide-react';
import { HeroBanner } from '../components/HeroBanner';
import { ContentCarousel } from '../components/ContentCarousel';
import { ErrorMessage } from '../components/ui/ErrorBoundary';
import { useHomeMovies } from '../hooks/useMovies';
import { historyService } from '../services/storageService';
import type { Movie } from '../types/movie';
export default function HomePage() {
  const data = useHomeMovies();
  const [revision, setRevision] = useState(0);
  useEffect(() => { const refresh = () => setRevision(value => value + 1); window.addEventListener('kkm-storage', refresh); return () => window.removeEventListener('kkm-storage', refresh); }, []);
  const recent = useMemo<Movie[]>(() => historyService.getRecent(12).map(item => ({ id: item.id, title: item.title, overview: '', poster_path: item.posterPath, backdrop_path: null, release_date: '', vote_average: 0, vote_count: 0, popularity: 0, adult: false, original_language: '', media_type: item.type })), [revision]);
  const featured = data.trending.length ? data.trending : data.popular.length ? data.popular : data.series;
  const unique = (items: Movie[]) => items.filter((item, index, all) => all.findIndex(other => other.id === item.id && other.media_type === item.media_type) === index);
  const popular = data.popular.filter(item => !data.trending.slice(0, 10).some(other => item.id === other.id));
  if (data.error && !data.loading && ![...featured, ...data.topRated, ...data.nowPlaying, ...data.actionMovies, ...data.comedyMovies].length) return <main><ErrorMessage message={data.error} onRetry={data.refetch}/></main>;
  return <main className="home-page">
    <HeroBanner movies={featured} loading={data.loading}/>
    <div className="home-discovery section-container"><span>Explore o catálogo</span><div><Link to="/filmes"><Film size={16}/> Filmes <ArrowUpRight size={14}/></Link><Link to="/series"><Tv size={16}/> Séries <ArrowUpRight size={14}/></Link><Link to="/minha-lista"><Bookmark size={16}/> Minha lista <ArrowUpRight size={14}/></Link></div></div>
    {data.error && <div className="section-container"><div className="catalog-notice" role="status"><span>{data.error} As outras seleções continuam disponíveis.</span><button onClick={data.refetch} disabled={data.loading}><RotateCw size={15}/> Tentar novamente</button></div></div>}
    <div className="home-shelves">
      <ContentCarousel title="Em alta esta semana" movies={data.trending.slice(0, 10)} ranked loading={data.pending.includes('trending')} viewAllLink="/top10"/>
      {recent.length > 0 && <ContentCarousel title="Vistos recentemente" movies={recent} viewAllLink="/minha-lista?tab=history"/>}
      <ContentCarousel title="Filmes populares" movies={unique(popular)} loading={data.pending.includes('popular')} viewAllLink="/filmes"/>
      <ContentCarousel title="Séries em alta" movies={data.series} loading={data.pending.includes('series')} viewAllLink="/series"/>
      <ContentCarousel title="Lançamentos" movies={data.nowPlaying} loading={data.pending.includes('nowPlaying')}/>
      <ContentCarousel title="Mais bem avaliados" movies={data.topRated} loading={data.pending.includes('topRated')}/>
      <ContentCarousel title="Ação" movies={data.actionMovies} loading={data.pending.includes('actionMovies')}/>
      <ContentCarousel title="Comédias" movies={data.comedyMovies} loading={data.pending.includes('comedyMovies')}/>
    </div>
  </main>;
}
