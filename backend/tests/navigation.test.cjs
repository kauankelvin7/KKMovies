const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../node_modules/typescript');

function load(file, context = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/src', file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, URLSearchParams, ...context });
  return exports;
}

test('shared genre URLs and back navigation derive fresh catalog filters', () => {
  const { readCatalogFilters: read } = load('utils/catalogFilters.ts');
  const first = new URLSearchParams('type=tv&genre=10765&rating=8&sort=vote_average.desc');
  assert.equal(read(first).type, 'tv');
  assert.equal(read(first).genre, '10765');
  assert.equal(read(first).sort, 'vote_average.desc');
  const second = new URLSearchParams('type=movie&genre=35');
  assert.equal(read(second).genre, '35');
  assert.equal(read(second).rating, '');
  assert.equal(read(first).genre, '10765');
});

test('malformed URL filters fall back to valid controls and API inputs', () => {
  const { readCatalogFilters: read } = load('utils/catalogFilters.ts');
  const filters = read(new URLSearchParams('type=other&genre=-1&year=Infinity&rating=99&lang=invalid&sort=unknown'));
  assert.equal(filters.type, 'movie');
  for (const key of ['genre', 'year', 'rating', 'language']) assert.equal(filters[key], '');
  assert.equal(filters.sort, 'popularity.desc');
});

test('shortcuts respect browser commands, text entry and modal focus', () => {
  let handler, cleanup, modal = false;
  const navigations = [];
  const document = {
    querySelector: () => modal ? {} : null,
    addEventListener: (_, value) => { handler = value; },
    removeEventListener: (_, value) => { assert.equal(value, handler); },
  };
  const { useKeyboardShortcuts } = load('hooks/useKeyboardShortcuts.ts', {
    document,
    require: name => name === 'react' ? { useEffect: fn => { cleanup = fn(); } }
      : name === 'react-router-dom' ? { useNavigate: () => (...args) => navigations.push(args) }
      : { usePlayerStore: selector => selector({ closePlayer() {}, isOpen: false }) },
  });
  useKeyboardShortcuts();
  const event = extra => ({ key: 'f', target: { tagName: 'DIV' }, preventDefault() {}, ...extra });
  handler(event({ ctrlKey: true })); handler(event({ metaKey: true })); handler(event({ altKey: true }));
  handler(event({ isComposing: true })); handler(event({ target: { tagName: 'INPUT' } }));
  modal = true; handler(event({})); modal = false;
  assert.equal(navigations.length, 0);
  handler(event({})); assert.equal(navigations[0][0], '/filmes');
  handler(event({ key: '/' })); assert.equal(navigations[1][0], '/buscar');
  assert.equal(navigations[1][1].state.focusSearch, true);
  cleanup();
});
