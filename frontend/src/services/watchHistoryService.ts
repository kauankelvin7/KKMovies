/**
 * Watch History Service - Gerencia histórico de visualização por IP/usuário
 */

interface WatchedItem {
  id: number;
  type: 'movie' | 'series';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids: number[];
  watchedAt: number;
  progress?: number; // 0-100%
  season?: number;
  episode?: number;
}

interface RecommendationScore {
  genreId: number;
  score: number;
}

const STORAGE_KEY_PREFIX = 'kkmovies_watch_history_';
const MAX_HISTORY = 50;

class WatchHistoryService {
  private history: WatchedItem[] = [];
  private userIp: string = '';

  constructor() {
    this.initializeUserIp();
  }

  /**
   * Obtém o IP do usuário
   */
  private async initializeUserIp(): Promise<void> {
    try {
      // Tenta obter o IP via API pública
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      this.userIp = data.ip;
    } catch (error) {
      // Fallback: usa um identificador único baseado no navegador
      this.userIp = this.getOrCreateBrowserId();
    }
    this.loadHistory();
  }

  /**
   * Cria ou obtém um ID único para o navegador
   */
  private getOrCreateBrowserId(): string {
    let browserId = localStorage.getItem('kkmovies_browser_id');
    if (!browserId) {
      browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('kkmovies_browser_id', browserId);
    }
    return browserId;
  }

  /**
   * Gera a chave de storage baseada no IP/ID do usuário
   */
  private getStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.userIp || 'default'}`;
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading watch history:', error);
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.history));
    } catch (error) {
      console.error('Error saving watch history:', error);
    }
  }

  /**
   * Adiciona um item ao histórico de visualização
   */
  addToHistory(item: Omit<WatchedItem, 'watchedAt'>): void {
    // Remove item existente se já assistiu
    this.history = this.history.filter(
      (h) => !(h.id === item.id && h.type === item.type)
    );

    // Adiciona no início
    this.history.unshift({
      ...item,
      watchedAt: Date.now(),
    });

    // Mantém apenas os últimos MAX_HISTORY itens
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }

    this.saveHistory();
  }

  /**
   * Atualiza o progresso de um item
   */
  updateProgress(id: number, type: 'movie' | 'series', progress: number, season?: number, episode?: number): void {
    const item = this.history.find((h) => h.id === id && h.type === type);
    if (item) {
      item.progress = progress;
      if (season !== undefined) item.season = season;
      if (episode !== undefined) item.episode = episode;
      item.watchedAt = Date.now();
      this.saveHistory();
    }
  }

  /**
   * Obtém histórico recente
   */
  getRecentlyWatched(limit: number = 10): WatchedItem[] {
    return this.history.slice(0, limit);
  }

  /**
   * Obtém itens que ainda não foram completados
   */
  getContinueWatching(): WatchedItem[] {
    return this.history.filter(
      (item) => item.progress !== undefined && item.progress > 0 && item.progress < 95
    ).slice(0, 10);
  }

  /**
   * Calcula scores de gêneros baseado no histórico
   */
  getGenrePreferences(): RecommendationScore[] {
    const genreScores: Map<number, number> = new Map();
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    this.history.forEach((item, index) => {
      // Peso baseado na posição (mais recente = maior peso)
      const positionWeight = 1 - (index / MAX_HISTORY) * 0.5;
      
      // Peso baseado no tempo (última semana = maior peso)
      const timeDiff = now - item.watchedAt;
      const timeWeight = timeDiff < weekMs ? 1 : 0.5;
      
      // Peso baseado na avaliação
      const ratingWeight = item.vote_average / 10;

      const totalWeight = positionWeight * timeWeight * ratingWeight;

      item.genre_ids.forEach((genreId) => {
        const current = genreScores.get(genreId) || 0;
        genreScores.set(genreId, current + totalWeight);
      });
    });

    return Array.from(genreScores.entries())
      .map(([genreId, score]) => ({ genreId, score }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Obtém os top gêneros preferidos
   */
  getTopGenres(limit: number = 3): number[] {
    return this.getGenrePreferences()
      .slice(0, limit)
      .map((g) => g.genreId);
  }

  /**
   * Limpa o histórico
   */
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Remove um item do histórico
   */
  removeFromHistory(id: number, type: 'movie' | 'series'): void {
    this.history = this.history.filter(
      (h) => !(h.id === id && h.type === type)
    );
    this.saveHistory();
  }

  /**
   * Verifica se um item foi assistido
   */
  isWatched(id: number, type: 'movie' | 'series'): boolean {
    return this.history.some((h) => h.id === id && h.type === type);
  }

  /**
   * Obtém estatísticas do usuário
   */
  getStats(): { totalWatched: number; moviesWatched: number; seriesWatched: number; favoriteGenres: number[] } {
    const movies = this.history.filter((h) => h.type === 'movie');
    const series = this.history.filter((h) => h.type === 'series');
    
    return {
      totalWatched: this.history.length,
      moviesWatched: movies.length,
      seriesWatched: series.length,
      favoriteGenres: this.getTopGenres(5),
    };
  }
}

export const watchHistoryService = new WatchHistoryService();
export type { WatchedItem, RecommendationScore };
