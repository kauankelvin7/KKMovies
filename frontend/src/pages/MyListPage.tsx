import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Clock, Search, Trash2, ArrowUpRight, CheckCheck, Play } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { watchlistService, historyService, type WatchlistItem } from '../services/storageService';
import { useAppStore } from '../store/useAppStore';
import type { Movie } from '../types/movie';
const statuses = [{ value: 'planned', label: 'Quero assistir' }, { value: 'watching', label: 'Assistindo' }, { value: 'watched', label: 'Assistido' }] as const;
export default function MyListPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'history' ? 'history' : 'list';
  const [revision, refresh] = useState(0);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('recent');
  const toast = useAppStore(state => state.addToast);
  useEffect(() => {
    document.title = 'Minha Lista — KKMovies';
    const update = () => refresh(value => value + 1);
    window.addEventListener('kkm-storage', update); window.addEventListener('storage', update);
    return () => { window.removeEventListener('kkm-storage', update); window.removeEventListener('storage', update); };
  }, []);
  const saved = useMemo(() => watchlistService.getAll(), [revision]);
  const history = useMemo(() => historyService.getAll(), [revision]);
  const items: WatchlistItem[] = tab === 'list' ? saved : history.map(item => ({ ...item, addedAt: item.watchedAt, backdropPath: null }));
  const filtered = items.filter(item => (type === 'all' || item.type === type) && (tab === 'history' || status === 'all' || (item.status || 'planned') === status) && item.title.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))).sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title, 'pt-BR') : b.addedAt - a.addedAt);
  return <main className="library-page section-container">
    <div className="page-heading"><div><p className="eyebrow">SUA COLEÇÃO, NO SEU RITMO</p><h1>Minha Lista<span className="title-dot">.</span></h1><p>Guarde descobertas. Organize o que vem depois.</p></div><Link to="/explorar" className="glass-button">Encontrar títulos <ArrowUpRight size={17} /></Link></div>
    <div className="library-summary">{[{ icon: Bookmark, count: saved.filter(item => !item.status || item.status === 'planned').length, label: 'Quero assistir' }, { icon: Play, count: saved.filter(item => item.status === 'watching').length, label: 'Assistindo' }, { icon: CheckCheck, count: saved.filter(item => item.status === 'watched').length, label: 'Assistidos' }].map(({ icon: Icon, count, label }) => <div key={label}><Icon size={20}/><strong>{count}</strong><span>{label}</span></div>)}</div>
    <div className="library-tabs"><button className={tab === 'list' ? 'active' : ''} onClick={() => setParams({})}><Bookmark size={17}/> Salvos <span>{saved.length}</span></button><button className={tab === 'history' ? 'active' : ''} onClick={() => setParams({ tab: 'history' })}><Clock size={17}/> Acessos recentes <span>{history.length}</span></button></div>
    <div className="collection-toolbar">
      <label className="collection-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar na sua coleção" aria-label="Buscar na sua coleção" /></label>
      <select aria-label="Tipo de título" value={type} onChange={e => setType(e.target.value)}><option value="all">Filmes e séries</option><option value="movie">Filmes</option><option value="tv">Séries</option></select>
      {tab === 'list' && <select aria-label="Filtrar por status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos os status</option>{statuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>}
      <select aria-label="Ordenação" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Mais recentes</option><option value="title">Título A–Z</option></select>
    </div>
    <div className="collection-count"><span>{filtered.length} {filtered.length === 1 ? 'título' : 'títulos'}</span><span>{tab === 'history' ? 'O histórico registra acesso ao player, não tempo assistido.' : 'Você define o status de cada título.'}</span></div>
    {!filtered.length ? <div className="collection-empty"><Bookmark size={35}/><h2>{items.length ? 'Nenhum título com esses filtros' : tab === 'list' ? 'Seu próximo favorito começa aqui.' : 'Suas histórias vão aparecer aqui.'}</h2><p>{items.length ? 'Experimente outro nome ou ajuste os filtros.' : tab === 'list' ? 'Toque em + nos filmes e séries para guardar na sua lista.' : 'Os títulos que você abrir no player ficam salvos neste espaço.'}</p>{items.length ? <button className="glass-button" onClick={() => { setQuery(''); setType('all'); setStatus('all'); }}>Limpar filtros</button> : <Link className="glass-button primary" to="/explorar">Explorar catálogo <ArrowUpRight size={16}/></Link>}</div> : <div className="catalog-grid library-grid">{filtered.map(item => {
      const movie: Movie = { id: item.id, title: item.title, overview: '', poster_path: item.posterPath, backdrop_path: item.backdropPath, release_date: item.releaseDate || '', vote_average: item.voteAverage || 0, vote_count: 0, popularity: 0, adult: false, original_language: 'pt', media_type: item.type };
      return <article className="library-item" key={`${item.type}-${item.id}`}><MovieCard movie={movie}/><div className="library-item-controls">{tab === 'list' ? <select aria-label={`Status de ${item.title}`} value={item.status || 'planned'} onChange={event => { watchlistService.setStatus(item.id, item.type, event.target.value as NonNullable<WatchlistItem['status']>); toast('Status atualizado', 'success'); }}>{statuses.map(state => <option key={state.value} value={state.value}>{state.label}</option>)}</select> : <span>{new Date(item.addedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}<button aria-label={`Remover ${item.title} ${tab === 'list' ? 'da lista' : 'do histórico'}`} onClick={() => { if (tab === 'list') watchlistService.remove(item.id, item.type); else historyService.remove(item.id, item.type); toast('Título removido', 'info'); }}><Trash2 size={16}/></button></div></article>;
    })}</div>}
  </main>;
}
