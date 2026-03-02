/* KauanFlix — Series Detail Page with Seasons & Episodes */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, Calendar, Clock, ArrowLeft, ChevronDown, Plus, Check, Tv, Film } from 'lucide-react';
import { getSeriesDetails, getSeriesSeasonDetails, getSeriesVideos, getImageUrl, getBackdropUrl, getSeriesStreamingUrl } from '../services/movieService';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { myListService } from '../services/myListService';
import { watchHistoryService } from '../services/watchHistoryService';
import { SkeletonRow } from '../components/ui/Skeleton';
import { TrailerModal } from '../components/TrailerModal';
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
  const [error, setError] = useState<string | null>(null);
  const [inList, setInList] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [trailerOpen, setTrailerOpen] = useState(false);

  /* Fetch series details */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getSeriesDetails(Number(id))
      .then((data: any) => {
        setSeries(data);
        // Extract seasons (filter out season 0 = Specials unless it has episodes)
        const allSeasons: Season[] = data.seasons || [];
        const filtered = allSeasons.filter((s: Season) => s.season_number > 0 || s.episode_count > 0);
        setSeasons(filtered);
        // Default to season 1
        const firstSeason = filtered.find((s: Season) => s.season_number === 1) || filtered[0];
        if (firstSeason) setSelectedSeason(firstSeason.season_number);
        // Check list status
        setInList(myListService.isInList(Number(id)));
        document.title = `${data.name || data.title || 'Série'} — KauanFlix`;
      })
      .catch((err: any) => setError(err.message || 'Erro ao carregar série'))
      .finally(() => setLoading(false));

    // Fetch trailer videos
    getSeriesVideos(Number(id))
      .then((vids) => setVideos(vids))
      .catch(() => setVideos([]));

    return () => { document.title = 'KauanFlix — Seu cinema, do seu jeito'; };
  }, [id]);

  /* Fetch season episodes */
  const fetchEpisodes = useCallback(async (seasonNum: number) => {
    if (!id) return;
    setLoadingEpisodes(true);
    try {
      const data = await getSeriesSeasonDetails(Number(id), seasonNum);
      setEpisodes(data.episodes || []);
    } catch {
      setEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  }, [id]);

  useEffect(() => {
    if (selectedSeason > 0) fetchEpisodes(selectedSeason);
  }, [selectedSeason, fetchEpisodes]);

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

  if (loading) {
    return (
      <main className="min-h-screen pt-24 section-container">
        <SkeletonRow count={6} />
      </main>
    );
  }

  if (error || !series) {
    return (
      <main className="min-h-screen pt-24 section-container text-center">
        <p className="text-kf-danger text-lg">{error || 'Série não encontrada'}</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">Voltar</button>
      </main>
    );
  }

  const backdropUrl = getBackdropUrl(series.backdrop_path);
  const posterUrl = getImageUrl(series.poster_path, 'w500');

  return (
    <main className="min-h-screen pb-24">
      {/* Hero Backdrop */}
      <div className="relative w-full h-[60vh] min-h-[400px]">
        {backdropUrl && (
          <img src={backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-kf-bg via-kf-bg/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-kf-bg/90 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-kf-accent/30 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Series info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 z-10">
          <div className="section-container flex flex-col md:flex-row gap-6 items-end md:items-end">
            {/* Poster */}
            {posterUrl && (
              <div className="hidden md:block flex-shrink-0 w-40 rounded-lg overflow-hidden shadow-2xl border border-white/10">
                <img src={posterUrl} alt={series.name} className="w-full" />
              </div>
            )}

            <div className="flex-1">
              <span className="badge badge-series inline-flex items-center gap-1 mb-3">
                <Tv className="w-3 h-3" /> SÉRIE
              </span>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3">
                {series.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-kf-text-secondary mb-4">
                <span className="flex items-center gap-1 text-kf-yellow">
                  <Star className="w-4 h-4" fill="currentColor" />
                  {series.vote_average?.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {series.first_air_date?.split('-')[0] || '—'}
                </span>
                <span>{series.number_of_seasons} temporada{(series.number_of_seasons || 0) !== 1 ? 's' : ''}</span>
                <span>{series.number_of_episodes} episódios</span>
              </div>

              <p className="text-kf-text-secondary text-sm md:text-base max-w-2xl line-clamp-3 mb-4">
                {series.overview || 'Sem descrição disponível.'}
              </p>

              <div className="flex gap-3">
                {(() => {
                  const lastEp = id ? watchHistoryService.getLastEpisode(Number(id)) : undefined;
                  if (lastEp) {
                    return (
                      <button
                        onClick={() => handlePlayEpisode(lastEp.season, lastEp.episode)}
                        className="btn-primary flex items-center gap-2 px-6 py-3"
                      >
                        <Play className="w-5 h-5" fill="currentColor" />
                        Continuar S{String(lastEp.season).padStart(2, '0')}E{String(lastEp.episode).padStart(2, '0')}
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => handlePlayEpisode(1, 1)}
                      className="btn-primary flex items-center gap-2 px-6 py-3"
                    >
                      <Play className="w-5 h-5" fill="currentColor" /> Assistir S01E01
                    </button>
                  );
                })()}
                <button
                  onClick={handleToggleList}
                  className="btn-secondary flex items-center gap-2 px-5 py-3"
                >
                  {inList ? <Check className="w-5 h-5 text-kf-success" /> : <Plus className="w-5 h-5" />}
                  {inList ? 'Na lista' : 'Minha Lista'}
                </button>
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="btn-secondary flex items-center gap-2 px-5 py-3"
                >
                  <Film className="w-4 h-4" />
                  Trailer
                </button>
              </div>

              {/* Genres */}
              {series.genres && series.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {series.genres.map((g) => (
                    <span key={g.id} className="px-3 py-1 text-xs rounded-full bg-white/5 text-kf-text-secondary border border-white/10">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Season Selector & Episodes */}
      <div className="section-container mt-8">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="section-title mb-0">Episódios</h2>
          <div className="relative">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="appearance-none h-10 pl-4 pr-10 text-sm bg-kf-bg-secondary border border-[rgba(123,47,255,0.2)] rounded-lg text-white focus:outline-none focus:border-kf-accent transition-colors cursor-pointer"
            >
              {seasons.map((s) => (
                <option key={s.season_number} value={s.season_number}>
                  {s.name || `Temporada ${s.season_number}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kf-text-muted pointer-events-none" />
          </div>
        </div>

        {loadingEpisodes ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        ) : episodes.length === 0 ? (
          <p className="text-kf-text-muted text-center py-12">Nenhum episódio disponível para esta temporada.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="group cursor-pointer"
                onClick={() => handlePlayEpisode(selectedSeason, ep.episode_number)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePlayEpisode(selectedSeason, ep.episode_number)}
              >
                {/* Episode thumbnail — landscape card */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-kf-bg-secondary border border-white/5 group-hover:border-kf-accent/30 transition-all">
                  {ep.still_path ? (
                    <img
                      src={getImageUrl(ep.still_path, 'w500')}
                      alt={ep.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-kf-bg-secondary">
                      <Tv className="w-8 h-8 text-kf-text-muted" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Episode number badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold bg-kf-accent/90 text-white">
                    E{String(ep.episode_number).padStart(2, '0')}
                  </div>

                  {/* Play icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" fill="currentColor" />
                    </div>
                  </div>

                  {/* Runtime badge */}
                  {ep.runtime > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-white/80">
                      <Clock className="w-3 h-3" /> {ep.runtime}min
                    </div>
                  )}

                  {/* Title + rating at bottom of card */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <h3 className="text-sm font-semibold text-white line-clamp-1">{ep.name}</h3>
                  </div>
                </div>

                {/* Info below card */}
                <div className="mt-1.5 px-0.5">
                  <p className="text-xs text-kf-text-secondary line-clamp-2">
                    {ep.overview || 'Sem descrição.'}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-kf-text-muted mt-1">
                    {ep.vote_average > 0 && (
                      <span className="flex items-center gap-0.5 text-kf-yellow">
                        <Star className="w-3 h-3" fill="currentColor" /> {ep.vote_average.toFixed(1)}
                      </span>
                    )}
                    {ep.air_date && <span>{ep.air_date}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
