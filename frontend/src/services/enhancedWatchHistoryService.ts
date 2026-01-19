/**
 * Enhanced Watch History Service
 * Com sincronização em tempo real e cross-device support
 */

interface WatchProgress {
  videoId: number;
  type: 'movie' | 'series';
  currentTime: number;
  duration: number;
  progress: number; // 0-100%
  lastUpdated: number;
  deviceId: string;
  title: string;
  poster_path: string | null;
  season?: number;
  episode?: number;
}

const STORAGE_KEY = 'kkmovies_watch_history_v2';
const SYNC_INTERVAL = 5000; // Sync a cada 5 segundos
const DEBOUNCE_DELAY = 1000; // Aguarda 1s antes de salvar

class EnhancedWatchHistoryService {
  private history: Map<number, WatchProgress> = new Map();
  private deviceId: string;
  private syncTimer: number | null = null;
  private saveTimer: number | null = null;
  private listeners: Set<(progress: WatchProgress) => void> = new Set();

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.loadHistory();
    this.startSyncTimer();
    this.setupStorageListener();
  }

  /**
   * Gera ou recupera ID único do dispositivo
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('kkmovies_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('kkmovies_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Carrega histórico do localStorage
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.history = new Map(Object.entries(data).map(([key, value]) => [
          Number(key),
          value as WatchProgress,
        ]));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      this.history = new Map();
    }
  }

  /**
   * Salva histórico no localStorage (debounced)
   */
  private saveHistory(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      try {
        const data = Object.fromEntries(this.history);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Dispara evento para sincronizar com outras abas
        window.dispatchEvent(new CustomEvent('watch_history_updated', {
          detail: { deviceId: this.deviceId, timestamp: Date.now() },
        }));
      } catch (error) {
        console.error('Erro ao salvar histórico:', error);
      }
    }, DEBOUNCE_DELAY);
  }

  /**
   * Sincronização entre abas/dispositivos
   */
  private setupStorageListener(): void {
    // Detecta mudanças em outras abas
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        this.loadHistory();
        this.notifyListeners();
      }
    });

    // Detecta custom events (mesma aba)
    window.addEventListener('watch_history_updated', ((e: CustomEvent) => {
      if (e.detail.deviceId !== this.deviceId) {
        this.loadHistory();
        this.notifyListeners();
      }
    }) as EventListener);
  }

  /**
   * Timer para sync periódica
   */
  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      this.syncWithServer();
    }, SYNC_INTERVAL);
  }

  /**
   * Sincroniza com servidor (futuro: WebSocket/API)
   */
  private async syncWithServer(): Promise<void> {
    // TODO: Implementar sync com backend
    // const response = await fetch('/api/watch-history/sync', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     deviceId: this.deviceId,
    //     history: Array.from(this.history.values()),
    //   }),
    // });
  }

  /**
   * Atualiza progresso de visualização
   */
  updateProgress(
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
  ): void {
    const progress = Math.min(100, Math.max(0, (currentTime / duration) * 100));

    const watchProgress: WatchProgress = {
      videoId,
      type: metadata.type,
      currentTime,
      duration,
      progress,
      lastUpdated: Date.now(),
      deviceId: this.deviceId,
      title: metadata.title,
      poster_path: metadata.poster_path,
      season: metadata.season,
      episode: metadata.episode,
    };

    this.history.set(videoId, watchProgress);
    this.saveHistory();
    this.notifyListeners(watchProgress);
  }

  /**
   * Obtém progresso de um vídeo específico
   */
  getProgress(videoId: number): WatchProgress | null {
    return this.history.get(videoId) || null;
  }

  /**
   * Obtém todos os itens em progresso (< 95%)
   */
  getContinueWatching(limit: number = 10): WatchProgress[] {
    return Array.from(this.history.values())
      .filter((item) => item.progress < 95 && item.progress > 5)
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, limit);
  }

  /**
   * Obtém histórico completo
   */
  getFullHistory(limit: number = 50): WatchProgress[] {
    return Array.from(this.history.values())
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, limit);
  }

  /**
   * Remove item do histórico
   */
  removeItem(videoId: number): void {
    this.history.delete(videoId);
    this.saveHistory();
    this.notifyListeners();
  }

  /**
   * Limpa histórico completo
   */
  clearHistory(): void {
    this.history.clear();
    this.saveHistory();
    this.notifyListeners();
  }

  /**
   * Marca vídeo como completamente assistido
   */
  markAsWatched(videoId: number): void {
    const item = this.history.get(videoId);
    if (item) {
      item.progress = 100;
      item.currentTime = item.duration;
      item.lastUpdated = Date.now();
      this.saveHistory();
      this.notifyListeners(item);
    }
  }

  /**
   * Subscribe para mudanças no histórico
   */
  subscribe(listener: (progress?: WatchProgress) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica listeners
   */
  private notifyListeners(progress?: WatchProgress): void {
    this.listeners.forEach((listener) => listener(progress!));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.listeners.clear();
  }

  /**
   * Exporta dados para backup
   */
  exportData(): string {
    return JSON.stringify({
      deviceId: this.deviceId,
      history: Array.from(this.history.entries()),
      exportedAt: Date.now(),
    });
  }

  /**
   * Importa dados de backup
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.history = new Map(data.history);
      this.saveHistory();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }

  /**
   * Estatísticas de visualização
   */
  getStats(): {
    totalWatched: number;
    totalMinutes: number;
    moviesWatched: number;
    seriesWatched: number;
    averageProgress: number;
  } {
    const items = Array.from(this.history.values());
    const totalMinutes = items.reduce((sum, item) => sum + (item.currentTime / 60), 0);
    const moviesWatched = items.filter((item) => item.type === 'movie').length;
    const seriesWatched = items.filter((item) => item.type === 'series').length;
    const averageProgress = items.reduce((sum, item) => sum + item.progress, 0) / items.length || 0;

    return {
      totalWatched: items.length,
      totalMinutes: Math.round(totalMinutes),
      moviesWatched,
      seriesWatched,
      averageProgress: Math.round(averageProgress),
    };
  }
}

// Export singleton
export const enhancedWatchHistoryService = new EnhancedWatchHistoryService();

export default EnhancedWatchHistoryService;
