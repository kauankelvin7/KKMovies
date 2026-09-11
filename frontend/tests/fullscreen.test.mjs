import test from 'node:test';
import assert from 'node:assert/strict';
import { enterFullscreen, leaveFullscreen, fullscreenElement } from '../src/player/fullscreen.ts';

test('requests native fullscreen on the player container with correct receiver', async () => {
  let calls = 0;
  const container = { async requestFullscreen() { assert.equal(this, container); calls++; } };
  assert.equal(await enterFullscreen(container), true);
  assert.equal(calls, 1);
});
test('supports WebKit TVs and falls back when unavailable or rejected', async () => {
  let calls = 0;
  assert.equal(await enterFullscreen({ webkitRequestFullscreen() { calls++; } }), true);
  assert.equal(calls, 1);
  assert.equal(await enterFullscreen({}), false);
  assert.equal(await enterFullscreen({ requestFullscreen() { throw new Error('denied'); } }), false);
  assert.equal(await enterFullscreen({ async requestFullscreen() { throw new Error('denied'); } }), false);
});
test('exits the active standard or WebKit fullscreen session', async () => {
  let calls = 0;
  const element = {};
  const standard = { fullscreenElement: element, async exitFullscreen() { calls++; } };
  assert.equal(fullscreenElement(standard), element);
  await leaveFullscreen(standard);
  await leaveFullscreen({ webkitFullscreenElement: element, webkitExitFullscreen() { calls++; } });
  await leaveFullscreen({ exitFullscreen() { throw new Error('no active session'); } });
  assert.equal(calls, 2);
});
