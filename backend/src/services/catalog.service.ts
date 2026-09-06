import axios from 'axios';

export class CatalogError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}
type MediaType = 'movie' | 'tv';
type Params = Record<string, string | number | undefined>;
type Availability = { ids: Set<number>; filtered: boolean };
const cache = new Map<string, { expires: number; value: any }>();
const pending = new Map<string, Promise<any>>();
let active = 0;
const queue: Array<() => void> = [];

/** One bounded queue for upstream requests; duplicate requests share a promise. */
async function cached(key: string, fetcher: () => Promise<any>, ttl = 600_000): Promise<any> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  if (pending.has(key)) return pending.get(key);
  const task = (async () => {
    if (active >= 3) await new Promise<void>(resolve => queue.push(resolve));
    else active++;
    try {
      const value = await fetcher();
      if (cache.size >= 250) cache.delete(cache.keys().next().value!);
      cache.set(key, { value, expires: Date.now() + ttl });
      return value;
    } finally {
      const next = queue.shift();
      if (next) next(); else active--;
    }
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}

async function request(url: string, params: Params = {}, timeout = 12_000) {
  for (let attempt = 0; ; attempt++) {
    try { return (await axios.get(url, { params, timeout })).data; }
    catch (error) {
      if (!axios.isAxiosError(error)) throw error;
      const status = error.response?.status;
      if (status === 429 && attempt < 2) {
        const retry = Number(error.response?.headers['retry-after']);
        await new Promise(resolve => setTimeout(resolve, Math.min(Number.isFinite(retry) && retry > 0 ? retry * 1000 : 750 * 2 ** attempt, 4000)));
        continue;
      }
      throw new CatalogError(status === 404 ? 'Título não encontrado.' : 'Não foi possível consultar o catálogo. Tente novamente.', status === 404 ? 404 : status === 429 ? 429 : 502);
    }
  }
}

export function providerBase() {
  return (process.env.WAREZCDN_BASE_URL || process.env.STREAMING_BASE_URL || 'https://warezcdn.sbs').replace(/\/+$/, '');
}

/**
 * The streaming host can reject serverless/data-centre IPs. Its availability
 * list is optional metadata: TMDB must keep the catalogue usable when it is
 * unavailable. A failed check is cached briefly to avoid retrying it for every
 * request in the same serverless instance.
 */
async function availability(type: MediaType): Promise<Availability> {
  return cached(`available:${type}`, async () => {
    try {
      // Fail well before a serverless invocation can be terminated by Vercel.
      const data = await request(`${providerBase()}/lista`, { category: type === 'movie' ? 'filme' : 'serie', type: 'tmdb', format: 'json' }, 4_000);
      if (!Array.isArray(data)) throw new CatalogError('A lista do provedor está temporariamente indisponível.');
      return { ids: data.map(Number).filter((id: number) => Number.isSafeInteger(id) && id > 0), filtered: true };
    } catch (error) {
      // Do not expose provider details or turn a catalogue request into a 502.
      console.warn(`[catalog] Availability list unavailable for ${type}; serving unfiltered TMDB results.`, error instanceof Error ? error.message : error);
      return { ids: [], filtered: false };
    }
  }, 60_000).then((value: { ids: number[]; filtered: boolean }) => ({ ids: new Set(value.ids), filtered: value.filtered }));
}

export async function availableIds(type: MediaType): Promise<Set<number>> {
  return (await availability(type)).ids;
}

async function metadata(path: string, params: Params = {}) {
  // Preserve the existing server-side key fallback; an owned key is preferred.
  const key = process.env.TMDB_API_KEY || await cached('metadata-key', async () => {
    const provider = require('freekeys');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const keys: any = await Promise.race([(provider.default || provider)(), new Promise((_, reject) => { timer = setTimeout(() => reject(new CatalogError('Configure TMDB_API_KEY no servidor.', 503)), 8000); })]);
      return keys?.tmdb_key;
    } finally { if (timer) clearTimeout(timer); }
  }, 3_600_000);
  if (!key) throw new CatalogError('Configure TMDB_API_KEY no servidor para carregar as informações do catálogo.', 503);
  return cached(`metadata:${path}:${JSON.stringify(params)}`, () => request(`https://api.themoviedb.org/3${path}`, { language: 'pt-BR', ...params, api_key: key }));
}

export function normalizeItem(item: any, type: MediaType) {
  return { ...item, media_type: type, title: item.title || item.name || 'Sem título', release_date: item.release_date || item.first_air_date || '' };
}

export function pageNumber(value: unknown) {
  if (value === undefined) return 1;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1 || page > 500) throw new CatalogError('A página deve estar entre 1 e 500.', 400);
  return page;
}

export async function catalogList(type: MediaType, path: string, params: Params) {
  const [data, available] = await Promise.all([metadata(path, params), availability(type)]);
  const results = available.filtered ? (data.results || []).filter((item: any) => available.ids.has(item.id)) : (data.results || []);
  return { ...data, total_pages: Math.min(data.total_pages || 0, 500), results: results.map((item: any) => normalizeItem(item, type)), availability_filtered: available.filtered };
}

