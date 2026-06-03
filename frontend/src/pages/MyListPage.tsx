/* KauanFlix — My List / Profile Page v4 */
import React, { useState, useMemo } from 'react';
import { Heart, Clock, BarChart3, Trash2, Film } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { watchlistService, historyService } from '../services/storageService';
import { useAppStore } from '../store/useAppStore';
import type { Movie } from '../types/movie';

type Tab = 'list' | 'history' | 'stats';

const MyListPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('list');
  const [, forceUpdate] = useState(0);
  const addToast = useAppStore((s) => s.addToast);

  const myList = useMemo(() => watchlistService.getAll(), [tab]);
  const history = useMemo(() => historyService.getAll(), [tab]);

  const handleRemoveFromList = (id: number) => {
    watchlistService.remove(id);
    addToast('Removido da lista', 'info');
    forceUpdate((n) => n + 1);
  };

  const tabs = [
    { id: 'list' as Tab, label: 'Minha Lista', icon: Heart, count: myList.length },
    { id: 'history' as Tab, label: 'Histórico', icon: Clock, count: history.length },
    { id: 'stats' as Tab, label: 'Stats', icon: BarChart3, count: null },
  ];

  return (
    <main
      className="min-h-screen"
      style={{
        paddingTop: 100,
        paddingBottom: 80,
        paddingLeft: 'clamp(16px, 5vw, 80px)',
        paddingRight: 'clamp(16px, 5vw, 80px)',
      }}
    >
      <h1
        style={{ fontWeight: 300, fontSize: 'clamp(24px, 3vw, 40px)', marginBottom: 32 }}
      >
        Perfil
      </h1>

      {/* Tabs */}
      <div className="detail-tabs mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`detail-tab ${tab === t.id ? 'active' : ''}`}
          >
            <t.icon className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span
                className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(74,144,217,0.15)', color: '#4A90D9' }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My List Tab */}
      {tab === 'list' && (
        <>
          {myList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Heart className="w-14 h-14 mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <h2 style={{ fontWeight: 300, fontSize: 20, marginBottom: 8 }}>Lista vazia</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
                Adicione filmes à sua lista clicando no botão +
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 12,
              }}
            >
              {myList.map((item) => {
                const movie: Movie = {
                  id: item.id,
                  title: item.title,
                  overview: '',
                  poster_path: item.posterPath,
                  backdrop_path: item.backdropPath,
                  release_date: item.releaseDate || '',
                  vote_average: item.voteAverage || 0,
                  vote_count: 0,
                  popularity: 0,
                  adult: false,
                  original_language: 'pt',
                  media_type: item.type,
                };
                return (
                  <div key={item.id} className="relative group">
                    <MovieCard movie={movie} />
                    <button
                      onClick={() => handleRemoveFromList(item.id)}
                      className="absolute top-2 right-2 z-20 btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ width: 28, height: 28, background: 'rgba(239,68,68,0.8)' }}
                      aria-label="Remover da lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Film className="w-14 h-14 mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <h2 style={{ fontWeight: 300, fontSize: 20, marginBottom: 8 }}>Nenhum histórico</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
                Seus filmes assistidos aparecerão aqui
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 12,
              }}
            >
              {history.slice(0, 50).map((h) => {
                const movie: Movie = {
                  id: h.id,
                  title: h.title,
                  overview: '',
                  poster_path: h.posterPath,
                  backdrop_path: null,
                  release_date: '',
                  vote_average: 0,
                  vote_count: 0,
                  popularity: 0,
                  adult: false,
                  original_language: 'pt',
                  media_type: h.type,
                };
                return <MovieCard key={h.id} movie={movie} />;
              })}
            </div>
          )}
        </>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ maxWidth: 600 }}>
          <div className="glass rounded-xl p-6 text-center">
            <p style={{ fontSize: 36, fontWeight: 300, color: '#4A90D9', marginBottom: 4 }}>
              {history.length}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Assistidos</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <p style={{ fontSize: 36, fontWeight: 300, color: '#4A90D9', marginBottom: 4 }}>
              {myList.length}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Na lista</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <p style={{ fontSize: 36, fontWeight: 300, color: '#C9973A', marginBottom: 4 }}>
              {history.filter((h) => Date.now() - h.watchedAt < 7 * 24 * 60 * 60 * 1000).length}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Essa semana</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default MyListPage;
