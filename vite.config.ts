import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import aitDevtools from '@apps-in-toss/devtools/unplugin';
import { getApiUrl } from './src/config/apiBase.mjs';
import { createApiHandler } from './server/tour-api.mjs';

export default defineConfig(({ mode, command }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  if (command === 'build') getApiUrl(env.VITE_API_BASE_URL, '/api/status', true);
  const handler = createApiHandler(env);
  return { plugins: [aitDevtools.vite(), react(), {
    name: 'tour-api-server',
    configureServer(server) { server.middlewares.use((req, res, next) => { void handler(req, res, next); }); },
    configurePreviewServer(server) { server.middlewares.use((req, res, next) => { void handler(req, res, next); }); },
  }] };
});
