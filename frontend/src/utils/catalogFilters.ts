export const catalogSorts = ['popularity.desc', 'vote_average.desc', 'primary_release_date.desc', 'original_title.asc'] as const;
export type CatalogSort = typeof catalogSorts[number];

/** URL is the source of truth, including back/forward and shared collection links. */
export function readCatalogFilters(params: URLSearchParams) {
  const genre = params.get('genre') || '';
  const year = params.get('year') || '';
  const rating = params.get('rating') || '';
  const language = params.get('lang') || '';
  const sort = params.get('sort') || '';
  return {
    type: params.get('type') === 'tv' ? 'tv' as const : 'movie' as const,
    genre: /^[1-9]\d{0,5}$/.test(genre) ? genre : '',
    year: /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= new Date().getFullYear() + 5 ? year : '',
    rating: ['6', '7', '8', '9'].includes(rating) ? rating : '',
    language: ['pt', 'en', 'es', 'fr', 'ja', 'ko'].includes(language) ? language : '',
    sort: catalogSorts.includes(sort as CatalogSort) ? sort as CatalogSort : 'popularity.desc' as CatalogSort,
  };
}
