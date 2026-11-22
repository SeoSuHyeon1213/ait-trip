import { moodThemes } from '../src/config/moodThemes.mjs';
import { createTourResponseCache } from './tour-response-cache.mjs';
export const DEFAULT_ALLOWED_ORIGINS = 'https://aitmidtotrip.apps.tossmini.com,https://aitmidtotrip.private-apps.tossmini.com';
const allowedOperations = new Set(['areaBasedList2', 'detailCommon2', 'detailIntro2', 'detailImage2', 'ldongCode2', 'lclsSystmCode2']);
export class ApiError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}
const temporaryResultCodes = new Set(['01', '02', '04', '05', '22', '23']);
const daySeconds = 24 * 60 * 60;

class TemporaryTourError extends ApiError {}

function safeResultCode(value) {
  const code = String(value ?? '');
  return /^[0-9]{1,4}$/.test(code) ? code : undefined;
}

function tourError(message, resultCode, httpStatus) {
  const code = resultCode?.replace(/^00(?=\d{2}$)/, '').padStart(2, '0');
  const temporary = code && code !== '00'
    ? temporaryResultCodes.has(code)
    : httpStatus === 408 || httpStatus === 429 || httpStatus >= 500;
  return temporary ? new TemporaryTourError(message) : new ApiError(message);
}

