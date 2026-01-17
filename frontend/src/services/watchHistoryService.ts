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

  /**
   * Obtém um seed de rotação baseado no tempo (muda a cada 4 horas)
   * Isso faz o conteúdo variar ao longo do dia sem precisar de refresh
   */
  getRotationSeed(): number {
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;
    return Math.floor(now / fourHours);
  }

  /**
   * Shuffle determinístico baseado em seed
   * Mesmo seed = mesma ordem, diferente seed = ordem diferente
   */
  shuffleWithSeed<T>(array: T[], seed: number): T[] {
    const result = [...array];
    let currentSeed = seed;
    
    // Algoritmo de shuffle simples baseado em seed
    const random = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
  }

  /**
   * Obtém gêneros para descoberta (que o usuário NÃO assistiu muito)
   * Ajuda a diversificar as recomendações
   */
  getDiscoveryGenres(allGenres: number[], limit: number = 2): number[] {
    const watchedGenres = new Set(this.getTopGenres(10));
    const discoveryGenres = allGenres.filter(g => !watchedGenres.has(g));
    
    // Shuffle com seed para variar ao longo do tempo
    const shuffled = this.shuffleWithSeed(discoveryGenres, this.getRotationSeed());
    return shuffled.slice(0, limit);
  }

  /**
   * Retorna a hora do dia para ajustar recomendações
   * 0 = madrugada, 1 = manhã, 2 = tarde, 3 = noite
   */
  getTimeOfDay(): number {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return 0;  // Madrugada
    if (hour >= 6 && hour < 12) return 1; // Manhã
    if (hour >= 12 && hour < 18) return 2; // Tarde
    return 3; // Noite
  }

  /**
   * Gêneros recomendados por hora do dia
   */
  getTimeBasedGenreBoost(): number[] {
    const timeOfDay = this.getTimeOfDay();
    
    // Gêneros mais populares por período
    switch (timeOfDay) {
      case 0: // Madrugada - Terror, Thriller, Suspense
        return [27, 53, 9648];
      case 1: // Manhã - Família, Animação, Comédia
        return [10751, 16, 35];
      case 2: // Tarde - Ação, Aventura, Ficção
        return [28, 12, 878];
      case 3: // Noite - Drama, Romance, Crime
        return [18, 10749, 80];
      default:
        return [];
    }
  }

  /**
   * Gera um mix inteligente de gêneros para recomendação
   * Combina: favoritos (60%) + hora do dia (20%) + descoberta (20%)
   */
  getSmartGenreMix(allGenres: number[]): number[] {
    const favorites = this.getTopGenres(3);
    const timeBoost = this.getTimeBasedGenreBoost();
    const discovery = this.getDiscoveryGenres(allGenres, 2);
    
    // Se não tem histórico, usa hora do dia + popular
    if (favorites.length === 0) {
      const popularGenres = [28, 12, 35, 18, 878]; // Ação, Aventura, Comédia, Drama, Sci-Fi
      return [...timeBoost.slice(0, 2), ...this.shuffleWithSeed(popularGenres, this.getRotationSeed()).slice(0, 3)];
    }
    
    // Mix inteligente sem duplicatas
    const mix = new Set<number>();
    
    // 60% favoritos (3 gêneros)
    favorites.forEach(g => mix.add(g));
    
    // 20% hora do dia (1 gênero que não está nos favoritos)
    timeBoost.filter(g => !mix.has(g)).slice(0, 1).forEach(g => mix.add(g));
    
    // 20% descoberta (1 gênero novo)
    discovery.filter(g => !mix.has(g)).slice(0, 1).forEach(g => mix.add(g));
    
    return Array.from(mix);
  }

  /**
   * Diversifica uma lista de conteúdo para não repetir gêneros seguidos
   */
  diversifyContent<T extends { genre_ids?: number[] }>(items: T[]): T[] {
    if (items.length <= 2) return items;
    
    const result: T[] = [];
    const remaining = [...items];
    const usedGenres = new Set<number>();
    
    while (remaining.length > 0) {
      // Encontra o próximo item que não compartilha gêneros recentes
      let bestIndex = 0;
      let bestScore = -1;
      
      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i];
        const genres = item.genre_ids || [];
        
        // Conta quantos gêneros NÃO foram usados recentemente
        const uniqueGenres = genres.filter(g => !usedGenres.has(g)).length;
        const score = uniqueGenres / (genres.length || 1);
        
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      
      const chosen = remaining.splice(bestIndex, 1)[0];
      result.push(chosen);
      
      // Atualiza gêneros usados (mantém apenas os últimos 3 itens)
      if (result.length > 3) {
        usedGenres.clear();
      }
      (chosen.genre_ids || []).forEach(g => usedGenres.add(g));
    }
    
    return result;
  }
}

export const watchHistoryService = new WatchHistoryService();
export type { WatchedItem, RecommendationScore };
