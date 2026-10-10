import test from 'node:test';
import assert from 'node:assert/strict';
import { readAppRoute } from '../src/navigation/readAppRoute.mjs';
test('feature links enter the saved and recommendation pages directly', () => {
  for (const page of ['saved', 'results']) {
    assert.deepEqual(readAppRoute({ pathname: '/' + page, hash: '' }), { page });
    assert.deepEqual(readAppRoute({ pathname: '/' + page + '/', hash: '' }), { page });
  }
});
test('internal navigation overrides the feature entry pathname', () => {
  assert.deepEqual(readAppRoute({ pathname: '/saved', hash: '#/' }), { page: 'home' });
  assert.deepEqual(readAppRoute({ pathname: '/saved', hash: '#/results' }), { page: 'results' });
  assert.deepEqual(readAppRoute({ pathname: '/results', hash: '#/place/129235' }), { page: 'detail', id: '129235' });
});
test('legacy links and unknown paths remain safe', () => {
  assert.deepEqual(readAppRoute({ pathname: '/', hash: '#/saved' }), { page: 'saved' });
  assert.deepEqual(readAppRoute({ pathname: '/place/129235' }), { page: 'detail', id: '129235' });
  assert.deepEqual(readAppRoute({ pathname: '/unknown' }), { page: 'home' });
  assert.deepEqual(readAppRoute({ pathname: '/place/' }), { page: 'home' });
});
