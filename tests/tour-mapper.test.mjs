import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as themesModule from '../src/config/moodThemes.mjs';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../src/data/mappers/TourDestinationMapper.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleExports = {};
vm.runInNewContext(compiled, { exports: moduleExports, URL, require: (specifier) => { if (specifier === '../../config/moodThemes.mjs') return themesModule; throw new Error('Unexpected import'); } });
const { mapTourDestination } = moduleExports;
const item = { contentid: '123', contenttypeid: '14', title: '전시', addr1: '주소', lDongRegnCd: '11', mapx: '', mapy: '' };
const regions = [{ code: '11', name: '서울특별시' }];
test('empty coordinates remain absent and codes map to region names', () => {
  const dto = mapTourDestination(item, regions, []);
  assert.equal(dto.latitude, undefined); assert.equal(dto.longitude, undefined); assert.equal(dto.region_name, '서울특별시');
});
test('detail intro fields normalize HTML for each content type', () => {
  const dto = mapTourDestination(item, regions, [], { intro: { usetimeculture: '09:00<br>18:00', usefee: '무료' }, images: [] });
  assert.equal(dto.visit_info.hours, '09:00\n18:00'); assert.equal(dto.visit_info.fee, '무료');
});
test('known tourism image URLs upgrade to HTTPS; unsafe URLs rejected', () => {
  assert.equal(mapTourDestination({ ...item, firstimage: 'http://tong.visitkorea.or.kr/a.jpg' }, [], []).image_url, 'https://tong.visitkorea.or.kr/a.jpg');
  assert.equal(mapTourDestination({ ...item, firstimage: 'javascript:alert(1)' }, [], []).image_url, undefined);
});
test('out-of-range coordinates excluded', () => {
  const dto = mapTourDestination({ ...item, mapx: '999', mapy: '999' }, [], []);
  assert.equal(dto.latitude, undefined); assert.equal(dto.longitude, undefined);
});

const destinationSource = readFileSync(new URL('../src/data/mappers/DestinationMapper.ts', import.meta.url), 'utf8');
const destinationExports = {};
vm.runInNewContext(ts.transpileModule(destinationSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: destinationExports });
test('official and missing API region names pass through both mappers', () => {
  for (const name of ['서울특별시', '부산광역시', '충청북도', '전북특별자치도', '제주특별자치도']) {
    const destination = destinationExports.mapDestination(mapTourDestination(item, [{ code: '11', name }], []));
    assert.equal(destination.region, name);
    assert.equal(destination.id, '123');
  }
  const destination = destinationExports.mapDestination(mapTourDestination(item, [], []));
  assert.equal(destination.region, '지역 미제공');
});

test('theme codes determine mood and concrete recommendation reasons', () => {
  for (const [mood, theme] of Object.entries(themesModule.moodThemes)) {
    const dto = mapTourDestination({ ...item, ...theme.filters }, regions, []);
    assert.equal(dto.mood_codes.join(','), mood);
    assert.ok(dto.recommendation_reasons[mood].includes(theme.reason));
  }
  assert.equal(mapTourDestination(item, regions, []).mood_codes.length, 0);
});
