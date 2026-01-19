import { useState, useEffect, useCallback } from 'react';
import { enhancedWatchHistoryService } from '@/services/enhancedWatchHistoryService';

interface WatchProgress {
  videoId: number;
  type: 'movie' | 'series';
  currentTime: number;
  duration: number;
  progress: number;
  lastUpdated: number;
  deviceId: string;
  title: string;
  poster_path: string | null;
  season?: number;
  episode?: number;
}

/**
 * Hook para gerenciar watch history de forma reativa
 */
export const useWatchHistory = () => {
  const [continueWatching, setContinueWatching] = useState<WatchProgress[]>([]);
  const [fullHistory, setFullHistory] = useState<WatchProgress[]>([]);
  const [stats, setStats] = useState({
    totalWatched: 0,
    totalMinutes: 0,
    moviesWatched: 0,
    seriesWatched: 0,
    averageProgress: 0,
  });

  /**
   * Atualiza dados do histórico
   */
  const refreshData = useCallback(() => {
    setContinueWatching(enhancedWatchHistoryService.getContinueWatching(10));
    setFullHistory(enhancedWatchHistoryService.getFullHistory(50));
    setStats(enhancedWatchHistoryService.getStats());
  }, []);

  /**
   * Subscribe para mudanças
   */
  useEffect(() => {
    refreshData();
    const unsubscribe = enhancedWatchHistoryService.subscribe(() => {
      refreshData();
    });

    return unsubscribe;
  }, [refreshData]);

  /**
   * Atualiza progresso
   */
  const updateProgress = useCallback(
    (
      videoId: number,
      currentTime: number,
      duration: number,
      metadata: {
        type: 'movie' | 'series';
        title: string;
        poster_path: string | null;
        season?: number;
        episode?: number;
      }
    ) => {
      enhancedWatchHistoryService.updateProgress(videoId, currentTime, duration, metadata);
    },
    []
  );

  /**
   * Obtém progresso de um vídeo
   */
  const getProgress = useCallback((videoId: number) => {
    return enhancedWatchHistoryService.getProgress(videoId);
  }, []);

  /**
   * Remove item
   */
  const removeItem = useCallback((videoId: number) => {
    enhancedWatchHistoryService.removeItem(videoId);
  }, []);

  /**
   * Limpa histórico
   */
  const clearHistory = useCallback(() => {
    enhancedWatchHistoryService.clearHistory();
  }, []);

  /**
   * Marca como assistido
   */
  const markAsWatched = useCallback((videoId: number) => {
    enhancedWatchHistoryService.markAsWatched(videoId);
  }, []);

  return {
    continueWatching,
    fullHistory,
    stats,
    updateProgress,
    getProgress,
    removeItem,
    clearHistory,
    markAsWatched,
    refreshData,
  };
};

export default useWatchHistory;