/** Same route contract in Express and Vercel. Pagination remains TMDB pagination after filtering. */
export async function catalogRoute(type: MediaType, parts: string[], query: Params) {
  const [first, second, third] = parts;
  const page = pageNumber(query.page);
  const search = String(query.query || query.q || '').trim().slice(0, 200);
  if (/^\d+$/.test(first || '')) {
    const id = Number(first);
    if (!Number.isSafeInteger(id) || id < 1) throw new CatalogError('ID inválido.', 400);
    const available = await availability(type);
    if (available.filtered && !available.ids.has(id)) throw new CatalogError('Este título não está no catálogo disponível.', 404);
    const path = `/${type}/${id}`;
    if (!second && parts.length === 1) return normalizeItem(await metadata(path, { append_to_response: 'external_ids' }), type);
    if (parts.length === 2 && ['credits', 'videos'].includes(second)) return metadata(`${path}/${second}`);
    if (parts.length === 2 && ['similar', 'recommendations'].includes(second)) return catalogList(type, `${path}/${second}`, { page });
    if (type === 'tv' && second === 'season' && parts.length === 3 && /^\d+$/.test(third)) return metadata(`${path}/season/${Number(third)}`);
    throw new CatalogError('Recurso não encontrado.', 404);
  }
  if (parts.length !== 1) throw new CatalogError('Rota não encontrada.', 404);
  if (first === 'genres') return metadata(`/genre/${type}/list`);
  if (first === 'search-multi') {
    if (!search) throw new CatalogError('Informe um termo de busca.', 400);
    const [data, movies, series] = await Promise.all([metadata('/search/multi', { query: search, page }), availability('movie'), availability('tv')]);
    return {
      ...data,
      total_pages: Math.min(data.total_pages || 0, 500),
      results: data.results
        .filter((item: any) => item.media_type === 'movie' ? !movies.filtered || movies.ids.has(item.id) : item.media_type === 'tv' && (!series.filtered || series.ids.has(item.id)))
        .map((item: any) => normalizeItem(item, item.media_type)),
      availability_filtered: movies.filtered && series.filtered,
    };
  }
  if (first === 'search') {
    if (!search) throw new CatalogError('Informe um termo de busca.', 400);
    return catalogList(type, `/search/${type}`, { query: search, page });
  }
  if (first === 'genre' || first === 'discover') {
    const media = query.type === 'tv' ? 'tv' : type;
    const params: Params = { page };
    for (const key of ['sort_by', 'with_genres', 'primary_release_year', 'first_air_date_year', 'vote_average.gte', 'with_original_language']) {
      if (query[key] !== undefined) params[key] = query[key];
    }
    if (query.genreId) params.with_genres = query.genreId;
    if (query.sortBy) params.sort_by = query.sortBy;
    if (media === 'tv' && typeof params.sort_by === 'string') params.sort_by = params.sort_by.replace('primary_release_date', 'first_air_date').replace('release_date', 'first_air_date').replace('original_title', 'original_name');
    return catalogList(media, `/discover/${media}`, params);
  }
  const routes: Record<string, string> = { trending: `/trending/${type}/week`, popular: `/${type}/popular`, 'top-rated': `/${type}/top_rated`, latest: `/${type}/${type === 'movie' ? 'now_playing' : 'on_the_air'}`, 'now-playing': `/${type}/${type === 'movie' ? 'now_playing' : 'on_the_air'}`, upcoming: `/${type}/${type === 'movie' ? 'upcoming' : 'on_the_air'}` };
  if (!routes[first]) throw new CatalogError('Rota não encontrada.', 404);
  return catalogList(type, routes[first], { page });
}

export function playerUrl(type: MediaType, id: string, season?: string, episode?: string) {
  if (!(type === 'movie' ? /^(?:tt\d{7,}|[1-9]\d*)$/ : /^[1-9]\d*$/).test(id)) throw new CatalogError('ID inválido.', 400);
  if (season !== undefined && !/^\d+$/.test(season)) throw new CatalogError('Temporada inválida.', 400);
  if (episode !== undefined && (!season || !/^[1-9]\d*$/.test(episode))) throw new CatalogError('Episódio inválido.', 400);
  return `${providerBase()}/${type === 'movie' ? 'filme' : 'serie'}/${id}${type === 'tv' && season !== undefined ? `/${season}${episode !== undefined ? `/${episode}` : ''}` : ''}#color:a78bfa`;
}

export async function streamingRoute(parts: string[], query: Params) {
  const [first, id, season, episode] = parts;
  if (first === 'servers' && parts.length === 1) return [{ id: 'warezcdn', name: 'Player padrão' }];
  if (first === 'calendar' && parts.length === 1) return cached('calendar', () => request(`${providerBase()}/calendario.php`));
  if (first === 'list' && parts.length === 1) {
    if (!['filme', 'movie', 'serie', 'series'].includes(String(query.category))) throw new CatalogError('Selecione filmes ou séries.', 400);
    return [...await availableIds(['filme', 'movie'].includes(String(query.category)) ? 'movie' : 'tv')];
  }
  if ((first === 'movie' && parts.length === 2) || (first === 'series' && parts.length >= 2 && parts.length <= 4)) {
    const url = playerUrl(first === 'movie' ? 'movie' : 'tv', id, season, episode);
    return { streamUrl: url, directUrl: url, mode: 'iframe-direct', server: 'warezcdn' };
  }
  throw new CatalogError('Rota não encontrada.', 404);
}
