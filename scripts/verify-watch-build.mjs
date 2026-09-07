import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const vite = resolve(root, 'frontend/node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { cwd: resolve(root, 'frontend'), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
try {
  const deadline = Date.now() + 15000;
  while (!output.includes('http://127.0.0.1:4178')) {
    if (server.exitCode !== null || Date.now() > deadline) throw new Error(`Preview could not start: ${output}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  for (const route of ['/watch/42?type=movie', '/watch/42?type=tv&season=0&episode=1', '/watch/invalid', '/watch.html']) {
    const response = await fetch(`http://127.0.0.1:4178${route}`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('/assets/watch-'), `${route} did not receive watch entry`);
    assert.ok(!html.includes('/assets/main-'), `${route} received catalog entry`);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(response.headers.get('content-security-policy').includes('frame-src https://warezcdn.sbs'));
    assert.ok(response.headers.get('content-security-policy').split('; ').includes("manifest-src 'self'"));
    assert.ok(html.includes('name="mobile-web-app-capable" content="yes"'));
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
  }
  const manifest = await fetch('http://127.0.0.1:4178/manifest.json', { signal: AbortSignal.timeout(5000) });
  assert.equal(manifest.status, 200);
  assert.equal((await manifest.json()).display, 'standalone');
  const app = await fetch('http://127.0.0.1:4178/filmes', { signal: AbortSignal.timeout(5000) });
  assert.equal(app.headers.get('cache-control'), 'no-cache');
  assert.ok((await app.text()).includes('/assets/main-'));
  const sw = await readFile(resolve(root, 'frontend/dist/sw.js'), 'utf8');
  const releaseResponse = await fetch('http://127.0.0.1:4178/version.json');
  assert.equal(releaseResponse.status, 200);
  assert.equal(releaseResponse.headers.get('cache-control'), 'no-store');
  const release = await releaseResponse.json();
  assert.match(release.version, /^[a-f0-9-]{36}$/);
  assert.ok(!sw.includes('url:"version.json"'), 'Release discovery must bypass the precache');
  assert.ok(sw.includes(`sw-version-${release.version}.js`), 'Worker and release must belong to the same build');
  assert.ok(sw.includes('skipWaiting()') && sw.includes('clientsClaim()'));
  const versionScript = await readFile(resolve(root, `frontend/dist/sw-version-${release.version}.js`), 'utf8');
  assert.ok(versionScript.includes('GET_APP_VERSION') && versionScript.includes(release.version));
  assert.ok(!sw.includes('url:"watch.html"') && !sw.includes('url:"/watch.html"'), 'Watch HTML must not be precached');
  assert.ok(sw.includes('watch'), 'Watch routes must be excluded from the app fallback');
  console.log('Production watch entry, HTTP security headers, catalog fallback and service worker checks passed.');
} finally {
  if (server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
}
