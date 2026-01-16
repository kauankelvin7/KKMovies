import { useState } from 'react';
import { Search, Play, Star, Film } from 'lucide-react';
import movieService from '@/services/movieService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PlayerModal from '@/components/PlayerModal';
import { Movie } from '@/types/movie';

const SUPERFLIX_BASE = 'https://superflixapi.bond';

const SearchPageSimple = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  
  // Player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await movieService.search({ query: query.trim() });
      setResults(response.results);
      setSearched(true);
    } catch (err) {
      setError('Erro ao buscar filmes. Tente novamente.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPlayer = (movie: Movie) => {
    setCurrentMovie(movie);
    setPlayerOpen(true);
  };

  const getStreamUrl = (movieId: number) => {
    return `${SUPERFLIX_BASE}/filme/${movieId}?quality=1080p`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="pt-10 pb-8 px-4 md:px-12 border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center">
            <Search size={28} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Buscar
            </h1>
            <p className="text-gray-500 mt-1">Encontre filmes e séries</p>
          </div>
        </div>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-3xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite o nome do filme ou série..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
            <button 
              type="submit" 
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:hover:scale-100" 
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>
      </div>

      <div className="container-custom py-10">
        {error && <ErrorMessage message={error} />}

        {loading && <LoadingSpinner />}

        {/* Results */}
        {!loading && searched && (
          <div>
            <p className="text-gray-400 mb-6 flex items-center gap-2">
              <Film size={18} />
              <span className="text-primary-400 font-bold">{results.length}</span> resultado(s) encontrado(s) para "<span className="text-white">{query}</span>"
            </p>
            
            {results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.map((movie) => (
                  <div
                    key={movie.id}
                    className="cursor-pointer group"
                    onClick={() => openPlayer(movie)}
                  >
                    <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-dark-800">
                      {movie.poster_path ? (
                        <img
                          src={movie.poster_path}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                          <span className="text-5xl">🎬</span>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl shadow-primary-500/40">
                          <Play size={24} fill="white" className="text-white ml-1" />
                        </div>
                      </div>
                      
                      {/* Rating */}
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Star size={12} fill="#f59e0b" className="text-amber-500" />
                        {movie.vote_average?.toFixed(1)}
                      </div>
                      
                      {/* Gradient Bottom */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
                      
                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug">{movie.title}</h3>
                        {movie.release_date && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(movie.release_date).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-gray-400">Nenhum resultado encontrado</p>
                <p className="text-gray-600 mt-2">Tente buscar por outro termo</p>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!loading && !searched && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-xl text-gray-400">Busque por filmes e séries</p>
            <p className="text-gray-600 mt-2">Digite o nome no campo acima para começar</p>
          </div>
        )}
      </div>

      {/* Player Modal */}
      <PlayerModal
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
        streamUrl={currentMovie ? getStreamUrl(currentMovie.id) : ''}
        title={currentMovie?.title || ''}
      />
    </div>
  );
};

export default SearchPageSimple;
