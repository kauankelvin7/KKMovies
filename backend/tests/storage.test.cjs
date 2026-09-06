const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('../../node_modules/typescript');

function storage() {
  const values = new Map();
  const exports = {};
  const context = { exports, Event: class {}, window: { dispatchEvent() {} }, localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  const source = fs.readFileSync(require('node:path').join(__dirname, '../../frontend/src/services/storageService.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return { ...exports, values };
}

test('watchlist keeps movie and series with the same ID separate', () => {
  const { watchlistService: list } = storage();
  const item = { id: 42, title: 'Teste', posterPath: null, backdropPath: null };
  list.add({ ...item, type: 'movie' });
  list.add({ ...item, type: 'tv' });
  assert.equal(list.getAll().length, 2);
  assert.equal(list.isInList(42, 'tv'), true);
  list.toggle({ ...item, type: 'tv' });
  assert.equal(list.isInList(42, 'tv'), false);
  assert.equal(list.isInList(42, 'movie'), true);
});

test('legacy watchlist is preserved and invalid saved JSON does not crash', () => {
  const { watchlistService: list, values } = storage();
  values.set('kkm_watchlist', '{invalid');
  values.set('kauanflix_my_list', JSON.stringify([{ movieId: 27, title: 'Legado', addedAt: 1 }]));
  assert.equal(list.getAll()[0].id, 27);
  assert.equal(list.getAll()[0].title, 'Legado');
  list.remove(27);
  assert.equal(list.getAll().length, 0);
});

test('status changes persist for the selected media type and history removal is isolated', () => {
  const { watchlistService: list, historyService: history } = storage();
  const item = { id: 42, title: 'Teste', posterPath: null, backdropPath: null };
  list.add({ ...item, type: 'movie' });
  list.add({ ...item, type: 'tv' });
  list.setStatus(42, 'tv', 'watched');
  assert.equal(list.getAll().find(item => item.type === 'tv').status, 'watched');
  assert.equal(list.getAll().find(item => item.type === 'movie').status, undefined);
  list.setStatus(42, 'tv', 'invalid');
  assert.equal(list.getAll().find(item => item.type === 'tv').status, 'watched');
  history.add({ ...item, type: 'movie' });
  history.add({ ...item, type: 'tv' });
  history.remove(42, 'tv');
  assert.equal(history.getAll().length, 1);
  assert.equal(history.getAll()[0].type, 'movie');
});