export function parseEnvelope(value) {
  const response = value?.response;
  const resultCode = safeResultCode(response?.header?.resultCode);
  if (!['0000', '00'].includes(resultCode)) throw tourError('관광정보 API가 요청을 처리하지 못했어요.', resultCode);
  const body = response.body;
  if (!body) throw new ApiError('관광정보 응답 형식이 올바르지 않아요.');
  const raw = body.items?.item;
  const items = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  const totalCount = Number(body.totalCount ?? 0);
  if (!Number.isFinite(totalCount) || totalCount < 0) throw new ApiError('관광정보 페이지 정보가 올바르지 않아요.');
  return { items, totalCount, pageNo: Number(body.pageNo ?? 1), numOfRows: Number(body.numOfRows ?? items.length) };
}
export function createTourClient(config, fetcher = fetch) {
  const endpoint = config.TOUR_API_ENDPOINT?.trim() ?? '';
  const key = config.TOUR_API_SERVICE_KEY?.trim() ?? '';
  const configured = Boolean(endpoint && key);
  const cache = new Map();
  return {
    configured,
    async call(operation, params = {}, { cacheResult = true } = {}) {
      if (!configured) throw new ApiError('서버의 엔드포인트와 인증키를 입력해 주세요.', 503);
      if (!allowedOperations.has(operation)) throw new ApiError('지원하지 않는 요청이에요.', 400);
      let base;
      try { base = new URL(endpoint.endsWith('/') ? endpoint : endpoint + '/'); } catch { throw new ApiError('서버 엔드포인트 설정을 확인해 주세요.', 503); }
      if (base.protocol !== 'https:') throw new ApiError('HTTPS 엔드포인트를 입력해 주세요.', 503);
      const url = new URL(operation, base);
      url.search = new URLSearchParams({ serviceKey: key, MobileOS: 'WEB', MobileApp: config.TOUR_API_MOBILE_APP || 'ait-trip', _type: 'json', numOfRows: '20', pageNo: '1', ...params }).toString();
      // 일반(Decoding) 인증키를 URLSearchParams에서 한 번만 인코딩합니다.
      const cacheKey = operation + JSON.stringify(params);
      const stored = cacheResult ? cache.get(cacheKey) : undefined;
      if (stored && stored.until > Date.now()) {
        console.log({ event: 'tour_api', operation, cache: 'hit', durationMs: 0 });
        return stored.value;
      }

      const startedAt = Date.now();
      const signal = AbortSignal.timeout(10000);
      const log = { event: 'tour_api', operation, cache: 'miss' };
      try {
        let response;
        let text;
        try {
          response = await fetcher(url, { signal });
          log.httpStatus = response.status;
          text = await response.text();
        } catch {
          log.outcome = signal.aborted ? 'timeout' : 'network_error';
          throw new TemporaryTourError('관광정보 서버에 연결하지 못했어요.');
        }

        let payload;
        if (text.trimStart().startsWith('<')) {
          // 공공데이터 게이트웨이는 JSON 요청에도 XML 오류를 반환할 수 있습니다.
          log.resultCode = safeResultCode(text.match(/<(?:returnReasonCode|resultCode)>\s*(\d{1,4})\s*<\//)?.[1]);
          log.outcome = 'xml_error';
          throw tourError('관광정보 인증 설정 또는 사용 권한을 확인해 주세요.', log.resultCode, response.status);
        }
        try { payload = JSON.parse(text); } catch {
          log.outcome = 'invalid_json';
          if (response.ok) throw new ApiError('관광정보 응답을 읽지 못했어요.');
        }

        log.resultCode = safeResultCode(payload?.response?.header?.resultCode);
        if (!response.ok) {
          log.outcome = 'http_error';
          throw tourError('관광정보 서버 요청에 실패했어요. (HTTP ' + response.status + ')', log.resultCode, response.status);
        }

        log.outcome = 'invalid_envelope';
        const value = parseEnvelope(payload);
        log.outcome = 'success';
        if (cacheResult) {
          if (cache.size >= 200) cache.delete(cache.keys().next().value);
          cache.set(cacheKey, { value, until: Date.now() + 5 * 60 * 1000 });
        }
        return value;
      } finally {
        console.log({ ...log, durationMs: Date.now() - startedAt });
      }
    },
  };
}
export function createApiHandler(config, fetcher) {
  const client = createTourClient(config, fetcher);
  const allowedOrigins = new Set((config.CORS_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS).split(',').map(value => value.trim()).filter(Boolean));
  const codeCache = createTourResponseCache({ freshSeconds: daySeconds, retainSeconds: 7 * daySeconds, maxEntries: 2 });
  const recommendationCache = createTourResponseCache({ freshSeconds: 300, retainSeconds: daySeconds, maxEntries: 100 });

  async function codes(operation, sharedCache) {
    const stored = await codeCache.get(operation, sharedCache);
    if (stored?.freshUntil > Date.now()) {
      console.log({ event: 'tour_api', operation, cache: 'hit', durationMs: 0 });
      return stored.value;
    }

    try {
      const value = await client.call(operation, {
        numOfRows: '500',
        ...(operation === 'lclsSystmCode2' ? { lclsSystmListYn: 'Y' } : { lDongListYn: 'N' }),
      }, { cacheResult: false });
      codeCache.set(operation, value, sharedCache);
      return value;
    } catch (error) {
      if (!(error instanceof TemporaryTourError) || !(stored?.retainUntil > Date.now())) throw error;
      console.log({ event: 'tour_api', operation, cache: 'stale' });
      return stored.value;
    }
  }
  return async function handler(req, res, next) {
    const url = new URL(req.url || '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) { if (next) return next(); return false; }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    function send(status, value) { res.statusCode = status; res.end(JSON.stringify(value)); }
    try {
      const origin = req.headers?.origin;
      if (origin && !allowedOrigins.has(origin)) return send(403, { error: '허용되지 않은 앱에서 보낸 요청이에요.' });
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.statusCode = 204; return res.end();
      }
      if (req.method !== 'GET') return send(405, { error: 'GET 요청만 지원해요.' });
      // This is a public browser identifier, never the TourAPI key or a Client Secret.
      if (url.pathname === '/api/map-config') return send(200, { clientId: config.NAVER_MAP_CLIENT_ID?.trim() || '' });
      if (url.pathname === '/api/status') return send(200, { configured: client.configured });
      if (!client.configured) throw new ApiError('서버 API 설정이 비어 있어요.', 503);
      if (url.pathname === '/api/destinations') {
        const pageNo = Number(url.searchParams.get('pageNo') || 1);
        const pageSize = Number(url.searchParams.get('pageSize') || 20);
        if (!Number.isInteger(pageNo) || pageNo < 1 || pageNo > 10000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new ApiError('페이지 설정이 올바르지 않아요.', 400);
        const region = url.searchParams.get('region') || '전체';
        const mood = url.searchParams.get('mood') || 'rest';
        if (!['rest', 'refresh', 'explore', 'together'].includes(mood)) throw new ApiError('기분 선택을 확인해 주세요.', 400);
        const cacheKey = JSON.stringify([mood, region, pageNo, pageSize]);
        const stored = await recommendationCache.get(cacheKey, req.sharedCache);
        if (stored?.freshUntil > Date.now()) {
          console.log({ event: 'tour_recommendations', cache: 'hit' });
          return send(200, stored.value);
        }

        const regionCodes = codes('ldongCode2', req.sharedCache);
        const classifications = codes('lclsSystmCode2', req.sharedCache);
        const list = item => client.call('areaBasedList2', {
          pageNo: String(pageNo), numOfRows: String(pageSize), ...moodThemes[mood].filters,
          arrange: 'C', ...(item ? { lDongRegnCd: String(item.code) } : {}),
        }, { cacheResult: false });
        const pagesRequest = region === '전체' ? Promise.all([list()]) : regionCodes.then(({ items }) => {
          // 지역 이름을 공식 코드 목록에 매칭합니다. 전라는 전북·전남을 묶습니다.
          const prefix = ({ 충북: '충청북', 충남: '충청남', 경북: '경상북', 경남: '경상남' })[region] || region;
          const matches = items.filter(item => region === '전라' ? /전북|전남|전라/.test(item.name) : String(item.name).startsWith(prefix));
          if (!matches.length) throw new ApiError('지역 코드가 없어요. 지역을 다시 선택해 주세요.', 400);
          return Promise.all(matches.map(list));
        });

        try {
          const results = await Promise.allSettled([regionCodes, classifications, pagesRequest]);
          const failures = results.filter(result => result.status === 'rejected');
          if (failures.length) {
            const failure = failures.find(result => !(result.reason instanceof TemporaryTourError)) ?? failures[0];
            throw failure.reason;
          }
          const [{ value: regions }, { value: classification }, { value: pages }] = results;
          const value = {
            items: pages.flatMap(page => page.items),
            totalCount: pages.reduce((total, page) => total + page.totalCount, 0),
            pageNo, pageSize, hasMore: pages.some(page => pageNo * pageSize < page.totalCount),
            regions: regions.items, classifications: classification.items,
          };
          recommendationCache.set(cacheKey, value, req.sharedCache);
          return send(200, value);
        } catch (error) {
          if (!(error instanceof TemporaryTourError) || !(stored?.retainUntil > Date.now())) throw error;
          console.log({ event: 'tour_recommendations', cache: 'stale' });
          res.setHeader('X-Tour-Cache', 'stale');
          return send(200, stored.value);
        }
      }
      const match = url.pathname.match(/^\/api\/destinations\/(\d+)$/);
      if (match) {
        const common = await client.call('detailCommon2', { contentId: match[1] });
        const item = common.items[0];
        if (!item) return send(404, { error: '여행지를 찾을 수 없어요.' });
        const [intro, images, regionCodes, classifications] = await Promise.all([
          client.call('detailIntro2', { contentId: match[1], contentTypeId: String(item.contenttypeid) }),
          client.call('detailImage2', { contentId: match[1], imageYN: 'Y' }), codes('ldongCode2', req.sharedCache), codes('lclsSystmCode2', req.sharedCache),
        ]);
        return send(200, { item, intro: intro.items[0] || {}, images: images.items, regions: regionCodes.items, classifications: classifications.items });
      }
      return send(404, { error: '지원하지 않는 API 경로예요.' });
    } catch (error) { return send(error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : '서버에서 요청을 처리하지 못했어요.' }); }
  };
}
