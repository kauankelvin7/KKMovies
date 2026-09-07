const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../node_modules/typescript');

function setup({ remote = 'new', workerVersion = 'new', saved = new Map(), online = true } = {}) {
  let now = 100000, reloads = 0, requests = 0, editing = false, modal = false;
  const timers = new Map(), events = new Map(); let timerId = 0;
  const local = { kkm_watchlist: 'keep', kkm_history: 'keep', kk_catalog_v2_popular: 'old' };
  const eventTarget = { addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name) };
  const controller = { postMessage(_, ports) { ports[0].postMessage({ version: workerVersion }); } };
  const registration = { active: controller, waiting: null, update: async () => {} };
  const exports = {};
  const document = { ...eventTarget, visibilityState: 'visible', activeElement: { matches: () => editing }, querySelector: () => modal ? {} : null, querySelectorAll: () => [] };
  const context = {
    exports, document, window: eventTarget,
    navigator: { onLine: online, serviceWorker: { ...eventTarget, controller, register: async () => registration } },
    location: { reload: () => reloads++ },
    Date: { now: () => now }, AbortSignal: { timeout: () => undefined },
    fetch: async () => { requests++; return { ok: true, json: async () => ({ version: remote }) }; },
    sessionStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) },
    localStorage: Object.assign(local, { removeItem: key => delete local[key] }),
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
    setInterval: () => ++timerId, clearInterval() {},
    MessageChannel: class {
      constructor() {
        this.port1 = { close() {}, onmessage: null };
        this.port2 = { close() {}, postMessage: data => this.port1.onmessage?.({ data }) };
      }
    },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../../frontend/src/services/appUpdates.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
  const stop = exports.startAppUpdates('old');
  const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
  return {
    stop, saved, local, flush, exports,
    get reloads() { return reloads; }, get requests() { return requests; },
    setEditing(value) { editing = value; }, setModal(value) { modal = value; },
    async activate(version) { workerVersion = version; events.get('controllerchange')?.(); await flush(); },
    async tick() { now += 3000; const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); await flush(); },
  };
}

test('new release reloads once after activation, preserving personal storage', async () => {
  const app = setup(); await app.flush(); await app.tick();
  assert.equal(app.reloads, 1);
  assert.equal(app.local.kkm_watchlist, 'keep'); assert.equal(app.local.kkm_history, 'keep');
  assert.equal(app.local.kk_catalog_v2_popular, undefined);
  await app.tick(); assert.equal(app.reloads, 1); app.stop();
  const stale = setup({ saved: app.saved }); await stale.flush(); await stale.tick();
  assert.equal(stale.reloads, 0, 'Stale HTML must not cause a reload loop'); stale.stop();
});

test('old controlling worker cannot reload into stale precache', async () => {
  const app = setup({ workerVersion: 'old' }); await app.flush(); await app.tick();
  assert.equal(app.reloads, 0);
  await app.activate('new'); await app.tick(); assert.equal(app.reloads, 1); app.stop();
});

test('editing and modal interaction defer automatic reload', async () => {
  const app = setup(); app.setEditing(true); await app.flush(); await app.tick(); assert.equal(app.reloads, 0);
  app.setEditing(false); app.setModal(true); await app.tick(); assert.equal(app.reloads, 0);
  app.setModal(false); await app.tick(); assert.equal(app.reloads, 1); app.stop();
});

test('same release, invalid metadata and offline startup do not refresh', async () => {
  for (const remote of ['old', '<html>', null]) {
    const app = setup({ remote }); await app.flush(); await app.tick(); assert.equal(app.reloads, 0); app.stop();
  }
  const app = setup({ online: false }); await app.flush(); assert.equal(app.requests, 0); app.stop();
});

test('disposing update manager cancels a queued reload', async () => {
  const app = setup(); await app.flush(); app.stop(); await app.tick(); assert.equal(app.reloads, 0);
});
