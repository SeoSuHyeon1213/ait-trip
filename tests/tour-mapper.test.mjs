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

test('tour text keeps paragraphs, list items and line breaks without rendering HTML', () => {
  const { plainText } = moduleExports;
  assert.equal(plainText('<p>첫 문단 &amp; 소개</p><p>다음 문단<br />운영 안내</p>'), '첫 문단 & 소개\n\n다음 문단\n운영 안내');
  assert.equal(plainText('<ul><li>성인 &#49;,000원</li><li>어린이 &#x35;00원</li></ul>'), '• 성인 1,000원\n• 어린이 500원');
  assert.equal(plainText('  안내\r\n  시간  <br><br><br>문의 &nbsp; 전화  '), '안내\n시간\n\n문의 전화');
  assert.equal(plainText('<script>alert(1)</script><style>p {}</style><a href="x">안내</a>'), '안내');
  assert.equal(plainText('&#99999999;'), '&#99999999;');
});

test('copyable address includes both address fields and never falls back to region', () => {
  const dto = mapTourDestination({ ...item, addr1: '서울특별시 용산구', addr2: '서빙고로 137' }, regions, []);
  assert.equal(dto.address, '서울특별시 용산구 서빙고로 137');
  assert.equal(destinationExports.mapDestination(dto).address, dto.address);
  const missing = mapTourDestination({ ...item, addr1: '', addr2: '' }, regions, []);
  assert.equal(missing.address, undefined);
  assert.equal(missing.location_label, '서울특별시');
});
