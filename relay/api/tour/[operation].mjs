// 관광공사 API 한국 중계 (Vercel 서울 icn1).
// 공공데이터 게이트웨이가 Cloudflare 출구 IP를 수시로 막아서, Worker는 이 중계를 거쳐 조회합니다.
// 인증키는 이 중계 서버 환경변수에만 있고, Worker는 공유 토큰(X-Relay-Token)으로만 호출합니다.
import { createHash, timingSafeEqual } from 'node:crypto';

const allowedOperations = new Set(['areaBasedList2', 'detailCommon2', 'detailIntro2', 'detailImage2', 'ldongCode2', 'lclsSystmCode2']);
const defaultUpstream = 'https://apis.data.go.kr/B551011/KorService2';

function digest(value) { return createHash('sha256').update(String(value)).digest(); }
function sameToken(given, expected) { return Boolean(given && expected) && timingSafeEqual(digest(given), digest(expected)); }
function fail(status, error) {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function handleRelay(request, env = process.env, fetcher = fetch) {
  const token = env.RELAY_TOKEN?.trim();
  const key = env.TOUR_API_SERVICE_KEY?.trim();
  if (!token || !key) return fail(503, 'relay not configured');
  if (!sameToken(request.headers.get('x-relay-token'), token)) return fail(401, 'unauthorized');
  if (request.method !== 'GET') return fail(405, 'GET only');

  const url = new URL(request.url);
  const operation = url.pathname.split('/').filter(Boolean).pop();
  if (!allowedOperations.has(operation)) return fail(404, 'unknown operation');

  const base = (env.TOUR_API_ENDPOINT?.trim() || defaultUpstream).replace(/\/?$/, '/');
  const target = new URL(operation, base);
  const params = new URLSearchParams(url.search);
  params.delete('serviceKey');
  params.delete('operation');
  // 일반(Decoding) 인증키를 URLSearchParams에서 한 번만 인코딩합니다.
  target.search = new URLSearchParams([['serviceKey', key], ...params]).toString();

  const startedAt = Date.now();
  try {
    const upstream = await fetcher(target, { signal: AbortSignal.timeout(8000) });
    const body = await upstream.text();
    console.log({ event: 'tour_relay', operation, httpStatus: upstream.status, durationMs: Date.now() - startedAt });
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    console.log({ event: 'tour_relay', operation, outcome: timeout ? 'timeout' : 'network_error', durationMs: Date.now() - startedAt });
    return fail(timeout ? 504 : 502, 'upstream unreachable');
  }
}

export function GET(request) { return handleRelay(request); }
