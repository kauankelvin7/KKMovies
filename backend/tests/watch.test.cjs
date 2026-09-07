const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../node_modules/typescript');
const root = path.resolve(__dirname, '../..');
function load(relative) {
  const exports = {};
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, URL, URLSearchParams });
  return exports;
}
const policy = load('frontend/src/player/policy.ts');


test('watch routes round-trip movie, series and specials without accepting URLs', () => {
  for (const target of [{ id: 42, type: 'movie' }, { id: 42, type: 'tv' }, { id: 42, type: 'tv', season: 0, episode: 3 }]) {
    const route = new URL(policy.watchPath(target), 'https://kkmovies.test');
    assert.equal(JSON.stringify(policy.parseWatchTarget(route.pathname, route.search)), JSON.stringify(target));
    assert.equal(new URL(policy.embedUrl(target)).origin, 'https://warezcdn.sbs');
  }
  assert.equal(policy.embedUrl({ id: 42, type: 'tv', season: 2, episode: 4 }), 'https://warezcdn.sbs/serie/42/2/4#color:a78bfa');
  assert.equal(policy.detailPath({ id: 42, type: 'tv' }), '/series/42');
});

test('watch rejects malformed IDs, invalid episodes, duplicate parameters and open redirects', () => {
  for (const route of ['/watch/0', '/watch/-1', '/watch/1e3', '/watch/9007199254740992', '/watch/42/extra', '/watch/%34%32', '/watch/42?type=other', '/watch/42?type=movie&season=1', '/watch/42?type=tv&episode=2', '/watch/42?type=tv&season=-1', '/watch/42?type=tv&season=1&episode=0', '/watch/42?type=tv&type=movie', '/watch/42?src=https://evil.test', '/watch/42?returnTo=//evil.test']) {
    const url = new URL(route, 'https://kkmovies.test');
    assert.throws(() => policy.parseWatchTarget(url.pathname, url.search), undefined, route);
  }
  assert.throws(() => policy.embedUrl({ id: NaN, type: 'movie' }));
});

test('watch permissions do not grant powerful device access', () => {
  assert.ok(!policy.PLAYER_PERMISSIONS.includes('clipboard'));
  assert.ok(!policy.PLAYER_PERMISSIONS.includes('camera'));
});

test('dedicated document has the same security headers in preview and production', () => {
  const { watchHeaders, isolatedWatchRoute } = load('frontend/watch-security.ts');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const deployed = config.headers.find(rule => rule.source === '/watch/:path*');
  assert.ok(watchHeaders['Content-Security-Policy'].split('; ').includes("manifest-src 'self'"));
  const direct = config.headers.find(rule => rule.source === '/watch.html');
  assert.deepEqual(direct.headers, deployed.headers);
  assert.deepEqual(Object.fromEntries(deployed.headers.map(header => [header.key, header.value])), JSON.parse(JSON.stringify(watchHeaders)));
  const watchIndex = config.rewrites.findIndex(rule => rule.source === '/watch/:path*');
  assert.ok(watchIndex >= 0 && watchIndex < config.rewrites.length - 1);
  assert.equal(config.rewrites[watchIndex].destination, '/watch.html');
  let middleware;
  isolatedWatchRoute().configurePreviewServer({ middlewares: { use(value) { middleware = value; } } });
  const request = { url: '/watch/42?type=tv&season=2&episode=3' };
  const headers = {};
  let continued = false;
  middleware(request, { setHeader(key, value) { headers[key] = value; } }, () => { continued = true; });
  assert.equal(request.url, '/watch.html');
  assert.ok(continued);
  assert.equal(headers['Content-Security-Policy'], watchHeaders['Content-Security-Policy']);
  assert.ok(!headers['Content-Security-Policy'].includes('unsafe-inline'));
  const other = { url: '/filmes' };
  middleware(other, { setHeader() { assert.fail('Headers applied to catalog route'); } }, () => {});
  assert.equal(other.url, '/filmes');
});
