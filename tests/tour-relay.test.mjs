import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRelay } from '../relay/api/tour/[operation].mjs';

const env = { RELAY_TOKEN: 'relay-token', TOUR_API_SERVICE_KEY: 'fake+a/b=' };
const req = (path, token = 'relay-token') => new Request('https://relay.example' + path, { headers: token ? { 'X-Relay-Token': token } : {} });

test('relay rejects missing or wrong tokens without calling upstream', async () => {
  let called = false;
  const fetcher = async () => { called = true; };
  assert.equal((await handleRelay(req('/api/tour/areaBasedList2', null), env, fetcher)).status, 401);
  assert.equal((await handleRelay(req('/api/tour/areaBasedList2', 'wrong'), env, fetcher)).status, 401);
  assert.equal((await handleRelay(req('/api/tour/areaBasedList2'), {}, fetcher)).status, 503);
  assert.equal(called, false);
});

test('relay only forwards allowed TourAPI operations', async () => {
  let called = false;
  const response = await handleRelay(req('/api/tour/otherService'), env, async () => { called = true; });
  assert.equal(response.status, 404);
  assert.equal(called, false);
});

test('relay adds the server key once, drops caller keys and passes the body through', async () => {
  let target;
  const response = await handleRelay(req('/api/tour/areaBasedList2?serviceKey=caller&pageNo=3&_type=json'), env, async url => {
    target = url;
    return new Response('{"ok":1}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '{"ok":1}');
  assert.equal(target.origin + target.pathname, 'https://apis.data.go.kr/B551011/KorService2/areaBasedList2');
  assert.deepEqual(target.searchParams.getAll('serviceKey'), ['fake+a/b=']);
  assert.equal(target.searchParams.get('pageNo'), '3');
});

test('relay reports upstream failures without leaking the key', async () => {
  const response = await handleRelay(req('/api/tour/detailCommon2'), env, async () => { throw Object.assign(new Error('x'), { name: 'TimeoutError' }); });
  assert.equal(response.status, 504);
  assert.equal((await response.text()).includes('fake'), false);
});
