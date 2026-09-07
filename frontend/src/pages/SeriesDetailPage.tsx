import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, Calendar, Clock, ChevronLeft, ChevronDown, Plus, Check, Tv, Film } from 'lucide-react';
import { getSeriesDetails, getSeriesSeasonDetails, getSeriesVideos, getImageUrl, getBackdropUrl, getSeriesStreamingUrl } from '../services/movieService';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { myListService } from '../services/myListService';
import { watchHistoryService } from '../services/watchHistoryService';
import { SkeletonDetail } from '../components/ui/Skeleton';
import { TrailerModal } from '../components/TrailerModal';
import { Synopsis } from '../components/Synopsis';
import { Artwork } from '../components/Artwork';
import type { Series, Season, Episode, Video } from '../types/movie';

const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openPlayer = usePlayerStore((s) => s.openPlayer);
  const addToast = useAppStore((s) => s.addToast);

  const [series, setSeries] = useState<Series | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [episodeRetry, setEpisodeRetry] = useState(0);
  const [episodeQuery, setEpisodeQuery] = useState('');
  const [reverseEpisodes, setReverseEpisodes] = useState(false);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [inList, setInList] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    const update = () => setInList(myListService.isInList(Number(id), 'tv'));
    update(); window.addEventListener('kkm-storage', update); window.addEventListener('storage', update);
    return () => { window.removeEventListener('kkm-storage', update); window.removeEventListener('storage', update); };
  }, [id]);

  /* Fetch series details */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setSeries(null); setSeasons([]); setEpisodes([]); setVideos([]);
    setEpisodeQuery(''); setReverseEpisodes(false);
    setError(null);

    getSeriesDetails(Number(id))
      .then((data: any) => { if (cancelled) return;
        setSeries(data);
        const allSeasons: Season[] = data.seasons || [];
        const filtered = allSeasons.filter((s: Season) => s.season_number > 0 || s.episode_count > 0);
        setSeasons(filtered);
        
        const firstSeason = filtered.find((s: Season) => s.season_number === 1) || filtered[0];
        if (firstSeason) setSelectedSeason(firstSeason.season_number);
        
        setInList(myListService.isInList(Number(id), 'tv'));
        document.title = `${data.name || data.title || 'Série'} — KKMovies`;
      })
      .catch((err: any) => { if (!cancelled) setError(err.message || 'Erro ao carregar série'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    getSeriesVideos(Number(id))
      .then((vids) => { if (!cancelled) setVideos(vids); })
      .catch(() => { if (!cancelled) setVideos([]); });

    return () => { cancelled = true; document.title = 'KKMovies — Seu cinema, do seu jeito'; };
  }, [id, retry]);

  /* Ignore stale responses when switching seasons or series. */
  useEffect(() => {
    if (!series || series.id !== Number(id) || !id || !seasons.some(season => season.season_number === selectedSeason)) return;
    let cancelled = false;
    setLoadingEpisodes(true);
    setEpisodeError(null);
    setEpisodes([]);
    getSeriesSeasonDetails(Number(id), selectedSeason)
      .then(data => { if (!cancelled) setEpisodes(data.episodes || []); })
      .catch(() => { if (!cancelled) setEpisodeError('Não foi possível carregar os episódios desta temporada.'); })
      .finally(() => { if (!cancelled) setLoadingEpisodes(false); });
    return () => { cancelled = true; };
  }, [id, series, seasons, selectedSeason, episodeRetry]);
  const handlePlayEpisode = (season: number, episodeNum: number) => {
    if (!series) return;
    const ep = episodes.find((e) => e.episode_number === episodeNum && e.season_number === season)
      || episodes.find((e) => e.episode_number === episodeNum);
    openPlayer({
      streamUrl: getSeriesStreamingUrl(Number(id), season, episodeNum),
      movieId: Number(id),
      movieTitle: `${series.name} S${String(season).padStart(2, '0')}E${String(episodeNum).padStart(2, '0')}`,
      posterPath: series.poster_path || '',
      backdropPath: series.backdrop_path || '',
      mediaType: 'tv',
      episodeInfo: {
        season,
        episode: episodeNum,
        name: ep?.name || '',
        still_path: ep?.still_path || null,
      },
    });
  };

  const handleToggleList = () => {
    if (!series) return;
    const movieLike = {
      id: series.id,
      title: series.name,
      overview: series.overview,
      poster_path: series.poster_path,
      backdrop_path: series.backdrop_path,
      release_date: series.first_air_date,
      vote_average: series.vote_average,
      vote_count: series.vote_count,
      popularity: series.popularity,
      adult: false,
      original_language: '',
      media_type: 'tv',
    };
    const added = myListService.toggle(movieLike);
    setInList(added);
    addToast(added ? 'Adicionado à sua lista ✓' : 'Removido da sua lista', added ? 'success' : 'info');
  };

  if (loading) return <SkeletonDetail />;

  if (error || !series) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center section-container text-center bg-[var(--surface-0)]">
        <p className="text-[var(--text-secondary)] text-lg mb-4">{error || 'Série não encontrada'}</p>
        <button onClick={() => setRetry(value => value + 1)} className="glass-button">Tentar novamente</button>
      </main>
    );
  }

  const backdropUrl = getBackdropUrl(series.backdrop_path);


  return (
    <main className="min-h-screen bg-[var(--surface-0)] page-enter pb-24">
      
      {/* Hero Backdrop (Cinematographic Glass Gradients) */}
      <div className="relative w-full h-[55vh] min-h-[400px] overflow-hidden">
        {backdropUrl && (
          <div
            className="absolute inset-0 bg-cover bg-top"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)]/90 via-[var(--surface-0)]/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-4 md:left-8 z-20 glass-icon-btn bg-black/20 backdrop-blur-md"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Series Info Container */}
      <div className="section-container -mt-32 md:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Poster (Glass Card) */}
          {(
            <div className="flex-shrink-0 hidden md:block">
              <div className="glass-card p-1 rounded-2xl">
                <Artwork paths={[series.poster_path, series.backdrop_path]} title={series.name} className="w-48 lg:w-64 aspect-[2/3] rounded-xl object-cover shadow-2xl" />
              </div>
            </div>
          )}

          <div className="flex-1 max-w-4xl pt-4">
            <span className="badge badge-category mb-3">
              <Tv className="w-3.5 h-3.5 mr-1.5" /> SÉRIE
            </span>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mb-4 lg:mb-5">
              {series.name}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-6 text-xs md:text-sm font-medium text-[var(--text-secondary)]">
              {series.vote_average > 0 && (
                <>
                  <span className="flex items-center gap-1.5 text-[var(--accent-gold)]">
                    <Star className="w-4 h-4" fill="currentColor" />
                    {series.vote_average?.toFixed(1)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[var(--text-hint)] hidden sm:block" />
                </>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {series.first_air_date?.split('-')[0] || '—'}
              </span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-hint)] hidden sm:block" />
              <span>{series.number_of_seasons} Temporada{(series.number_of_seasons || 0) !== 1 ? 's' : ''}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-hint)] hidden sm:block" />
              <span>{series.number_of_episodes} Episódios</span>
            </div>

            <Synopsis text={series.overview} />

            {/* Action buttons (Glassmorphism) */}
            <div className="flex flex-wrap items-center gap-3">
              {(() => {
                const lastEp = id ? watchHistoryService.getLastEpisode(Number(id)) : undefined;
                if (lastEp) {
                  return (
                    <button
                      onClick={() => handlePlayEpisode(lastEp.season, lastEp.episode)}
                      className="glass-button primary text-[15px] px-6 py-2.5"
                    >
                      <Play className="w-4 h-4 mr-2" fill="currentColor" />
                      Continuar S{String(lastEp.season).padStart(2, '0')}E{String(lastEp.episode).padStart(2, '0')}
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => document.getElementById('episode-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="glass-button primary text-[15px] px-6 py-2.5"
                  >
                    <Play className="w-4 h-4 mr-2" fill="currentColor" />
                    Escolher episódio
                  </button>
                );
              })()}
              
              <div className="w-[1px] h-8 bg-[var(--glass-separator)] mx-1 hidden sm:block" />

              <button onClick={handleToggleList} className={`glass-button text-[14px] px-5 py-2.5 ${inList ? 'text-[var(--accent-blue)]' : ''}`}>
                {inList ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {inList ? 'Na lista' : 'Minha Lista'}
              </button>
              
              {videos.some(video => video.site === 'YouTube') && <button onClick={() => setTrailerOpen(true)} className="glass-button text-[14px] px-5 py-2.5">
                <Film className="w-4 h-4 mr-2" />
                Trailer
              </button>}
            </div>

            {/* Genres */}
            {series.genres && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                {series.genres.map((g) => (
                  <span key={g.id} className="badge badge-sub border border-[var(--glass-separator)] bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] px-3 py-1 rounded-full font-medium">
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Season Selector & Episodes Grid */}
      <div id="episode-panel" className="section-container episode-panel mt-12 lg:mt-16">
        
        {/* Header with Custom iOS Select */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl md:text-2xl font-light tracking-wide text-white m-0">Episódios</h2>
          <div className="relative">
            <select
              aria-label="Selecionar temporada"
              value={selectedSeason}
              onChange={(e) => { setSelectedSeason(Number(e.target.value)); setEpisodeQuery(''); }}
              className="w-full sm:w-auto min-w-[200px] h-11 pl-4 pr-10 text-sm font-medium bg-[rgba(118,118,128,0.12)] rounded-xl border-none text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue-glow)] transition-all appearance-none cursor-pointer shadow-sm"
            >
              {seasons.map((s) => (
                <option key={s.season_number} value={s.season_number} className="bg-[var(--surface-1)]">
                  {s.name || `Temporada ${s.season_number}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        <div className="episode-toolbar"><p>{seasons.find(season => season.season_number === selectedSeason)?.overview || 'Escolha um episódio para assistir.'}</p><div><input aria-label="Buscar episódio nesta temporada" placeholder="Nome ou número do episódio" value={episodeQuery} onChange={event => setEpisodeQuery(event.target.value)}/><button className="glass-button" onClick={() => setReverseEpisodes(value => !value)}>{reverseEpisodes ? 'Mais recentes primeiro' : 'Ordem dos episódios'}</button></div></div>

        {/* Episode Grid */}
        {loadingEpisodes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="skeleton aspect-video rounded-xl" />
                <div className="skeleton h-4 w-3/4 rounded mt-1" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </div>
        ) : episodeError ? (
          <div className="collection-empty" role="alert"><p>{episodeError}</p><button className="glass-button" onClick={() => setEpisodeRetry(value => value + 1)}>Tentar novamente</button></div>
        ) : episodes.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center mt-4">
            <Tv className="w-12 h-12 text-[var(--text-hint)] mb-4" />
            <p className="text-[var(--text-secondary)] text-sm">Nenhum episódio disponível para esta temporada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...episodes].filter(ep => `${ep.episode_number} ${ep.name}`.toLocaleLowerCase('pt-BR').includes(episodeQuery.toLocaleLowerCase('pt-BR'))).sort((a,b) => reverseEpisodes ? b.episode_number - a.episode_number : a.episode_number - b.episode_number).map((ep) => (
              <div
                key={ep.id}
                className="episode-card group cursor-pointer flex flex-col gap-2.5"
                onClick={() => handlePlayEpisode(selectedSeason, ep.episode_number)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlayEpisode(selectedSeason, ep.episode_number); } }}
              >
                {/* Thumbnail Card (Glass Style) */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--surface-1)] border border-[var(--glass-separator)] group-hover:border-[var(--accent-blue-border)] shadow-sm group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
                  <Artwork key={`${series.id}-${selectedSeason}-${ep.episode_number}`} paths={[ep.still_path, series.backdrop_path, seasons.find(season => season.season_number === selectedSeason)?.poster_path, series.poster_path]} title={`${series.name} — ${ep.name || `Episódio ${ep.episode_number}`}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" size="w780"/>

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />

                  {/* Episode Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--surface-0)]/80 backdrop-blur-md text-white border border-[var(--glass-separator)]">
                    E{String(ep.episode_number).padStart(2, '0')}
                  </div>

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-separator)] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>

                  {/* Runtime */}
                  {ep.runtime > 0 && (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 backdrop-blur-md text-white/90">
                      <Clock className="w-3 h-3" /> {ep.runtime}m
                    </div>
                  )}
                </div>

                {/* Details Below Card */}
                <div className="px-1">
                  <h3 className="text-[14px] font-medium text-[var(--text-primary)] line-clamp-1 mb-1 tracking-tight">
                    {ep.episode_number}. {ep.name || `Episódio ${ep.episode_number}`}
                  </h3>
                  <p className="text-[12px] text-[var(--text-muted)] line-clamp-2 leading-snug mb-2">
                    {ep.overview || 'A sinopse deste episódio ainda não foi disponibilizada.'}
                  </p>
                  
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-hint)] font-medium">
                    {ep.vote_average > 0 && (
                      <span className="flex items-center gap-1 text-[var(--accent-gold)]">
                        <Star className="w-3 h-3" fill="currentColor" /> {ep.vote_average.toFixed(1)}
                      </span>
                    )}
                    {ep.vote_average > 0 && ep.air_date && <span className="w-1 h-1 rounded-full bg-[var(--text-hint)]" />}
                    {ep.air_date && <span>{ep.air_date.split('-').reverse().join('/')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loadingEpisodes && !episodeError && episodes.length > 0 && !episodes.some(ep => `${ep.episode_number} ${ep.name}`.toLocaleLowerCase('pt-BR').includes(episodeQuery.toLocaleLowerCase('pt-BR'))) && <div className="collection-empty"><p>Nenhum episódio encontrado nesta temporada.</p><button className="glass-button" onClick={() => setEpisodeQuery('')}>Limpar busca</button></div>}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        videos={videos}
        title={series.name}
        year={series.first_air_date?.split('-')[0]}
        onClose={() => setTrailerOpen(false)}
      />
    </main>
  );
};

export default SeriesDetailPage;
