import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createApiHandler } from './tour-api.mjs';
export function createAppServer(config = process.env) {
  const handler = createApiHandler(config);
  const root = resolve('dist');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
  return createServer(async (req, res) => {
    if (req.url === '/healthz') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true }));
    }
    await handler(req, res);
    if (res.writableEnded) return;
    try {
      const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
      const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + sep)) { res.statusCode = 403; return res.end(); }
      const data = await readFile(file);
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.end(data);
    } catch { res.statusCode = 404; res.end('Not found'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  createAppServer().listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () => console.log('aitmidtotrip API server started'));
}
