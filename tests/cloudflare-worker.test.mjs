import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from '../server/worker.mjs';

const assets = { fetch: async () => new Response('<html>travel app</html>', { headers: { 'Content-Type': 'text/html' } }) };
test('public web assets and health are served without exposing runtime secrets', async () => {
  const worker = createWorker();
  const env = { ASSETS: assets, TOUR_API_SERVICE_KEY: 'private-fixture-key' };
  assert.match(await (await worker.fetch(new Request('https://travel.example/'), env)).text(), /travel app/);
  assert.deepEqual(await (await worker.fetch(new Request('https://travel.example/healthz'), env)).json(), { ok: true });
  const status = await worker.fetch(new Request('https://travel.example/api/status'), env);
  assert.deepEqual(await status.json(), { configured: false });
});
test('same-origin website and Toss are allowed; foreign origins cannot read API', async () => {
  const worker = createWorker(); const env = { ASSETS: assets };
  for (const origin of ['https://travel.example', 'https://aitmidtotrip.apps.tossmini.com', 'https://aitmidtotrip.private-apps.tossmini.com']) {
    const response = await worker.fetch(new Request('https://travel.example/api/status', { headers: { Origin: origin } }), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  }
  const blocked = await worker.fetch(new Request('https://travel.example/api/status', { headers: { Origin: 'https://foreign.example' } }), env);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get('Access-Control-Allow-Origin'), null);
  const options = await worker.fetch(new Request('https://travel.example/api/status', { method: 'OPTIONS', headers: { Origin: 'https://travel.example' } }), env);
  assert.equal(options.status, 204); assert.equal(await options.text(), '');
});
test('worker API routes never fall through to the SPA and reject writes', async () => {
  const worker = createWorker(); const env = { ASSETS: assets };
  assert.equal((await worker.fetch(new Request('https://travel.example/api'), env)).status, 404);
  assert.equal((await worker.fetch(new Request('https://travel.example/api/status', { method: 'POST' }), env)).status, 405);
});
test('TourAPI key stays on server and upstream errors are sanitized', async () => {
  let calls = 0;
  const worker = createWorker(async url => {
    assert.equal(url.searchParams.get('serviceKey'), 'private-fixture-key'); calls++;
    return new Response('<error>private-fixture-key</error>');
  });
  const env = { ASSETS: assets, TOUR_API_SERVICE_KEY: 'private-fixture-key', TOUR_API_ENDPOINT: 'https://tour.example/KorService2' };
  const status = await worker.fetch(new Request('https://travel.example/api/status'), env);
  assert.deepEqual(await status.json(), { configured: true });
  const response = await worker.fetch(new Request('https://travel.example/api/destinations'), env);
  assert.equal(response.status, 502);
  const body = await response.text();
  assert.equal(body.includes('private-fixture-key'), false); assert.equal(body.includes('tour.example'), false);
  assert.equal(calls, 3);
});
test('successful TourAPI response flows through the Worker and reuses the cache', async () => {
  let calls = 0;
  const worker = createWorker(async url => {
    calls++;
    const items = url.pathname.endsWith('ldongCode2') ? [{ code: '11', name: '서울특별시' }]
      : url.pathname.endsWith('lclsSystmCode2') ? [] : [{ contentid: '123', title: '여행지' }];
    return Response.json({ response: { header: { resultCode: '0000' }, body: { items: { item: items }, totalCount: items.length } } });
  });
  const env = { ASSETS: assets, TOUR_API_SERVICE_KEY: 'fixture', TOUR_API_ENDPOINT: 'https://tour.example/KorService2' };
  for (let i = 0; i < 2; i++) {
    const response = await worker.fetch(new Request('https://travel.example/api/destinations?mood=rest'), env);
    assert.equal(response.status, 200); assert.equal((await response.json()).items[0].contentid, '123');
  }
  assert.equal(calls, 3);
});

test('map configuration exposes only the browser identifier and keeps secrets private', async () => {
  const worker = createWorker();
  const env = { ASSETS: assets, NAVER_MAP_CLIENT_ID: ' browser-id ', TOUR_API_SERVICE_KEY: 'private-key', NAVER_MAP_CLIENT_SECRET: 'private-secret' };
  const response = await worker.fetch(new Request('https://travel.example/api/map-config'), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { clientId: 'browser-id' });
  const empty = await worker.fetch(new Request('https://travel.example/api/map-config'), { ASSETS: assets });
  assert.deepEqual(await empty.json(), { clientId: '' });
  const foreign = await worker.fetch(new Request('https://travel.example/api/map-config', { headers: { Origin: 'https://foreign.example' } }), env);
  assert.equal(foreign.status, 403);
});

test('Workers share only successful recommendation snapshots and fall back for the same query', async t => {
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  const entries = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: { default: {
      async match(key) { return entries.get(key)?.clone(); },
      async put(key, response) { entries.set(key, response.clone()); },
    } },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'caches', previous);
    else delete globalThis.caches;
  });

  const tasks = [];
  const ctx = { waitUntil(task) { tasks.push(task); } };
  const env = {
    ASSETS: assets, TOUR_API_SERVICE_KEY: 'fixture',
    TOUR_API_ENDPOINT: 'https://tour.example/KorService2',
  };
  const request = new Request('https://travel.example/api/destinations?mood=rest');
  const calls = [];
  let failureCode;
  const fetcher = async url => {
    const operation = url.pathname.split('/').at(-1);
    calls.push(operation);
    if (operation === 'areaBasedList2' && failureCode) {
      return Response.json({ response: { header: { resultCode: failureCode } } });
    }
    const items = operation === 'areaBasedList2' ? [{ contentid: '123' }] : [];
    return Response.json({ response: {
      header: { resultCode: '0000' },
      body: { items: { item: items }, totalCount: items.length },
    } });
  };

  const success = await createWorker(fetcher).fetch(request, env, ctx);
  assert.equal(success.status, 200);
  const body = await success.json();
  await Promise.all(tasks);
  assert.equal(entries.size, 3);
  assert.equal(calls.length, 3);

  failureCode = '05';
  const reader = createWorker(fetcher);
  const fresh = await reader.fetch(request, env, ctx);
  assert.deepEqual(await fresh.json(), body);
  assert.equal(calls.length, 3);

  now += 301_000;
  const stale = await reader.fetch(request, env, ctx);
  assert.equal(stale.status, 200);
  assert.equal(stale.headers.get('X-Tour-Cache'), 'stale');
  assert.deepEqual(await stale.json(), body);
  assert.deepEqual(calls.slice(3), ['areaBasedList2']);

  const otherQuery = await reader.fetch(new Request(request.url + '&pageNo=2'), env, ctx);
  assert.equal(otherQuery.status, 502);
  assert.equal(tasks.length, 3);

  failureCode = '30';
  const invalidKey = await reader.fetch(request, env, ctx);
  assert.equal(invalidKey.status, 502);
  assert.equal(invalidKey.headers.get('X-Tour-Cache'), null);
});
