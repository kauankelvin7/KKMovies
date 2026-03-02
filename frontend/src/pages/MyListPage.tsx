/* KauanFlix — My List / Profile Page */
import React, { useState, useMemo } from 'react';
import { Heart, Clock, CheckCircle, Trash2, Film, BarChart3 } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { myListService } from '../services/myListService';
import { watchHistoryService } from '../services/watchHistoryService';
import { useAppStore } from '../store/useAppStore';
import type { Movie, MyListItem, WatchProgress } from '../types/movie';

type Tab = 'list' | 'history' | 'stats';

function listItemToMovie(item: MyListItem): Movie {
  return {
    id: item.movieId,
    title: item.title,
    overview: '',
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    release_date: item.releaseDate,
    vote_average: item.voteAverage,
    vote_count: 0,
    popularity: 0,
    adult: false,
    original_language: 'pt',
    genres: item.genres,
  };
}

function progressToMovie(w: WatchProgress): Movie {
  return {
    id: w.movieId,
    title: w.title,
    overview: '',
    poster_path: w.posterPath,
    backdrop_path: w.backdropPath,
    release_date: '',
    vote_average: 0,
    vote_count: 0,
    popularity: 0,
    adult: false,
    original_language: 'pt',
  };
}

const MyListPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('list');
  const [, forceUpdate] = useState(0);
  const addToast = useAppStore((s) => s.addToast);

  const myList = useMemo(() => myListService.getAll(), [tab]);
  const history = useMemo(() => watchHistoryService.getAll(), [tab]);
  const inProgress = history.filter((w) => !w.completed && w.progress > 0);
  const completed = history.filter((w) => w.completed);
  const stats = useMemo(() => watchHistoryService.getStats(), [tab]);

  const handleRemoveFromList = (movieId: number) => {
    myListService.remove(movieId);
    addToast('Removido da lista', 'info');
    forceUpdate((n) => n + 1);
  };

  const handleRemoveFromHistory = (movieId: number) => {
    watchHistoryService.remove(movieId);
    addToast('Removido do histórico', 'info');
    forceUpdate((n) => n + 1);
  };

  const tabs = [
    { id: 'list' as Tab, label: 'Minha Lista', icon: Heart, count: myList.length },
    { id: 'history' as Tab, label: 'Histórico', icon: Clock, count: history.length },
    { id: 'stats' as Tab, label: 'Estatísticas', icon: BarChart3, count: null },
  ];

  return (
    <main className="min-h-screen pt-24 section-container">
      <h1 className="section-title">Perfil</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[rgba(255,255,255,0.05)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-kf-accent text-white'
                : 'border-transparent text-kf-text-muted hover:text-kf-text-secondary'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== null && (
              <span className="text-xs bg-kf-accent/20 text-kf-accent px-1.5 py-0.5 rounded-full">
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="w-16 h-16 text-kf-text-muted mb-4" />
              <h2 className="text-xl font-semibold mb-2">Lista vazia</h2>
              <p className="text-kf-text-secondary">Adicione filmes à sua lista clicando no botão +</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {myList.map((item) => (
                <div key={item.movieId} className="relative group">
                  <MovieCard movie={listItemToMovie(item)} />
                  <button
                    onClick={() => handleRemoveFromList(item.movieId)}
                    className="absolute top-2 right-2 z-20 btn-icon w-8 h-8 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remover da lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <>
          {inProgress.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-kf-info" />
                Em andamento
              </h3>
              <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {inProgress.map((w) => (
                  <div key={w.movieId} className="relative group">
                    <MovieCard movie={progressToMovie(w)} progress={w} />
                    <button
                      onClick={() => handleRemoveFromHistory(w.movieId)}
                      className="absolute top-2 right-2 z-20 btn-icon w-8 h-8 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-kf-success" />
                Concluídos
              </h3>
              <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {completed.map((w) => (
                  <div key={w.movieId} className="relative group">
                    <MovieCard movie={progressToMovie(w)} />
                    <button
                      onClick={() => handleRemoveFromHistory(w.movieId)}
                      className="absolute top-2 right-2 z-20 btn-icon w-8 h-8 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Film className="w-16 h-16 text-kf-text-muted mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhum histórico</h2>
              <p className="text-kf-text-secondary">Seus filmes assistidos aparecerão aqui</p>
            </div>
          )}
        </>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-gradient mb-1">{stats.totalWatched}</p>
            <p className="text-sm text-kf-text-secondary">Filmes assistidos</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-gradient mb-1">{stats.totalHoursWatched}h</p>
            <p className="text-sm text-kf-text-secondary">Horas assistidas</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-gradient mb-1">{myList.length}</p>
            <p className="text-sm text-kf-text-secondary">Na sua lista</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default MyListPage;
