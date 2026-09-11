import test from 'node:test';
import assert from 'node:assert/strict';
import { atLeftEdge, detectTV, remoteKey, nextIndex } from '../src/tv/navigation.ts';

test('identifies TV families without treating desktop, mobile Android or iPad as TV', () => {
  for (const ua of ['SMART-TV; Tizen 7.0', 'Web0S; Linux/SmartTV', 'webOS', 'HbbTV/1.5.1', 'Android TV', 'BRAVIA 4K', 'AFTMM', 'VIDAA', 'GoogleTV', 'Android; TV; rv:100']) assert.equal(detectTV(ua), true, ua);
  for (const ua of ['Windows NT 10.0 Chrome/130', 'Macintosh Intel Mac OS X', 'Android 14; Pixel 8', 'iPad; CPU OS 17']) assert.equal(detectTV(ua), false, ua);
});
test('normalizes Samsung, LG and standard remote keys', () => {
  for (const code of [10009, 461, 27]) assert.equal(remoteKey('Unidentified', code), 'Escape');
  assert.equal(remoteKey('BrowserBack', 0), 'Escape');
  assert.equal(remoteKey('Unidentified', 13), 'Enter');
  assert.equal(remoteKey('Unidentified', 37), 'ArrowLeft');
  assert.equal(remoteKey('ArrowDown', 0), 'ArrowDown');
});
const box = (x, y, w = 100, h = 150) => ({ left: x, right: x + w, top: y, bottom: y + h });
test('opens the menu only at the left edge of a row, including scrolled shelves', () => {
  assert.equal(atLeftEdge(box(120, 200), [box(0, 0), box(240, 200)]), true);
  assert.equal(atLeftEdge(box(120, 200), [box(0, 200)]), false);
  assert.equal(atLeftEdge(box(0, 200), [box(-120, 200)]), false);
});
test('moves along shelves before jumping to a closer diagonal control', () => {
  assert.equal(nextIndex(box(300, 200), [box(420, 200), box(405, 45, 30, 30)], 'ArrowRight'), 0);
  assert.equal(nextIndex(box(300, 200), [box(180, 200), box(420, 200)], 'ArrowLeft'), 0);
});
test('moves vertically in grids and reaches content beyond viewport', () => {
  assert.equal(nextIndex(box(300, 200), [box(180, 400), box(300, 400), box(420, 400)], 'ArrowDown'), 1);
  assert.equal(nextIndex(box(300, 400), [box(180, 200), box(300, 200)], 'ArrowUp'), 1);
  assert.equal(nextIndex(box(1800, 200), [box(2020, 200)], 'ArrowRight'), 0);
});
test('stays at boundaries and handles empty scopes', () => {
  assert.equal(nextIndex(box(300, 200), [box(180, 200)], 'ArrowRight'), -1);
  assert.equal(nextIndex(box(300, 200), [], 'ArrowDown'), -1);
});
