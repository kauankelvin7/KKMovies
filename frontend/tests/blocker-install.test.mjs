import test from 'node:test';
import assert from 'node:assert/strict';
import { getBlockerInstall } from '../src/utils/blockerInstall.ts';

test('offers original uBlock for Firefox desktop and Android', () => {
  for (const ua of ['Windows NT 10.0; Firefox/145.0', 'Android 15; Firefox/145.0']) {
    assert.equal(new URL(getBlockerInstall(ua).url).hostname, 'addons.mozilla.org');
  }
});
test('offers official Lite listings and distinguishes Edge from Chrome', () => {
  assert.equal(new URL(getBlockerInstall('Windows; Chrome/145 Safari/537').url).hostname, 'chromewebstore.google.com');
  assert.equal(new URL(getBlockerInstall('Windows; Chrome/145 Safari/537 Edg/145').url).hostname, 'microsoftedge.microsoft.com');
  assert.equal(new URL(getBlockerInstall('Macintosh; Version/26.0 Safari/605.1').url).hostname, 'apps.apple.com');
});
test('does not promise desktop installation for TV or unsupported mobile browsers', () => {
  for (const ua of ['SMART-TV; Tizen; Chrome/120', 'Android 15; Chrome/145', 'iPhone; FxiOS/145', 'iPad; Version/26 Safari/605', 'Windows Chrome/145 OPR/100', 'Unknown']) {
    assert.equal(new URL(getBlockerInstall(ua).url).hostname, 'github.com', ua);
  }
});
