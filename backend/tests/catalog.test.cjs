const { test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const catalog = require('../dist/services/catalog.service');

test('player URLs validate identifiers and use the single documented provider', () => {
  assert.equal(catalog.playerUrl('movie', 'tt0068646'), 'https://warezcdn.sbs/filme/tt0068646#color:a78bfa');
  assert.equal(catalog.playerUrl('tv', '1396', '0', '1'), 'https://warezcdn.sbs/serie/1396/0/1#color:a78bfa');
  assert.equal(catalog.playerUrl('tv', '1396'), 'https://warezcdn.sbs/serie/1396#color:a78bfa');
  for (const id of ['../test', '0', '123#evil', 'https://other.example']) assert.throws(() => catalog.playerUrl('movie', id), /inválido/);
  assert.throws(() => catalog.playerUrl('tv', '1396', '1', '0'), /inválido/);
});

test('pagination rejects malformed and unbounded pages', () => {
  assert.equal(catalog.pageNumber(undefined), 1);
  assert.equal(catalog.pageNumber('500'), 500);
  for (const input of ['2x', -1, 0, 501, 1.5, 'NaN']) assert.throws(() => catalog.pageNumber(input), /página/);
});

test('upstream availability, request deduplication, details, search and errors', async () => {
  const original = axios.get;
  process.env.TMDB_API_KEY = 'test-only';
  let metadataCalls = 0;
  let failureCalls = 0;
  axios.get = async (url, options) => {
    await new Promise(resolve => setTimeout(resolve, 5));
    if (url.endsWith('/lista')) return { data: options.params.category === 'filme' ? ['101', '102'] : ['201'] };
    if (url.endsWith('/movie/101/videos')) return { data: { results: [{ key: 'trailer' }] } };
    if (url.endsWith('/tv/201/season/0')) return { data: { episodes: [{ episode_number: 1 }] } };
    if (url.endsWith('/movie/101')) return { data: { id: 101, title: 'Filme de teste' } };
    if (url.endsWith('/search/multi')) return { data: { page: 1, total_pages: 1, results: [{ id: 101, media_type: 'movie' }, { id: 201, media_type: 'tv', name: 'Série' }, { id: 101, media_type: 'person' }, { id: 999, media_type: 'movie' }] } };
    if (url.endsWith('/movie/upcoming')) { failureCalls++; throw { isAxiosError: true, response: { status: 503 } }; }
    metadataCalls++;
    return { data: { page: 1, total_pages: 1000, results: [{ id: 101, title: 'Disponível' }, { id: 999, title: 'Fora do provedor' }] } };
  };
  try {
    const [a, b] = await Promise.all([catalog.catalogRoute('movie', ['popular'], {}), catalog.catalogRoute('movie', ['popular'], {})]);
    assert.equal(metadataCalls, 1);
    assert.deepEqual(a, b);
    assert.deepEqual(a.results.map(item => item.id), [101]);
    assert.equal(a.total_pages, 500);
    assert.equal((await catalog.catalogRoute('movie', ['101'], {})).title, 'Filme de teste');
    assert.equal((await catalog.catalogRoute('movie', ['101', 'videos'], {})).results.length, 1);
    assert.equal((await catalog.catalogRoute('tv', ['201', 'season', '0'], {})).episodes.length, 1);
    assert.equal((await catalog.catalogRoute('movie', ['search-multi'], { query: 'teste' })).results.length, 2);
    await assert.rejects(catalog.catalogRoute('movie', ['999'], {}), error => error.status === 404);
    await assert.rejects(catalog.catalogRoute('movie', ['search'], {}), error => error.status === 400);
    await assert.rejects(catalog.catalogRoute('movie', ['101', 'unknown'], {}), error => error.status === 404);
    await assert.rejects(catalog.streamingRoute(['list'], { category: 'canais' }), error => error.status === 400);
    for (let n = 0; n < 2; n++) await assert.rejects(catalog.catalogRoute('movie', ['upcoming'], {}), error => error.status === 502);
    assert.equal(failureCalls, 2, 'upstream failures must not be cached');
  } finally { axios.get = original; delete process.env.TMDB_API_KEY; }
});
