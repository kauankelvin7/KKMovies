import { useEffect, useState, useRef, memo } from 'react';
import { Tv, Sparkles, Sword, Laugh, Search as SearchIcon, Drama, Users, Baby, Eye, Newspaper, Film, Rocket, Heart, Mic, Flag, TrendingUp, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ContentCarousel from '@/components/ContentCarousel';
import api from '@/services/api';
import { watchHistoryService } from '@/services/watchHistoryService';
import { useTheme } from '@/App';

const SUPERFLIX_BASE = 'https://superflixapi.bond';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface Serie {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  overview: string;
  first_air_date: string;
  number_of_seasons?: number;
  genre_ids?: number[];
}

interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
}

interface Genre {
  id: number;
  name: string;
}

// Mapa de ícones para gêneros
const genreIconComponents: Record<number, any> = {
  16: Sparkles, // Animação (Anime)
  10759: Sword, // Action & Adventure
  35: Laugh, // Comédia
  80: SearchIcon, // Crime
  99: Film, // Documentário
  18: Drama, // Drama
  10751: Users, // Família
  10762: Baby, // Kids
  9648: Eye, // Mistério
  10763: Newspaper, // News
  10764: Film, // Reality
  10765: Rocket, // Sci-Fi & Fantasy
  10766: Heart, // Soap
  10767: Mic, // Talk
  10768: Flag, // War & Politics
  37: Flag, // Faroeste
};

