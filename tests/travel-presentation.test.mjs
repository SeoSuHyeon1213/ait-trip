import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const exports = {};
vm.runInNewContext(ts.transpileModule(
  readFileSync(new URL('../src/domain/travelPresentation.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports });
const { getDestinationTheme, getThemeOptions, summarizeSavedPlaces, sortSavedPlaces } = exports;
const place = (id, name, region, tags = []) => ({ id, name, region, category: '관광지', tags });

test('theme chips distinguish coastline, beaches and inland water', () => {
  assert.equal(getDestinationTheme(place('a', '채석강', '전북', ['해안절경'])), '해안절경');
  assert.equal(getDestinationTheme(place('b', '영진해변', '강원', ['해수욕장'])), '해변·해수욕장');
  assert.equal(getDestinationTheme(place('c', '의암호수', '강원', ['호수'])), '강·호수');
  assert.equal(getThemeOptions('refresh').join('|'), '전체|해변·해수욕장|해안절경|강·호수');
});

test('theme chips cover the remaining moods and preserve unknown categories', () => {
  for (const [name, expected] of [
    ['국립휴양림', '휴양림·숲'], ['국가정원', '정원'], ['국립공원', '자연공원'],
    ['역사박물관', '박물관'], ['시립미술관', '미술관'], ['천문대', '과학관'],
    ['테마파크', '테마파크'], ['동물원', '동물원'], ['아쿠아리움', '수족관'],
  ]) assert.equal(getDestinationTheme(place(name, name, '서울')), expected);
  assert.equal(getDestinationTheme(place('a', '한옥마을', '전라', ['한옥'])), '한옥');
});

test('passport counts distinct saved regions and themes from real items', () => {
  const summary = summarizeSavedPlaces([
    place('1', '영진해변', '강원', ['해변']),
    place('2', '의암호수', '강원', ['호수']),
    place('3', '채석강', '전북', ['해안절경']),
    place('4', '경포해변', '지역 미제공', ['해변']),
  ]);
  assert.equal(summary.regionCount, 2);
  assert.equal(summary.themeCount, 3);
  assert.equal(summary.frequentRegion, '강원');
});

test('empty passport shows zero counts and an honest empty region label', () => {
  const summary = summarizeSavedPlaces([]);
  assert.equal(summary.regionCount, 0);
  assert.equal(summary.themeCount, 0);
  assert.equal(summary.frequentRegion, '아직 없어요');
});

test('recent bookmarks follow save order regardless of repository response order', () => {
  const items = [place('a', '가', '서울'), place('c', '다', '강원'), place('b', '나', '제주')];
  const sorted = sortSavedPlaces(items, ['a', 'b', 'c'], 'recent');
  assert.equal(sorted.map(item => item.id).join(','), 'c,b,a');
  assert.equal(items.map(item => item.id).join(','), 'a,c,b');
});

test('name sorting uses Korean order without changing the original list', () => {
  const items = [place('c', '다', '서울'), place('a', '가', '강원'), place('b', '나', '제주')];
  assert.equal(sortSavedPlaces(items, ['a', 'b', 'c'], 'name').map(item => item.id).join(','), 'a,b,c');
  assert.equal(items.map(item => item.id).join(','), 'c,a,b');
});
