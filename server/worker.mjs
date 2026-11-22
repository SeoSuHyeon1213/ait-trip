import { createApiHandler, DEFAULT_ALLOWED_ORIGINS } from './tour-api.mjs';

function sharedTourCache(origin, ctx) {
  const cache = globalThis.caches?.default;
  if (!cache || !ctx) return undefined;

  const cacheUrl = key => new URL('/__tour-cache/v1/' + encodeURIComponent(key), origin).href;
  return {
    async get(key) {
      try {
        const response = await cache.match(cacheUrl(key));
        return response ? await response.json() : undefined;
      } catch {
        console.warn({ event: 'tour_edge_cache', outcome: 'read_error' });
        return undefined;
      }
    },
    set(key, entry, retainSeconds) {
      ctx.waitUntil(cache.put(cacheUrl(key), Response.json(entry, {
        headers: { 'Cache-Control': 'public, max-age=' + retainSeconds },
      })).catch(() => {
        console.warn({ event: 'tour_edge_cache', outcome: 'write_error' });
      }));
    },
  };
}
export function createWorker(fetcher) {
  const handlers = new WeakMap();
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      if (url.pathname === '/healthz') return Response.json({ ok: true });
      if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
        let origins = handlers.get(env);
        if (!origins) { origins = new Map(); handlers.set(env, origins); }
        let handler = origins.get(url.origin);
        if (!handler) {
          handler = createApiHandler({
            ...env,
            CORS_ALLOWED_ORIGINS: [env.CORS_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS, url.origin].join(','),
          }, fetcher);
          if (origins.size >= 10) origins.delete(origins.keys().next().value);
          origins.set(url.origin, handler);
        }
        const headers = new Headers();
        let status = 404;
        let body = JSON.stringify({ error: '지원하지 않는 API 경로예요.' });
        const response = {
          setHeader(name, value) { headers.set(name, value); },
          set statusCode(value) { status = value; },
          end(value) { body = value; },
        };
        await handler({
          url: request.url,
          method: request.method,
          headers: { origin: request.headers.get('Origin') },
          sharedCache: sharedTourCache(url.origin, ctx),
        }, response);
        return new Response(status === 204 ? null : body, { status, headers });
      }
      return env.ASSETS.fetch(request);
    },
  };
}

export default createWorker();
