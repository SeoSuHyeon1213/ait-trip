import test from 'node:test';
import assert from 'node:assert/strict';
import { createTourClient, createApiHandler, parseEnvelope } from '../server/tour-api.mjs';
const config = { TOUR_API_ENDPOINT: 'https://example.test/KorService2', TOUR_API_SERVICE_KEY: 'fake+a/b=', TOUR_API_MOBILE_APP: 'test' };
function envelope(items, totalCount = items.length) { return { response: { header: { resultCode: '0000' }, body: { items: { item: items }, totalCount, pageNo: 1, numOfRows: 20 } } }; }
test('empty settings do not call upstream', async () => {
  let called = false;
  const client = createTourClient({}, async () => { called = true; });
  assert.equal(client.configured, false);
  await assert.rejects(client.call('areaBasedList2'));
  assert.equal(called, false);
});
test('general key encoded once, query casing and cache preserved', async () => {
  let calls = 0;
  const client = createTourClient(config, async url => {
    calls++;
    assert.equal(url.searchParams.get('serviceKey'), config.TOUR_API_SERVICE_KEY);
    assert.equal(url.searchParams.get('contentId'), '123');
    assert.equal(url.searchParams.get('_type'), 'json');
    return new Response(JSON.stringify(envelope([{ contentid: '123' }])));
  });
  await client.call('detailCommon2', { contentId: '123' });
  await client.call('detailCommon2', { contentId: '123' });
  assert.equal(calls, 1);
});
test('XML, API failure, invalid JSON and HTTP failure produce safe errors', async () => {
  for (const response of [new Response('<OpenAPI_ServiceResponse>secret</OpenAPI_ServiceResponse>'), new Response(JSON.stringify({ response: { header: { resultCode: '30' } } })), new Response('invalid-json'), new Response('secret', { status: 403 })]) {
    const client = createTourClient(config, async () => response);
    await assert.rejects(client.call('areaBasedList2'), error => !error.message.includes('secret') && !error.message.includes(config.TOUR_API_SERVICE_KEY));
  }
});
test('empty and single-item envelopes normalize', () => {
  assert.deepEqual(parseEnvelope(envelope([])).items, []);
  const value = envelope([]); value.response.body.items.item = { contentid: '1' };
  assert.equal(parseEnvelope(value).items.length, 1);
});
async function invoke(handler, url) {
  let text; const res = { setHeader() {}, end(value) { text = value; } };
  await handler({ url, method: 'GET' }, res);
  return { status: res.statusCode, value: JSON.parse(text) };
}
test('blank status exposes configuration presence only', async () => {
  const result = await invoke(createApiHandler({}), '/api/status');
  assert.deepEqual(result.value, { configured: false });
});
test('regional aliases, v4.4 code and pagination reach correct operation', async () => {
  const calls = [];
  const handler = createApiHandler(config, async url => {
    calls.push(url);
    if (url.pathname.endsWith('/ldongCode2')) return new Response(JSON.stringify(envelope([{ code: '43', name: '충청북도' }])));
    if (url.pathname.endsWith('/lclsSystmCode2')) return new Response(JSON.stringify(envelope([])));
    assert.equal(url.searchParams.get('lDongRegnCd'), '43');
    assert.equal(url.searchParams.get('pageNo'), '2');
    assert.equal(url.searchParams.has('areaCode'), false);
    return new Response(JSON.stringify(envelope([{ contentid: '1', title: 'test' }], 100)));
  });
  const result = await invoke(handler, '/api/destinations?region=' + encodeURIComponent('충북') + '&pageNo=2&pageSize=20');
  assert.equal(result.status, 200); assert.equal(result.value.hasMore, true);
  assert.equal(calls.length, 3);
});

test('each mood applies a distinct classification, preserving region and page', async () => {
  const filters = [];
  for (const mood of ['rest', 'refresh', 'explore', 'together']) {
    let captured;
    const handler = createApiHandler(config, async url => {
      if (url.pathname.endsWith('/ldongCode2')) return new Response(JSON.stringify(envelope([{ code: '11', name: '서울특별시' }])));
      if (url.pathname.endsWith('/lclsSystmCode2')) return new Response(JSON.stringify(envelope([])));
      captured = url.searchParams;
      return new Response(JSON.stringify(envelope([{ contentid: captured.get('lclsSystm2') }], 100)));
    });
    const result = await invoke(handler, '/api/destinations?mood=' + mood + '&region=' + encodeURIComponent('서울') + '&pageNo=2&pageSize=20');
    assert.equal(result.status, 200);
    assert.equal(captured.get('lDongRegnCd'), '11');
    assert.equal(captured.get('pageNo'), '2');
    assert.equal(captured.get('numOfRows'), '20');
    assert.ok(captured.get('lclsSystm1'));
    filters.push(captured.get('lclsSystm2'));
    assert.equal(result.value.items[0].contentid, captured.get('lclsSystm2'));
  }
  assert.deepEqual(filters, ['NA04', 'NA02', 'VE07', 'VE02']);
});
test('empty theme results do not fall back to unfiltered places', async () => {
  let areaCalls=0;
  const handler=createApiHandler(config, async url => {
    if (url.pathname.endsWith('/areaBasedList2')) { areaCalls++; assert.equal(url.searchParams.get('lclsSystm2'), 'VE02'); }
    return new Response(JSON.stringify(envelope([])));
  });
  const result=await invoke(handler,'/api/destinations?mood=together');
  assert.equal(result.status,200); assert.deepEqual(result.value.items,[]);
  assert.equal(result.value.hasMore,false); assert.equal(areaCalls,1);
});

test('unfiltered recommendations start all three upstream calls before any completes', { timeout: 1000 }, async () => {
  const calls = [];
  const releases = [];
  let notifyStarted;
  const allStarted = new Promise(resolve => { notifyStarted = resolve; });
  const handler = createApiHandler(config, url => {
    calls.push(url.pathname.split('/').at(-1));
    const response = new Promise(resolve => releases.push(resolve));
    if (calls.length === 3) notifyStarted();
    return response;
  });

  const response = invoke(handler, '/api/destinations');
  await allStarted;
  assert.deepEqual(new Set(calls), new Set(['areaBasedList2', 'ldongCode2', 'lclsSystmCode2']));
  for (const release of releases) release(Response.json(envelope([])));
  assert.equal((await response).status, 200);
});

test('expired reference codes survive a temporary refresh failure', async t => {
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  let calls = 0;
  const handler = createApiHandler(config, async url => {
    const operation = url.pathname.split('/').at(-1);
    if (operation === 'ldongCode2') {
      calls++;
      if (calls > 1) return Response.json({ response: { header: { resultCode: '05' } } });
      return Response.json(envelope([{ code: '11', name: '서울특별시' }]));
    }
    if (operation === 'areaBasedList2') assert.equal(url.searchParams.get('lDongRegnCd'), '11');
    return Response.json(envelope([]));
  });

  const request = '/api/destinations?region=' + encodeURIComponent('서울');
  assert.equal((await invoke(handler, request)).status, 200);
  now += 23 * 60 * 60 * 1000;
  assert.equal((await invoke(handler, request)).status, 200);
  assert.equal(calls, 1);
  now += 2 * 60 * 60 * 1000;
  assert.equal((await invoke(handler, request)).status, 200);
  assert.equal(calls, 2);
  now += 7 * 24 * 60 * 60 * 1000;
  assert.equal((await invoke(handler, request)).status, 502);
});
