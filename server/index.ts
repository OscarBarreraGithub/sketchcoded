import { access } from 'node:fs/promises';
import express from 'express';
import { createServer } from 'node:http';
import { Store } from './store';
import { createApp } from './app';
import { repoPath, repoRoot } from './paths';
import { serverConfig, serverHelp } from './config';

const config = serverConfig();
if (config.help) {
  console.log(serverHelp);
  process.exit(0);
}
if (config.production) {
  process.env.NODE_ENV = 'production';
  await access(repoPath('dist/index.html')).catch(() => {
    throw new Error('The frontend has not been built. Run npm run build before npm start.');
  });
}
const store = new Store(config.dataDir);
await store.init();
const app = createApp(store),
  server = createServer(app);
let closeVite: (() => Promise<void>) | undefined;
if (config.production) {
  app.use(express.static(repoPath('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(repoPath('dist/index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    root: repoRoot,
    configFile: repoPath('vite.config.ts'),
    server: { middlewareMode: true, ws: { server } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  closeVite = () => vite.close();
}
server.once('error', async (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Port ${config.port} is in use. Choose another with --port, or --port 0 for an available port.`
      : error.message,
  );
  await closeVite?.();
  process.exit(1);
});
server.listen(config.port, '127.0.0.1', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : config.port;
  console.log(
    `\n  Sketchcoded is ready → http://127.0.0.1:${port}\n  Projects saved in ${store.root}\n`,
  );
});

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.closeAllConnections();
  await Promise.all([new Promise<void>((resolve) => server.close(() => resolve())), closeVite?.()]);
  clearTimeout(timeout);
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
