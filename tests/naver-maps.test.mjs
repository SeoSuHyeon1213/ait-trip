import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function setup() {
  const scripts = []; const timers = new Map(); const exports = {};
  const window = { dispatchEvent() {} };
  const source = readFileSync(new URL('../src/maps/naverMaps.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, window, URL, URLSearchParams, Event,
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    document: { createElement() { return { remove() { this.removed = true; } }; }, head: { appendChild(script) { scripts.push(script); } } },
  });
  return { ...exports, window, scripts, timers };
}
test('SDK uses ncpKeyId and shares a single ready callback between map mounts', async () => {
  const s = setup(); const first = s.loadNaverMaps('public-id'); const second = s.loadNaverMaps('public-id');
  assert.equal(first, second); assert.equal(s.scripts.length, 1);
  const url = new URL(s.scripts[0].src);
  assert.equal(url.origin, 'https://oapi.map.naver.com');
  assert.equal(url.searchParams.get('ncpKeyId'), 'public-id');
  assert.equal(url.searchParams.has('ncpClientId'), false);
  s.window.naver = { maps: { Map: class {} } }; s.window.moodTravelNaverReady();
  assert.equal(await first, s.window.naver.maps); assert.equal(s.timers.size, 0);
});
test('SDK network failure removes the failed script and permits retry', async () => {
  const s = setup(); const failed = s.loadNaverMaps('public-id');
  const rejected = assert.rejects(failed); s.scripts[0].onerror(); await rejected;
  assert.equal(s.scripts[0].removed, true); assert.equal(s.timers.size, 0);
  const retry = s.loadNaverMaps('public-id'); assert.equal(s.scripts.length, 2);
  s.window.naver = { maps: { Map: class {} } }; s.window.moodTravelNaverReady(); await retry;
});
test('SDK timeout rejects instead of leaving the screen loading indefinitely', async () => {
  const s = setup(); const promise = s.loadNaverMaps('public-id');
  const rejected = assert.rejects(promise); [...s.timers.values()][0](); await rejected;
  assert.equal(s.scripts[0].removed, true); assert.equal(s.window.moodTravelNaverReady, undefined);
});
test('late authentication failure invalidates the cached SDK for a fresh retry', async () => {
  const s = setup(); const promise = s.loadNaverMaps('old-id');
  s.window.naver = { maps: { Map: class {} } }; s.window.moodTravelNaverReady(); await promise;
  s.window.navermap_authFailure(); const retry = s.loadNaverMaps('new-id');
  assert.equal(s.scripts.length, 2); assert.equal(new URL(s.scripts[1].src).searchParams.get('ncpKeyId'), 'new-id');
  s.window.moodTravelNaverReady(); await retry;
});
