import { moodThemes } from '../src/config/moodThemes.mjs';
const allowedOperations = new Set(['areaBasedList2', 'detailCommon2', 'detailIntro2', 'detailImage2', 'ldongCode2', 'lclsSystmCode2']);
export class ApiError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}
export function parseEnvelope(value) {
  const response = value?.response;
  if (!response?.header || !['0000', '00'].includes(String(response.header.resultCode))) throw new ApiError('관광정보 API가 요청을 처리하지 못했어요.');
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
    async call(operation, params = {}) {
      if (!configured) throw new ApiError('서버의 엔드포인트와 인증키를 입력해 주세요.', 503);
      if (!allowedOperations.has(operation)) throw new ApiError('지원하지 않는 요청이에요.', 400);
      let base;
      try { base = new URL(endpoint.endsWith('/') ? endpoint : endpoint + '/'); } catch { throw new ApiError('서버 엔드포인트 설정을 확인해 주세요.', 503); }
      if (base.protocol !== 'https:') throw new ApiError('HTTPS 엔드포인트를 입력해 주세요.', 503);
      const url = new URL(operation, base);
      url.search = new URLSearchParams({ serviceKey: key, MobileOS: 'WEB', MobileApp: config.TOUR_API_MOBILE_APP || 'ait-trip', _type: 'json', numOfRows: '20', pageNo: '1', ...params }).toString();
      // 일반(Decoding) 인증키를 URLSearchParams에서 한 번만 인코딩합니다.
      const cacheKey = operation + JSON.stringify(params);
      const stored = cache.get(cacheKey);
      if (stored && stored.until > Date.now()) return stored.value;
      let res;
      try { res = await fetcher(url, { signal: AbortSignal.timeout(10000) }); } catch { throw new ApiError('관광정보 서버에 연결하지 못했어요.'); }
      if (!res.ok) throw new ApiError('관광정보 서버 요청에 실패했어요. (HTTP ' + res.status + ')');
      const text = await res.text();
      // 인증 오류는 JSON 요청에도 XML로 반환될 수 있습니다. 원문/키는 클라이언트에 전달하지 않습니다.
      if (text.trimStart().startsWith('<')) throw new ApiError('관광정보 인증 설정 또는 사용 권한을 확인해 주세요.');
      let value;
      try { value = parseEnvelope(JSON.parse(text)); } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError('관광정보 응답을 읽지 못했어요.'); }
      if (cache.size >= 200) cache.delete(cache.keys().next().value);
      cache.set(cacheKey, { value, until: Date.now() + 5 * 60 * 1000 });
      return value;
    },
  };
}
export function createApiHandler(config, fetcher) {
  const client = createTourClient(config, fetcher);
  const allowedOrigins = new Set((config.CORS_ALLOWED_ORIGINS || 'https://aitmidtotrip.apps.tossmini.com,https://aitmidtotrip.private-apps.tossmini.com').split(',').map(value => value.trim()).filter(Boolean));
  async function codes(operation) { return client.call(operation, { numOfRows: '500', ...(operation === 'lclsSystmCode2' ? { lclsSystmListYn: 'Y' } : { lDongListYn: 'N' }) }); }
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
      if (url.pathname === '/api/status') return send(200, { configured: client.configured });
      if (!client.configured) throw new ApiError('서버 API 설정이 비어 있어요.', 503);
      if (url.pathname === '/api/destinations') {
        const pageNo = Number(url.searchParams.get('pageNo') || 1);
        const pageSize = Number(url.searchParams.get('pageSize') || 20);
        if (!Number.isInteger(pageNo) || pageNo < 1 || pageNo > 10000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new ApiError('페이지 설정이 올바르지 않아요.', 400);
        const region = url.searchParams.get('region') || '전체';
        const mood = url.searchParams.get('mood') || 'rest';
        if (!['rest', 'refresh', 'explore', 'together'].includes(mood)) throw new ApiError('기분 선택을 확인해 주세요.', 400);
        const regions = await codes('ldongCode2');
        // 지역 이름을 공식 코드 목록에 매칭합니다. 전라는 전북·전남을 묶습니다.
        const matches = region === '전체' ? [undefined] : regions.items.filter(item => region === '전라' ? /전북|전남|전라/.test(item.name) : String(item.name).startsWith(({ 충북: '충청북', 충남: '충청남', 경북: '경상북', 경남: '경상남' })[region] || region));
        if (!matches.length) throw new ApiError('지역 코드가 없어요. 지역을 다시 선택해 주세요.', 400);
        const classification = await codes('lclsSystmCode2');
        const theme = moodThemes[mood];
        const pages = await Promise.all(matches.map(item => client.call('areaBasedList2', { pageNo: String(pageNo), numOfRows: String(pageSize), ...theme.filters, arrange: 'C', ...(item ? { lDongRegnCd: String(item.code) } : {}) })));
        return send(200, { items: pages.flatMap(page => page.items), totalCount: pages.reduce((total, page) => total + page.totalCount, 0), pageNo, pageSize, hasMore: pages.some(page => pageNo * pageSize < page.totalCount), regions: regions.items, classifications: classification.items });
      }
      const match = url.pathname.match(/^\/api\/destinations\/(\d+)$/);
      if (match) {
        const common = await client.call('detailCommon2', { contentId: match[1] });
        const item = common.items[0];
        if (!item) return send(404, { error: '여행지를 찾을 수 없어요.' });
        const [intro, images, regionCodes, classifications] = await Promise.all([
          client.call('detailIntro2', { contentId: match[1], contentTypeId: String(item.contenttypeid) }),
          client.call('detailImage2', { contentId: match[1], imageYN: 'Y' }), codes('ldongCode2'), codes('lclsSystmCode2'),
        ]);
        return send(200, { item, intro: intro.items[0] || {}, images: images.items, regions: regionCodes.items, classifications: classifications.items });
      }
      return send(404, { error: '지원하지 않는 API 경로예요.' });
    } catch (error) { return send(error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : '서버에서 요청을 처리하지 못했어요.' }); }
  };
}
