import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Hls from 'hls.js';
import {
  X,
  Maximize,
  Minimize,
  PictureInPicture2,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Server,
  ChevronDown,
  Film,
  Zap,
  Settings,
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { watchHistoryService } from '../../services/watchHistoryService';
import { usePopupBlocker } from '../../hooks/usePopupBlocker';
import { SFIcon } from '../ui/SFIcon';
import {
  getMovieStreams as getTMDBEmbedMovieStreams,
  getSeriesStreams as getTMDBEmbedSeriesStreams,
  tmdbEmbedSettings,
} from '../../services/tmdbEmbedService';
import type { StreamingServer, TMDBEmbedStream, EmbedServer } from '../../types/tmdbEmbed';
import {
  SERVER_INFO,
  formatQualityLabel,
  qualityToNumber,
  getProviderDisplayName,
} from '../../types/tmdbEmbed';
import { getStreamsGrouped } from '../../services/tmdbEmbedService';
import { resolveMovieStream, resolveSeriesStream } from '../../services/movieService';
import { popupBlocker } from '../../utils/popupBlocker';

export const PlayerModal: React.FC = () => {
  const {
    isOpen,
    streamUrl,
    movieId,
    movieTitle,
    posterPath,
    backdropPath,
    mediaType,
    episodeInfo,
    server,
    availableStreams,
    selectedStream,
    imdbId,
    closePlayer,
    setServer,
    setStreams,
    selectStream,
  } = usePlayerStore();

  const { blockedCount } = usePopupBlocker();

  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [userRequestedRefresh, setUserRequestedRefresh] = useState(0);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [streamLoading, setStreamLoading] = useState(false);
  const [showStreamPicker, setShowStreamPicker] = useState(false);
  const [tmdbEmbedAvailable, setTmdbEmbedAvailable] = useState(false);
  const [activeSrc, setActiveSrc] = useState('');
  const [playerError, setPlayerError] = useState<'unavailable' | 'offline' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const MAX_AUTO_RETRIES = 2;
  const [autoRetryCount, setAutoRetryCount] = useState(0);


  const serverInfo = SERVER_INFO[server];

  useEffect(() => {
    setAutoRetryCount(0);
  }, [movieId, episodeInfo?.season, episodeInfo?.episode, server]);

  useEffect(() => {
    setTmdbEmbedAvailable(tmdbEmbedSettings.isEnabled());
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && movieId) {
      watchHistoryService.save({
        movieId,
        title: movieTitle,
        posterPath,
        backdropPath: backdropPath || null,
        progress: 5,
        currentTime: 0,
        duration: 0,
        lastWatched: Date.now(),
        completed: false,
        media_type: mediaType,
        episodeInfo: episodeInfo || undefined,
      });
    }
  }, [isOpen, movieId, movieTitle, posterPath, backdropPath, mediaType, episodeInfo]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (isOpen) showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isOpen, showControls]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closePlayer();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case ' ':
          e.preventDefault();
          if (server === 'tmdb-embed' && videoRef.current) {
            togglePlayPause();
          }
          break;
        case 'ArrowLeft':
          if (server === 'tmdb-embed') {
            videoRef.current?.currentTime && (videoRef.current.currentTime -= 10);
          }
          break;
        case 'ArrowRight':
          if (server === 'tmdb-embed') {
            videoRef.current?.currentTime && (videoRef.current.currentTime += 10);
          }
          break;
        case 'm':
        case 'M':
          if (server === 'tmdb-embed') {
            toggleMute();
          }
          break;
      }
      showControls();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closePlayer, showControls, server]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !movieId) return;
    let cancelled = false;

    setLoading(true);
    setPlayerError(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    if (server === 'tmdb-embed') {
      void loadTMDBEmbedStreams();
      return () => {
        cancelled = true;
      };
    }

    async function bootEmbedServer() {
      const embedServer = server as EmbedServer;
      try {
        const resolved =
          mediaType === 'tv'
            ? await resolveSeriesStream(
              movieId!,
              episodeInfo?.season || 1,
              episodeInfo?.episode || 1,
              { server: embedServer },
            )
            : await resolveMovieStream(movieId!, imdbId, { server: embedServer });

        if (cancelled) return;

        const url = resolved.streamUrl || streamUrl;
        setActiveSrc(url);

        const unavailable =
          resolved.mode === 'unavailable' ||
          Boolean(resolved.diagnostics?.unavailable) ||
          ((resolved.diagnostics?.status ?? 0) >= 400);

        if (!url || unavailable) {
          setPlayerError('unavailable');
          setLoading(false);
          return;
        }
      } catch {
        if (cancelled) return;
        if (streamUrl) {
          setActiveSrc(streamUrl);
        } else {
          setPlayerError('offline');
          setLoading(false);
        }
      }
    }

    void bootEmbedServer();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    streamUrl,
    userRequestedRefresh,
    server,
    movieId,
    mediaType,
    imdbId,
    episodeInfo?.season,
    episodeInfo?.episode,
  ]);

  useEffect(() => {
    if (server !== 'tmdb-embed' || !selectedStream?.url) return;
    initNativePlayer(selectedStream.url);
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [server, selectedStream?.url]);

  const loadTMDBEmbedStreams = async () => {
    if (!movieId) return;
    setStreamLoading(true);
    try {
      const result = mediaType === 'tv'
        ? await getTMDBEmbedSeriesStreams(movieId, {
          season: episodeInfo?.season,
          episode: episodeInfo?.episode,
        })
        : await getTMDBEmbedMovieStreams(movieId);

      if (result.available && result.streams.length > 0) {
        setStreams(result.streams);
        selectStream(result.streams[0]);
      } else {
        setServer('vidsrc');
      }
    } catch {
      setServer('vidsrc');
    } finally {
      setStreamLoading(false);
    }
  };

  const initNativePlayer = (url: string) => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    setLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && url.includes('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = url;
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
    if (iframeRef.current) popupBlocker.sandboxIframe(iframeRef.current);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoading(false);
    }
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);
  const handleVideoWaiting = () => setLoading(true);
  const handleVideoPlaying = () => setLoading(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* ignore */ }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (server === 'tmdb-embed' && videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch { /* PiP not available */ }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const v = parseFloat(e.target.value);
    videoRef.current.volume = v;
    videoRef.current.muted = v === 0;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || !duration) return;
    const pct = parseFloat(e.target.value);
    videoRef.current.currentTime = (pct / 100) * duration;
    setCurrentTime(videoRef.current.currentTime);
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current && duration) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const handleRefreshPlayer = () => {
    setPlayerError(null);
    setLoading(true);
    setUserRequestedRefresh((n) => n + 1);
  };

  const switchServer = async (newServer: StreamingServer) => {
    setShowServerMenu(false);
    setServer(newServer);
    setLoading(true);
    if (newServer === 'tmdb-embed' && availableStreams.length === 0) {
      await loadTMDBEmbedStreams();
    }
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const streamsByProvider = useMemo(() => getStreamsGrouped(availableStreams), [availableStreams]);

  if (!isOpen) return null;

  const iframeSrc = userRequestedRefresh
    ? `${activeSrc}${activeSrc.includes('?') ? '&' : '?'}_kf_refresh=${userRequestedRefresh}`
    : activeSrc;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9998] bg-black flex items-center justify-center"
      onMouseMove={showControls}
      onClick={showControls}
      onDoubleClick={server === 'tmdb-embed' ? togglePlayPause : toggleFullscreen}
    >
      {loading && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-kf-accent animate-spin" />
            <p className="text-sm text-kf-text-secondary">
              {streamLoading ? 'Buscando fontes de streaming...' : `Carregando ${movieTitle}...`}
            </p>
          </div>
        </div>
      )}

      {(server === '111movies' || server === 'vidsrc' || server === 'vidking') && !playerError && activeSrc ? (
        <iframe
          key={`player-${userRequestedRefresh}`}
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-none bg-black"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          title={movieTitle}
          onLoad={handleIframeLoad}
          referrerPolicy="no-referrer"
        />
      ) : server === 'tmdb-embed' ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedMetadata={handleVideoLoadedMetadata}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onWaiting={handleVideoWaiting}
            onPlaying={handleVideoPlaying}
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            playsInline
            crossOrigin="anonymous"
          />
        </div>
      ) : null}

      {playerError && (server === '111movies' || server === 'vidsrc' || server === 'vidking') && (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-4 bg-[var(--surface-0)]">
          <div className="player-error-card max-w-md w-full text-center p-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[rgba(255,59,48,0.14)] border border-[rgba(255,59,48,0.35)] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-[#FF453A]" />
            </div>
            <h3 className="text-[18px] font-semibold tracking-tight mb-2">
              Servidor Temporariamente Indisponível
            </h3>
            <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed mb-5">
              Não foi possível estabelecer conexão com o servidor <strong>{SERVER_INFO[server].name}</strong> no momento. Tente novamente ou escolha outra fonte de vídeo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleRefreshPlayer}
                className="glass-button !py-2.5 !px-4"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
              {server !== 'vidsrc' && (
                <button
                  type="button"
                  onClick={() => switchServer('vidsrc')}
                  className="glass-button !py-2.5 !px-4"
                >
                  💎 VidSrc
                </button>
              )}
              {server !== '111movies' && (
                <button
                  type="button"
                  onClick={() => switchServer('111movies')}
                  className="glass-button !py-2.5 !px-4"
                >
                  🎬 111movies
                </button>
              )}
              {server !== 'vidking' && (
                <button
                  type="button"
                  onClick={() => switchServer('vidking')}
                  className="glass-button !py-2.5 !px-4"
                >
                  👑 VidKing
                </button>
              )}
              {tmdbEmbedAvailable && (
                <button
                  type="button"
                  onClick={() => switchServer('tmdb-embed')}
                  className="glass-button primary !py-2.5 !px-4"
                >
                  <Zap className="w-4 h-4" />
                  Fontes Nativas
                </button>
              )}
              <button
                type="button"
                onClick={closePlayer}
                className="glass-button !py-2.5 !px-4"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {server === 'tmdb-embed' && availableStreams.length === 0 && !streamLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-center max-w-md p-6 pointer-events-auto glass-modal">
            <Zap className="w-12 h-12 mx-auto mb-3 text-ios-yellow" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fonte nativa encontrada</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              As fontes nativas não retornaram transmissão para este título. Você pode usar os players incorporados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => switchServer('vidsrc')}
                className="glass-button primary"
                type="button"
              >
                💎 VidSrc
              </button>
              <button
                onClick={() => switchServer('111movies')}
                className="glass-button"
                type="button"
              >
                🎬 111movies
              </button>
              <button
                onClick={() => switchServer('vidking')}
                className="glass-button"
                type="button"
              >
                👑 VidKing
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between
          bg-gradient-to-b from-black/80 to-transparent
          player-controls ${controlsVisible ? '' : 'hidden-controls'}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={closePlayer}
            className="glass-icon-btn !bg-black/50 !w-10 !h-10"
            aria-label="Fechar player"
            type="button"
          >
            <SFIcon icon={X} size={20} strokeWidth={2} />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm md:text-base font-semibold truncate max-w-[50vw]">{movieTitle}</h3>
            {episodeInfo && (
              <p className="text-xs text-[var(--text-secondary)] truncate">
                T{episodeInfo.season} · E{episodeInfo.episode}{episodeInfo.name ? ` · ${episodeInfo.name}` : ''}
              </p>
            )}
          </div>
          {blockedCount > 0 && (
            <span className="shield-badge" title={`${blockedCount} popup(s) bloqueado(s)`}>
              <SFIcon icon={ShieldCheck} size={14} strokeWidth={1.75} />
              {blockedCount}
            </span>
          )}

          <div className="relative ml-2">
            <button
              onClick={() => { setShowServerMenu(!showServerMenu); setShowStreamPicker(false); }}
              className="glass-button !py-1.5 !px-3 !min-h-[32px] !text-[12px] gap-1.5"
              type="button"
              aria-label="Selecionar servidor"
            >
              <span className="text-base">{serverInfo.icon}</span>
              <span className="hidden xs:inline">{serverInfo.name}</span>
              <SFIcon icon={ChevronDown} size={14} strokeWidth={2} />
            </button>

            {showServerMenu && (
              <div className="absolute left-0 top-full mt-2 z-50 glass-modal overflow-hidden w-64 animate-slide-down">
                <div className="px-3 py-2 border-b border-[var(--glass-separator)]">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-medium">
                    Servidores disponíveis
                  </p>
                </div>
                {(['111movies', 'vidsrc', 'vidking', 'tmdb-embed'] as StreamingServer[]).filter((s) =>
                  (s !== 'tmdb-embed') || (s === 'tmdb-embed' && tmdbEmbedAvailable)
                ).map((s) => {
                  const info = SERVER_INFO[s];
                  const active = s === server;
                  return (
                    <button
                      key={s}
                      onClick={() => switchServer(s)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${active ? 'bg-[var(--accent-blue-dim)]' : 'hover:bg-[var(--surface-2)]'
                        }`}
                      type="button"
                    >
                      <span className="text-2xl">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[14px]">{info.name}</span>
                          {active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-blue)] text-white">ATIVO</span>}
                        </div>
                        <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                          {info.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {!tmdbEmbedAvailable && (
                  <div className="px-4 py-3 border-t border-[var(--glass-separator)]">
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      <Settings className="w-3 h-3 inline mr-1" />
                      Ative fontes nativas em Ajustes para ter um servidor extra
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {server === 'tmdb-embed' && availableStreams.length > 0 && (
            <div className="relative">
              <button
                onClick={() => { setShowStreamPicker(!showStreamPicker); setShowServerMenu(false); }}
                className="glass-button !py-1.5 !px-3 !min-h-[32px] !text-[12px] gap-1.5"
                type="button"
                aria-label="Selecionar fonte"
              >
                <SFIcon icon={Server} size={14} />
                <span className="hidden xs:inline">
                  {selectedStream ? getProviderDisplayName(selectedStream.provider) : 'Fontes'}
                </span>
                {selectedStream && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--ios-green)] text-black font-semibold">
                    {formatQualityLabel(selectedStream.quality)}
                  </span>
                )}
              </button>

              {showStreamPicker && (
                <div className="absolute left-0 top-full mt-2 z-50 glass-modal overflow-hidden w-80 max-h-[60vh] overflow-y-auto animate-slide-down">
                  <div className="px-4 py-3 border-b border-[var(--glass-separator)] sticky top-0 bg-[var(--glass-bg)] backdrop-blur-xl">
                    <p className="text-[13px] font-semibold">
                      {availableStreams.length} fonte(s) disponível(is)
                    </p>
                  </div>
                  {Object.entries(streamsByProvider).map(([provider, streams]) => (
                    <div key={provider}>
                      <div className="px-4 py-2 bg-[var(--surface-2)]/50">
                        <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-medium">
                          {getProviderDisplayName(provider)}
                        </p>
                      </div>
                      {(streams as TMDBEmbedStream[]).map((stream: TMDBEmbedStream, idx: number) => {
                        const isActive = selectedStream?.url === stream.url;
                        const qNum = qualityToNumber(stream.quality);
                        const isFullHdPlus = qNum >= 1080;
                        const isHdPlus = qNum >= 720;
                        return (
                          <button
                            key={`${provider}-${idx}`}
                            onClick={() => {
                              selectStream(stream);
                              setShowStreamPicker(false);
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-[var(--accent-blue-dim)]' : 'hover:bg-[var(--surface-2)]'
                              }`}
                            type="button"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate">
                                {stream.title || stream.name}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-[11px] px-2 py-1 rounded-md font-semibold" style={{
                              background: `var(--ios-${isFullHdPlus ? 'green' : isHdPlus ? 'blue' : 'gray'}, ${isFullHdPlus ? '#34C759' : isHdPlus ? '#007AFF' : '#8E8E93'})`,
                              color: isHdPlus ? 'white' : 'black',
                            }}>
                              {formatQualityLabel(stream.quality)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {server === 'tmdb-embed' && (
            <a
              href={selectedStream?.url || streamUrl || activeSrc}
              target="_blank"
              rel="noopener noreferrer"
              data-allow-popup="true"
              className="glass-icon-btn !bg-black/40 !w-10 !h-10 ml-auto hidden xs:flex"
              aria-label="Abrir em nova aba"
              title="Abrir em nova aba"
            >
              <SFIcon icon={ExternalLink} size={16} strokeWidth={1.75} />
            </a>
          )}
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 p-4
          bg-gradient-to-t from-black/80 to-transparent
          player-controls ${controlsVisible ? '' : 'hidden-controls'}`}
      >
        {server === 'tmdb-embed' && (
          <div className="mb-3">
            <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group">
              <div
                className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                style={{ width: `${bufferedPct}%` }}
              />
              <div
                className="absolute top-0 left-0 h-full bg-[var(--ios-blue)] rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={progressPct}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg -translate-x-1/2"
                style={{ left: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-white/70 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {server === 'tmdb-embed' ? (
              <>
                <button type="button" onClick={skipBackward} className="glass-icon-btn !bg-black/40 !w-10 !h-10" aria-label="Voltar 10 segundos">
                  <SFIcon icon={SkipBack} size={18} strokeWidth={1.75} />
                </button>
                <button type="button" onClick={togglePlayPause} className="glass-icon-btn !bg-white !text-black !w-12 !h-12" aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}>
                  {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
                </button>
                <button type="button" onClick={skipForward} className="glass-icon-btn !bg-black/40 !w-10 !h-10" aria-label="Avançar 10 segundos">
                  <SFIcon icon={SkipForward} size={18} strokeWidth={1.75} />
                </button>
                <div className="hidden sm:flex items-center gap-2 ml-2">
                  <button type="button" onClick={toggleMute} className="glass-icon-btn !bg-black/40 !w-8 !h-8" aria-label={isMuted ? 'Ativar som' : 'Silenciar'}>
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-[var(--ios-blue)]"
                  />
                </div>
              </>
            ) : (
              <p className="text-[11px] text-white/50 px-1">
                Os controles de reprodução encontram-se disponíveis no player do servidor
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {server === 'tmdb-embed' && (
              <>
                <button type="button" onClick={togglePiP} className="glass-icon-btn !bg-black/40 !w-10 !h-10 hidden md:flex" aria-label="Miniplayer">
                  <SFIcon icon={PictureInPicture2} size={18} strokeWidth={1.75} />
                </button>
              </>
            )}
            <button type="button" onClick={toggleFullscreen} className="glass-icon-btn !bg-black/40 !w-10 !h-10" aria-label="Tela cheia">
              {isFullscreen
                ? <SFIcon icon={Minimize} size={18} strokeWidth={1.75} />
                : <SFIcon icon={Maximize} size={18} strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('portal-root') || document.body
  );
};