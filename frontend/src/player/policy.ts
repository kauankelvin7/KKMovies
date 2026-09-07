/** Only identifiers enter the watch route. Never accept an iframe URL from input. */
export const PLAYER_ORIGIN = 'https://warezcdn.sbs';
export const PLAYER_PERMISSIONS = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
export interface WatchTarget { id: number; type: 'movie' | 'tv'; season?: number; episode?: number }

function integer(value: string, minimum: number): number {
  if (!/^\d+$/.test(value)) throw new Error('Identificador inválido.');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > 2147483647) throw new Error('Identificador inválido.');
  return number;
}

export function parseWatchTarget(pathname: string, search: string): WatchTarget {
  const watchRoute = /^\/watch\/([1-9]\d*)\/?$/.exec(pathname);
  const watchDocument = pathname === '/watch.html';
  if (!watchRoute && !watchDocument) throw new Error('Endereço de reprodução inválido.');
  const params = new URLSearchParams(search);
  const allowed = watchDocument ? ['id', 'type', 'season', 'episode'] : ['type', 'season', 'episode'];
  for (const key of Array.from(params.keys())) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1) throw new Error('Parâmetro de reprodução inválido.');
  }
  const idValue = watchRoute ? watchRoute[1] : params.get('id');
  if (!idValue) throw new Error('Identificador inválido.');
  const type = params.get('type') || 'movie';
  if (type !== 'movie' && type !== 'tv') throw new Error('Tipo de conteúdo inválido.');
  const target: WatchTarget = { id: integer(idValue, 1), type };
  if (params.has('season')) target.season = integer(params.get('season')!, 0);
  if (params.has('episode')) target.episode = integer(params.get('episode')!, 1);
  if ((type === 'movie' && (target.season !== undefined || target.episode !== undefined)) || (target.episode !== undefined && target.season === undefined)) throw new Error('Temporada ou episódio inválido.');
  return target;
}

export function watchPath(target: WatchTarget): string {
  const params = new URLSearchParams({ type: target.type });
  if (target.season !== undefined) params.set('season', String(target.season));
  if (target.episode !== undefined) params.set('episode', String(target.episode));
  const path = `/watch/${target.id}`;
  parseWatchTarget(path, `?${params}`);
  return `${path}?${params}`;
}

export function watchDocumentPath(target: WatchTarget): string {
  const params = new URLSearchParams({ id: String(target.id), type: target.type });
  if (target.season !== undefined) params.set('season', String(target.season));
  if (target.episode !== undefined) params.set('episode', String(target.episode));
  const path = '/watch.html';
  parseWatchTarget(path, `?${params}`);
  return `${path}?${params}`;
}

export function embedUrl(target: WatchTarget): string {
  const valid = new URL(watchPath(target), 'https://local.invalid');
  const { id, type, season, episode } = parseWatchTarget(valid.pathname, valid.search);
  const suffix = type === 'tv' && season !== undefined ? `/${season}${episode !== undefined ? `/${episode}` : ''}` : '';
  return `${PLAYER_ORIGIN}/${type === 'tv' ? 'serie' : 'filme'}/${id}${suffix}#color:a78bfa`;
}

export function detailPath(target: WatchTarget): string {
  return `/${target.type === 'tv' ? 'series' : 'filme'}/${target.id}`;
}