const SeriesPage = () => {
  const { isDarkMode } = useTheme();
  const [popularSeries, setPopularSeries] = useState<Serie[]>([]);
  const [topRatedSeries, setTopRatedSeries] = useState<Serie[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<Serie[]>([]);
  const [searchResults, setSearchResults] = useState<Serie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Genre state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [genreSeries, setGenreSeries] = useState<Serie[]>([]);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [genrePage, setGenrePage] = useState(1);
  const [totalGenrePages, setTotalGenrePages] = useState(1);
  
  // Player state
  const [selectedSerie, setSelectedSerie] = useState<Serie | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [totalSeasons, setTotalSeasons] = useState(1);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  
  // Estado para controle de scroll dos gêneros
  const genreSliderRef = useRef<HTMLDivElement>(null);
  const [isGenreScrolling, setIsGenreScrolling] = useState(false);

  useEffect(() => {
    fetchSeries();
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await api.get('/series/genres');
      setGenres(response.data.genres || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  const fetchSeriesByGenre = async (genreId: number, page: number = 1, sort: string = sortBy) => {
    setLoadingGenre(true);
    try {
      const response = await api.get('/series/discover', { params: { genreId, page, sortBy: sort } });
      setGenreSeries(response.data.results || []);
      setTotalGenrePages(response.data.total_pages || 1);
      setGenrePage(page);
    } catch (err) {
      console.error('Error fetching series by genre:', err);
      setGenreSeries([]);
    } finally {
      setLoadingGenre(false);
    }
  };

  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre);
    setGenrePage(1);
    fetchSeriesByGenre(genre.id, 1, sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    if (selectedGenre) {
      fetchSeriesByGenre(selectedGenre.id, 1, newSort);
    }
  };

  const handleGenrePageChange = (page: number) => {
    if (selectedGenre) {
      fetchSeriesByGenre(selectedGenre.id, page, sortBy);
    }
  };

  const clearGenreFilter = () => {
    setSelectedGenre(null);
    setGenreSeries([]);
    setGenrePage(1);
  };

  const scrollGenres = (direction: 'left' | 'right') => {
    if (genreSliderRef.current && !isGenreScrolling) {
      const container = genreSliderRef.current;
      const scrollAmount = container.clientWidth * 0.7;
      
      setIsGenreScrolling(true);
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      
      setTimeout(() => {
        setIsGenreScrolling(false);
      }, 400);
    }
  };

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const [popularRes, topRatedRes, trendingRes] = await Promise.all([
        api.get('/series/popular'),
        api.get('/series/top-rated'),
        api.get('/series/trending'),
      ]);
      
      setPopularSeries(popularRes.data.results || []);
      setTopRatedSeries(topRatedRes.data.results || []);
      setTrendingSeries(trendingRes.data.results || []);
    } catch (err) {
      console.error('Error fetching series:', err);
      setError('Falha ao carregar séries.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await api.get('/series/search', { params: { query: searchQuery.trim() } });
      setSearchResults(response.data.results || []);
    } catch (err) {
      console.error('Error searching series:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const openSeriePlayer = async (serie: Serie) => {
    setSelectedSerie(serie);
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setPlayerOpen(true);
    
    // Add to watch history
    watchHistoryService.addToHistory({
      id: serie.id,
      type: 'series',
      title: serie.name,
      poster_path: serie.poster_path ? `${TMDB_IMAGE_BASE}${serie.poster_path}` : null,
      backdrop_path: serie.backdrop_path ? `${TMDB_IMAGE_BASE}${serie.backdrop_path}` : null,
      vote_average: serie.vote_average,
      genre_ids: serie.genre_ids || [],
      progress: 5,
      season: 1,
      episode: 1,
    });
    
    // Buscar detalhes da série para saber quantas temporadas tem
    try {
      const response = await api.get(`/series/${serie.id}`);
      setTotalSeasons(response.data.number_of_seasons || 1);
      
      // Buscar episódios da primeira temporada
      await fetchEpisodes(serie.id, 1);
    } catch (err) {
      console.error('Error fetching serie details:', err);
      setTotalSeasons(5); // fallback
    }
  };

  const fetchEpisodes = async (serieId: number, season: number) => {
    setLoadingEpisodes(true);
    try {
      const response = await api.get(`/series/${serieId}/season/${season}`);
      setEpisodes(response.data.episodes || []);
    } catch (err) {
      console.error('Error fetching episodes:', err);
      setEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const changeSeason = async (season: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(1);
    if (selectedSerie) {
      await fetchEpisodes(selectedSerie.id, season);
    }
  };

  const getStreamUrl = () => {
    if (!selectedSerie) return '';
    return `${SUPERFLIX_BASE}/serie/${selectedSerie.id}/${selectedSeason}/${selectedEpisode}?quality=1080p`;
  };

  const closePlayer = () => {
    setPlayerOpen(false);
    setSelectedSerie(null);
    setEpisodes([]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-12 pt-20" data-app-element>
      {/* Header */}
      <div className="pt-8 pb-6 px-4 md:px-12">
        <h1 className={`text-3xl md:text-4xl font-black flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Tv size={36} className="text-primary-400" />
          Séries
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Assista suas séries favoritas</p>

        {/* Campo de Busca */}
        <form onSubmit={handleSearch} className="mt-6 max-w-2xl">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar série por nome..."
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all ${
                  isDarkMode 
                    ? 'bg-dark-800 border-dark-600 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Buscando...
                </>
              ) : (
                'Buscar'
              )}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="px-4 md:px-12"><ErrorMessage message={error} /></div>}

      {/* Resultados da Busca */}
      {hasSearched && (
        <div className="px-4 md:px-12 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <SearchIcon size={20} className="inline mr-2" />Resultados para "{searchQuery}"
              <span className={`font-normal ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>({searchResults.length} encontrados)</span>
            </h2>
            <button
              onClick={clearSearch}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${isDarkMode ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Limpar busca
            </button>
          </div>
          
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {searchResults.map((serie) => (
                <SerieCard key={serie.id} serie={serie} onSelect={openSeriePlayer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-dark-800/50 rounded-xl">
              <SearchIcon size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Nenhuma série encontrada para "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}

      {/* Seção de Gêneros - PRIMEIRO */}
      {!hasSearched && (
        <div className="px-4 md:px-12 mb-6">
          <h2 className={`text-xl md:text-2xl font-bold mb-4 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Drama size={24} className="inline mr-2 text-purple-400" />Explorar por Gênero
            <span className="flex-1 h-px bg-gradient-to-r from-primary-500/30 to-transparent" />
          </h2>
          
          {/* Scroll Horizontal de Gêneros - PREMIUM DESIGN COM SETAS */}
          <div className="relative group/genres mb-6">
            {/* Blur overlays para efeito suave */}
            <div className={`absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300 ${
              isGenreScrolling ? 'opacity-100' : 'opacity-70'
            } ${
              isDarkMode 
                ? 'bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent' 
                : 'bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/80 to-transparent'
            }`} />
            
            <div className={`absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300 ${
              isGenreScrolling ? 'opacity-100' : 'opacity-70'
            } ${
              isDarkMode 
                ? 'bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent' 
                : 'bg-gradient-to-l from-[#f8fafc] via-[#f8fafc]/80 to-transparent'
            }`} />
            
            {/* Seta Esquerda */}
            <button
              onClick={() => scrollGenres('left')}
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full
                opacity-0 group-hover/genres:opacity-100 transition-all duration-300
                flex items-center justify-center shadow-lg
                hover:scale-110 active:scale-95
                ${
                  isDarkMode
                    ? 'bg-dark-800/90 hover:bg-dark-700 text-white border border-white/10'
                    : 'bg-white/90 hover:bg-white text-gray-900 border border-gray-200 shadow-md'
                }
              `}
              aria-label="Anterior"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            
            {/* Container com Scroll */}
            <div 
              ref={genreSliderRef}
              className={`flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide scroll-smooth snap-x snap-mandatory ${
                isGenreScrolling ? 'blur-[2px]' : ''
              } transition-all duration-300`}
            >
              {genres.map((genre) => {
                const IconComponent = genreIconComponents[genre.id] || Tv;
                const isActive = selectedGenre?.id === genre.id;
                
                return (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreSelect(genre)}
                    className={`
                      group/genre flex-shrink-0 px-5 py-2.5 rounded-full font-semibold text-sm
                      transition-all duration-300 ease-out
                      flex items-center gap-2.5 snap-start
                      transform hover:scale-105 active:scale-95
                      ${isActive
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40 border-2 border-primary-400'
                        : isDarkMode
                          ? 'bg-white/10 backdrop-blur-md text-gray-300 border border-white/10 hover:border-primary-500/50 hover:bg-white/15 hover:text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-500 hover:shadow-md hover:text-gray-900 shadow-sm'
                      }
                    `}
                  >
                    <IconComponent 
                      size={16} 
                      className={`
                        transition-all duration-300
                        ${isActive 
                          ? 'text-white' 
                          : isDarkMode
                            ? 'text-gray-400 group-hover/genre:text-primary-400'
                            : 'text-gray-500 group-hover/genre:text-primary-500'
                        }
                      `}
                    />
                    <span className="whitespace-nowrap">{genre.name}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Seta Direita */}
            <button
              onClick={() => scrollGenres('right')}
              className={`
                absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full
                opacity-0 group-hover/genres:opacity-100 transition-all duration-300
                flex items-center justify-center shadow-lg
                hover:scale-110 active:scale-95
                ${
                  isDarkMode
                    ? 'bg-dark-800/90 hover:bg-dark-700 text-white border border-white/10'
                    : 'bg-white/90 hover:bg-white text-gray-900 border border-gray-200 shadow-md'
                }
              `}
              aria-label="Próximo"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Resultados do Gênero Selecionado */}
          {selectedGenre && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {(() => {
                      const IconComponent = genreIconComponents[selectedGenre.id] || Tv;
                      return <IconComponent size={24} className="text-primary-400" />;
                    })()}
                    {selectedGenre.name}
                    <span className={`font-normal text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>({genreSeries.length} resultados)</span>
                  </h3>
                  <button
                    onClick={clearGenreFilter}
                    className={`px-3 py-1 rounded-lg transition-colors text-sm flex items-center gap-1 ${isDarkMode ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    <X size={14} />
                    ✕ Limpar
                  </button>
                </div>
                
                {/* Ordenação */}
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary-500 ${isDarkMode ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="popularity.desc">Mais Populares</option>
                    <option value="vote_average.desc">Melhor Avaliados</option>
                    <option value="first_air_date.desc">Mais Recentes</option>
                    <option value="first_air_date.asc">Mais Antigos</option>
                    <option value="name.asc">A-Z</option>
                    <option value="name.desc">Z-A</option>
                  </select>
                </div>
              </div>

              {loadingGenre ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : genreSeries.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                    {genreSeries.map((serie) => (
                      <SerieCard key={serie.id} serie={serie} onSelect={openSeriePlayer} />
                    ))}
                  </div>
                  
                  {/* Paginação */}
                  {totalGenrePages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <button
                        onClick={() => handleGenrePageChange(genrePage - 1)}
                        disabled={genrePage === 1}
                        className="px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        ← Anterior
                      </button>
                      <span className="text-gray-400 px-4">
                        Página {genrePage} de {Math.min(totalGenrePages, 500)}
                      </span>
                      <button
                        onClick={() => handleGenrePageChange(genrePage + 1)}
                        disabled={genrePage >= totalGenrePages || genrePage >= 500}
                        className="px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        Próximo →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-dark-800/50 rounded-xl">
                  <SearchIcon size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Nenhuma série encontrada para este gênero</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Categorias (mostrar apenas se não estiver buscando e não tiver gênero selecionado) */}
      {!hasSearched && !selectedGenre && (
        <div className="space-y-8">
          <ContentCarousel 
            title="Em Alta" 
            subtitle="Séries populares do momento"
            icon={<TrendingUp size={22} className="text-primary-400" />}
          >
            {trendingSeries.map((serie) => (
              <SerieCard key={serie.id} serie={serie} onSelect={openSeriePlayer} />
            ))}
          </ContentCarousel>
          
          <ContentCarousel 
            title="Populares" 
            subtitle="As séries mais assistidas"
            icon={<Star size={22} className="text-primary-400" />}
          >
            {popularSeries.map((serie) => (
              <SerieCard key={serie.id} serie={serie} onSelect={openSeriePlayer} />
            ))}
          </ContentCarousel>
          
          <ContentCarousel 
            title="Mais Bem Avaliadas" 
            subtitle="Com as melhores notas"
            icon={<Star size={22} className="text-primary-400" />}
          >
            {topRatedSeries.map((serie) => (
              <SerieCard key={serie.id} serie={serie} onSelect={openSeriePlayer} />
            ))}
          </ContentCarousel>
        </div>
      )}

      {/* Player Modal com Seletor de Episódios */}
      {playerOpen && selectedSerie && (
        <div className={`fixed inset-0 z-50 flex flex-col ${
          isDarkMode ? 'bg-black/95' : 'bg-white/95'
        }`} data-app-modal data-app-element>
          {/* Header do Player */}
          <div className={`flex items-center justify-between p-4 ${
            isDarkMode ? 'bg-dark-900/80' : 'bg-gray-100/80'
          }`}>
            <div className="flex items-center gap-4">
              <button
                onClick={closePlayer}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-dark-700 hover:bg-dark-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <svg className={isDarkMode ? 'w-6 h-6 text-white' : 'w-6 h-6 text-gray-900'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{selectedSerie.name}</h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Temporada {selectedSeason} • Episódio {selectedEpisode}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(getStreamUrl(), '_blank', 'noopener,noreferrer')}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir em Nova Aba
              </button>
              <button
                onClick={closePlayer}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-dark-700 hover:bg-red-600' : 'bg-gray-200 hover:bg-red-500'
                }`}
              >
                <svg className={isDarkMode ? 'w-6 h-6 text-white' : 'w-6 h-6 text-gray-900'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* VIEWPORT-CONSTRAINED LAYOUT - Grid 70/30 com max-height 85vh */}
          <div className="grid lg:grid-cols-[1fr_280px] gap-0 overflow-hidden" style={{ maxHeight: '85vh' }}>
            {/* Player - Aspect Ratio 16:9 com altura limitada */}
            <div className={`relative flex items-center justify-center ${
              isDarkMode ? 'bg-black' : 'bg-gray-100'
            }`} style={{ maxHeight: '85vh' }}>
              <div className={`w-full ${
                isDarkMode ? 'bg-black' : 'bg-white shadow-lg'
              }`} style={{ maxHeight: '80vh', aspectRatio: '16/9' }}>
                <iframe
                  src={getStreamUrl()}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Sidebar de Episódios - ULTRA COMPACTO com scroll interno */}
            <div className={`backdrop-blur-sm flex flex-col border-l ${
              isDarkMode ? 'bg-dark-900/95 border-dark-700/50' : 'bg-gray-50/95 border-gray-200'
            }`} style={{ maxHeight: '85vh' }}>
              {/* Seletor de Temporada - Dropdown Compacto */}
              <div className={`p-2.5 border-b flex-shrink-0 ${
                isDarkMode ? 'border-dark-700/50 bg-dark-800/50' : 'border-gray-200 bg-gray-100/50'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-[10px] font-medium uppercase tracking-wide ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Temporada</label>
                  <span className={`text-[10px] ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>{episodes.length} eps</span>
                </div>
                <select
                  value={selectedSeason}
                  onChange={(e) => changeSeason(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:border-primary-500 transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'bg-dark-700 border-dark-600 text-white hover:bg-dark-600'
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((season) => (
                    <option key={season} value={season}>
                      Temporada {season}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de Episódios - SCROLL INTERNO COMPACTO (40px cada) */}
              <div className="flex-1 overflow-y-auto episode-list-scroll">
                {loadingEpisodes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : episodes.length > 0 ? (
                  <div className="py-1">
                    {episodes.map((ep) => (
                      <button
                        key={ep.episode_number}
                        onClick={() => setSelectedEpisode(ep.episode_number)}
                        className={`
                          w-full px-2.5 py-2 text-left transition-all duration-150 flex items-center gap-2.5 group relative
                          ${selectedEpisode === ep.episode_number
                            ? isDarkMode
                              ? 'bg-primary-500/15 border-l-2 border-primary-500'
                              : 'bg-primary-100 border-l-2 border-primary-500'
                            : isDarkMode
                              ? 'border-l-2 border-transparent hover:bg-dark-800/60 hover:border-l-primary-500/30'
                              : 'border-l-2 border-transparent hover:bg-gray-100 hover:border-l-primary-500/30'
                          }
                        `}
                        style={{ minHeight: '40px', maxHeight: '40px' }}
                      >
                        {/* Número do Episódio - Mini */}
                        <div className={`
                          w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-bold transition-colors
                          ${selectedEpisode === ep.episode_number
                            ? 'bg-primary-500 text-white'
                            : isDarkMode
                              ? 'bg-dark-700/50 text-gray-400 group-hover:bg-dark-600 group-hover:text-primary-400'
                              : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300 group-hover:text-primary-500'
                          }
                        `}>
                          {ep.episode_number}
                        </div>
                        
                        {/* Info do Episódio */}
                        <div className="flex-1 min-w-0">
                          <p className={`
                            font-medium text-[11px] line-clamp-1 leading-tight transition-colors
                            ${selectedEpisode === ep.episode_number 
                              ? isDarkMode ? 'text-white' : 'text-gray-900'
                              : isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
                            }
                          `}>
                            {ep.name || `Episódio ${ep.episode_number}`}
                          </p>
                        </div>
                        
                        {/* Indicador de Playing - Mini */}
                        {selectedEpisode === ep.episode_number && (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <div className="w-1 h-1 rounded-full bg-primary-400 animate-pulse" />
                            <div className="w-1 h-1 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1 h-1 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((epNum) => (
                      <button
                        key={epNum}
                        onClick={() => setSelectedEpisode(epNum)}
                        className={`
                          w-full px-2.5 py-2 text-left transition-all duration-150 flex items-center gap-2.5 group relative
                          ${selectedEpisode === epNum
                            ? isDarkMode
                              ? 'bg-primary-500/15 border-l-2 border-primary-500'
                              : 'bg-primary-100 border-l-2 border-primary-500'
                            : isDarkMode
                              ? 'border-l-2 border-transparent hover:bg-dark-800/60 hover:border-l-primary-500/30'
                              : 'border-l-2 border-transparent hover:bg-gray-100 hover:border-l-primary-500/30'
                          }
                        `}
                        style={{ minHeight: '40px', maxHeight: '40px' }}
                      >
                        <div className={`
                          w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-bold transition-colors
                          ${selectedEpisode === epNum
                            ? 'bg-primary-500 text-white'
                            : isDarkMode
                              ? 'bg-dark-700/50 text-gray-400 group-hover:bg-dark-600 group-hover:text-primary-400'
                              : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300 group-hover:text-primary-500'
                          }
                        `}>
                          {epNum}
                        </div>
                        <span className={`
                          font-medium text-[11px] transition-colors
                          ${selectedEpisode === epNum 
                            ? isDarkMode ? 'text-white' : 'text-gray-900'
                            : isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
                          }
                        `}>
                          Episódio {epNum}
                        </span>
                        {selectedEpisode === epNum && (
                          <div className="ml-auto flex items-center gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-primary-400 animate-pulse" />
                            <div className="w-1 h-1 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1 h-1 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



interface SerieCardProps {
  serie: Serie;
  onSelect: (serie: Serie) => void;
}

const SerieCard = memo(({ serie, onSelect }: SerieCardProps) => {
  const imageUrl = serie.poster_path 
    ? (serie.poster_path.startsWith('http') ? serie.poster_path : `${TMDB_IMAGE_BASE}${serie.poster_path}`)
    : null;

  return (
    <div 
      className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] cursor-pointer group"
      onClick={() => onSelect(serie)}
      data-app-element
    >
      <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-dark-800 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary-500/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={serie.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tv size={48} className="text-gray-600 opacity-50" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl shadow-primary-500/40">
            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        
        {/* Rating */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
          <span className="text-amber-400">★</span>
          {serie.vote_average.toFixed(1)}
        </div>
        
        {/* Gradient Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
        
        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug">
            {serie.name}
          </h3>
        </div>
      </div>
    </div>
  );
});

SerieCard.displayName = 'SerieCard';

export default SeriesPage;
