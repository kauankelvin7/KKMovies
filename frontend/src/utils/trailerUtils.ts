/* KauanFlix — Trailer Utilities
   Helper functions for YouTube trailer embedding and search fallback. */

import type { Video } from '../types/movie';

/**
 * Build optimized YouTube embed URL with autoplay, no related videos, etc.
 */
export function buildEmbedUrl(videoKey: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
    hl: 'pt',
    cc_lang_pref: 'pt',
    iv_load_policy: '3', // hide annotations
    fs: '1',             // fullscreen button
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${videoKey}?${params.toString()}`;
}

/**
 * Build YouTube search URL as fallback when no trailer available.
 */
export function buildSearchUrl(title: string, year?: string): string {
  const q = `${title} ${year || ''} trailer oficial legendado`.trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

/**
 * Pick the best trailer from a list of TMDB videos.
 * Priority: Official PT-BR Trailer > Official Trailer > Any Trailer > Teaser > First YouTube
 */
export function pickBestTrailer(videos: Video[]): Video | null {
  const yt = videos.filter((v) => v.site === 'YouTube');
  if (yt.length === 0) return null;

  // 1) Official PT-BR trailer
  const brTrailer = yt.find(
    (v) => v.type === 'Trailer' && v.official && /portugu|brazil|brasil|pt-br|dublado/i.test(v.name)
  );
  if (brTrailer) return brTrailer;

  // 2) Official trailer (any language)
  const officialTrailer = yt.find((v) => v.type === 'Trailer' && v.official);
  if (officialTrailer) return officialTrailer;

  // 3) Any trailer
  const anyTrailer = yt.find((v) => v.type === 'Trailer');
  if (anyTrailer) return anyTrailer;

  // 4) Teaser
  const teaser = yt.find((v) => v.type === 'Teaser');
  if (teaser) return teaser;

  // 5) Fallback: first YouTube video
  return yt[0];
}
