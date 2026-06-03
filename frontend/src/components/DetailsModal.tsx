/* KauanFlix — Details Modal v4 (HBO Max style)
   Slides from bottom on desktop, fade-in on mobile.
   Tabs: Episódios (TV only) · Similares · Detalhes
   - Backdrop 45vh with same triple gradient as hero
   - Logo or title Inter 300, same metadata row
   - Action buttons: Assistir / +Lista / ✓Na Lista
   - Episode list: thumbnail 16:9 + progress + hover play overlay
   - Season pills selector
   - Cast: circular avatars 48px
   - Closes on backdrop click or Escape key */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Plus, Check } from 'lucide-react';
import {
  getImageUrl,
  getMovieDetails,
  getMovieCredits,
  getSimilarMovies,
  getStreamingUrl,
  getSeriesStreamingUrl,
  getSeriesDetails,
  getSeriesSeasonDetails,
  getSeriesCredits,
} from '../services/movieService';
import { getYear } from '../utils/helpers';
import { watchlistService, progressService } from '../services/storageService';
import { useAppStore } from '../store/useAppStore';
import { usePlayerStore } from '../store/usePlayerStore';
import type { Movie, Episode, Season, Credits } from '../types/movie';

type TabId = 'episodes' | 'similar' | 'details';

export const DetailsModal: React.FC = () => {
  const { detailsModal, closeDetails, addToast } = useAppStore();
  const openPlayer = usePlayerStore((s) => s.openPlayer);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>('similar');
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isSeries = detailsModal.mediaType === 'tv';

  /* Close with animation */
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      closeDetails();
    }, 350);
  }, [closeDetails]);

  /* Escape key */
  useEffect(() => {
    if (!detailsModal.isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [detailsModal.isOpen, handleClose]);

  /* Body scroll lock */
  useEffect(() => {
    if (detailsModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [detailsModal.isOpen]);

  /* Fetch data on open */
  useEffect(() => {
    if (!detailsModal.isOpen || !detailsModal.contentId) return;

    setLoading(true);
    setMovie(null);
    setCredits(null);
    setSimilar([]);
    setEpisodes([]);
    setSelectedSeason(1);
    setActiveTab(isSeries ? 'episodes' : 'similar');

    const id = detailsModal.contentId;

    if (isSeries) {
      Promise.all([
        getSeriesDetails(id),
        getSeriesCredits(id).catch(() => ({ cast: [], crew: [] })),
        getSimilarMovies(id).catch(() => []),
      ]).then(([details, creds, sim]) => {
        const seriesAsMovie = {
          ...details,
          title: details.name || details.title,
          release_date: details.first_air_date || '',
          media_type: 'tv',
        } as Movie;
        setMovie(seriesAsMovie);
        setCredits(creds as Credits);
        setSimilar(sim as Movie[]);
        setSeasons(details.seasons?.filter((s: Season) => s.season_number > 0) || []);
        setInList(watchlistService.isInList(id));
        setLoading(false);
        fetchSeasonEpisodes(id, 1);
      }).catch(() => setLoading(false));
    } else {
      Promise.all([
        getMovieDetails(id),
        getMovieCredits(id).catch(() => ({ cast: [], crew: [] })),
        getSimilarMovies(id).catch(() => []),
      ]).then(([details, creds, sim]) => {
        setMovie({ ...details, media_type: 'movie' });
        setCredits(creds as Credits);
        setSimilar(sim as Movie[]);
        setInList(watchlistService.isInList(id));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [detailsModal.isOpen, detailsModal.contentId, isSeries]);

  async function fetchSeasonEpisodes(seriesId: number, seasonNum: number) {
    try {
      const data = await getSeriesSeasonDetails(seriesId, seasonNum);
      setEpisodes(data.episodes || []);
    } catch { setEpisodes([]); }
  }

  const handleSeasonChange = (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    if (detailsModal.contentId) fetchSeasonEpisodes(detailsModal.contentId, seasonNum);
  };

  const handlePlay = () => {
    if (!movie) return;
    openPlayer({
      streamUrl: isSeries
        ? getSeriesStreamingUrl(movie.id, 1, 1)
        : getStreamingUrl(movie.id, movie.imdb_id),
      movieId: movie.id,
      movieTitle: movie.title || '',
      posterPath: movie.poster_path || '',
      backdropPath: movie.backdrop_path || '',
      mediaType: isSeries ? 'tv' : 'movie',
    });
    handleClose();
  };

  const handlePlayEpisode = (ep: Episode) => {
    if (!movie) return;
    openPlayer({
      streamUrl: getSeriesStreamingUrl(movie.id, ep.season_number, ep.episode_number),
      movieId: movie.id,
      movieTitle: movie.title || '',
      posterPath: movie.poster_path || '',
      backdropPath: movie.backdrop_path || '',
      mediaType: 'tv',
      episodeInfo: {
        season: ep.season_number,
        episode: ep.episode_number,
        name: ep.name,
        still_path: ep.still_path,
      },
    });
    handleClose();
  };

  const handleToggleList = () => {
    if (!movie) return;
    const added = watchlistService.toggle({
      id: movie.id,
      type: isSeries ? 'tv' : 'movie',
      title: movie.title || '',
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      voteAverage: movie.vote_average,
      releaseDate: movie.release_date,
    });
    setInList(added);
    addToast(added ? 'Adicionado à sua lista' : 'Removido da sua lista', added ? 'success' : 'info');
  };

  if (!detailsModal.isOpen) return null;

  const backdropUrl = movie?.backdrop_path ? getImageUrl(movie.backdrop_path, 'original') : '';
  const logoUrl = movie?.logo_path ? getImageUrl(movie.logo_path, 'w500') : null;
  const director = credits?.crew?.find((c) => c.job === 'Director');
  const cast = credits?.cast?.slice(0, 8) || [];
  const releaseYear = getYear(movie?.release_date || movie?.first_air_date || '');

  const tabs: { id: TabId; label: string }[] = [
    ...(isSeries ? [{ id: 'episodes' as TabId, label: 'Episódios' }] : []),
    { id: 'similar', label: 'Similares' },
    { id: 'details', label: 'Detalhes' },
  ];

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        className="details-modal-backdrop"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`details-modal ${closing ? 'closing' : ''}`} ref={scrollRef}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 btn-icon w-10 h-10"
          aria-label="Fechar"
          style={{ background: 'rgba(13,13,20,0.9)' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop header (45vh) */}
        <div className="relative w-full" style={{ height: '45vh', minHeight: 280 }}>
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full bg-surface-1" />
          )}
          {/* Gradients */}
          <div className="absolute inset-0" style={{ background: 'rgba(5,5,8,0.25)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #050508 0%, transparent 60%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #050508 0%, transparent 45%)' }} />

          {/* Loading skeleton */}
          {loading && (
            <div className="absolute inset-0 flex items-end p-8">
              <div className="space-y-3 w-80">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="skeleton h-4 w-64 rounded" />
                <div className="skeleton h-4 w-56 rounded" />
              </div>
            </div>
          )}

          {/* Content over backdrop */}
          {movie && (
            <div
              className="absolute inset-0 flex flex-col justify-end"
              style={{ padding: '0 clamp(16px, 5vw, 80px) 32px' }}
            >
              {/* Logo or title */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={movie.title}
                  className="mb-3 max-h-16 w-auto object-contain"
                  style={{ maxWidth: 300 }}
                  loading="eager"
                />
              ) : (
                <h1
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 300,
                    fontSize: 'clamp(24px, 3vw, 42px)',
                    lineHeight: 1.1,
                    marginBottom: 12,
                  }}
                >
                  {movie.title}
                </h1>
              )}

              {/* Metadata row */}
              <div
                className="flex items-center gap-2 flex-wrap mb-4"
                style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}
              >
                {releaseYear && <span>{releaseYear}</span>}
                {movie.vote_average > 0 && (
                  <>
                    <span>·</span>
                    <span style={{ color: '#C9973A' }}>★ {movie.vote_average.toFixed(1)}</span>
                  </>
                )}
                {movie.runtime && (
                  <>
                    <span>·</span>
                    <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min</span>
                  </>
                )}
                {isSeries && movie.number_of_seasons && (
                  <>
                    <span>·</span>
                    <span>{movie.number_of_seasons} temporada{movie.number_of_seasons > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={handlePlay} className="btn-primary" style={{ padding: '10px 24px' }}>
                  <Play className="w-4 h-4" fill="currentColor" />
                  Assistir
                </button>
                <button
                  onClick={handleToggleList}
                  className="btn-secondary"
                  style={{ padding: '10px 20px' }}
                  aria-label={inList ? 'Remover da lista' : 'Adicionar à lista'}
                >
                  {inList
                    ? <Check className="w-4 h-4" style={{ color: '#4A90D9' }} />
                    : <Plus className="w-4 h-4" />}
                  {inList ? 'Na Lista' : 'Minha Lista'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        {movie && (
          <div style={{ padding: '0 clamp(16px, 5vw, 80px)' }}>
            <div className="detail-tabs mt-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div style={{ padding: '24px clamp(16px, 5vw, 80px) 40px', minHeight: 300 }}>

          {/* ── Episódios ── */}
          {activeTab === 'episodes' && isSeries && movie && (
            <div>
              {/* Season pills */}
              {seasons.length > 1 && (
                <div className="flex gap-2 flex-wrap mb-6">
                  {seasons.map((s) => (
                    <button
                      key={s.season_number}
                      className={`season-pill ${selectedSeason === s.season_number ? 'active' : ''}`}
                      onClick={() => handleSeasonChange(s.season_number)}
                    >
                      T{s.season_number}
                    </button>
                  ))}
                </div>
              )}

              {/* Episode list */}
              <div className="space-y-2">
                {episodes.map((ep) => {
                  const epProgress = progressService.getPercentage(
                    movie.id, ep.season_number, ep.episode_number
                  );
                  const thumbUrl = ep.still_path ? getImageUrl(ep.still_path, 'w300') : '';

                  return (
                    <div
                      key={ep.id}
                      className={`episode-row ${epProgress > 0 && epProgress < 100 ? 'current' : ''}`}
                      onClick={() => handlePlayEpisode(ep)}
                    >
                      {/* Thumbnail */}
                      <div
                        className="relative flex-shrink-0 rounded overflow-hidden group/ep"
                        style={{ width: 160, height: 90, background: 'var(--surface-2)' }}
                      >
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 opacity-30" />
                          </div>
                        )}
                        {/* Hover play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-opacity duration-150"
                          style={{ background: 'rgba(5,5,8,0.6)' }}>
                          <div className="card-play-btn" style={{ width: 36, height: 36 }}>
                            <Play className="w-4 h-4" fill="currentColor" />
                          </div>
                        </div>
                        {/* Progress bar */}
                        {epProgress > 0 && epProgress < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-[3px]"
                            style={{ background: 'rgba(255,255,255,0.15)' }}>
                            <div className="h-full" style={{ width: `${epProgress}%`, background: '#4A90D9' }} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span style={{ fontSize: 13, fontWeight: 400 }}>
                            {ep.episode_number}. {ep.name}
                          </span>
                          {ep.runtime && (
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                              {ep.runtime}min
                            </span>
                          )}
                        </div>
                        {ep.overview && (
                          <p className="line-clamp-2" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Similares ── */}
          {activeTab === 'similar' && (
            <div>
              {similar.length > 0 ? (
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
                >
                  {similar.slice(0, 12).map((m) => (
                    <div key={m.id} className="flex flex-col">
                      <div className="card-movie" style={{ aspectRatio: '2/3' }}
                        onClick={() => {
                          if (m.id !== movie?.id) {
                            useAppStore.getState().openDetails(
                              m.id,
                              (m.media_type as 'movie' | 'tv') || 'movie'
                            );
                          }
                        }}
                      >
                        {m.poster_path ? (
                          <img
                            src={getImageUrl(m.poster_path, 'w300')}
                            alt={m.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                            <Play className="w-6 h-6 opacity-30" />
                          </div>
                        )}
                        <div className="card-gradient" />
                      </div>
                      <p style={{ fontSize: 13, marginTop: 6, fontWeight: 400 }} className="line-clamp-1">
                        {m.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                        {getYear(m.release_date)} {m.vote_average > 0 && `· ★ ${m.vote_average.toFixed(1)}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Nenhum similar encontrado.</p>
              )}
            </div>
          )}

          {/* ── Detalhes ── */}
          {activeTab === 'details' && movie && (
            <div className="space-y-8">
              {/* Synopsis */}
              {movie.overview && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Sinopse
                  </h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Cast */}
              {cast.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Elenco
                  </h3>
                  <div className="flex gap-4 flex-wrap">
                    {cast.map((actor) => (
                      <div key={actor.id} className="flex flex-col items-center" style={{ width: 60 }}>
                        <div
                          className="rounded-full overflow-hidden mb-2"
                          style={{ width: 48, height: 48, background: 'var(--surface-2)' }}
                        >
                          {actor.profile_path ? (
                            <img
                              src={getImageUrl(actor.profile_path, 'w200')}
                              alt={actor.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>👤</span>
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: 11, fontWeight: 400, textAlign: 'center', lineHeight: 1.3 }} className="line-clamp-2">
                          {actor.name}
                        </p>
                        {actor.character && (
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }} className="line-clamp-1">
                            {actor.character}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4">
                {director && (
                  <div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Direção</p>
                    <p style={{ fontSize: 14 }}>{director.name}</p>
                  </div>
                )}
                {movie.genres && movie.genres.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Gêneros</p>
                    <div className="flex flex-wrap gap-2">
                      {movie.genres.map((g) => (
                        <span
                          key={g.id}
                          style={{
                            fontSize: 12,
                            padding: '2px 10px',
                            borderRadius: 12,
                            background: 'var(--surface-2)',
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {movie.production_companies && movie.production_companies.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Produção</p>
                    <p style={{ fontSize: 14 }}>
                      {movie.production_companies.slice(0, 2).map((c) => c.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.getElementById('portal-root') || document.body
  );
};
