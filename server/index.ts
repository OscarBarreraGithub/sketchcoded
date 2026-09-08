import path from 'node:path';
import express from 'express';
import { createServer } from 'node:http';
import { Store } from './store';
import { createApp } from './app';
const store = new Store(path.resolve(process.env.DRAWCODE_DATA_DIR || '.drawcode'));
await store.init();
const app = createApp(store),
  server = createServer(app);
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, ws: { server } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 5173);
server.listen(port, '127.0.0.1', () =>
  console.log(
    `\n  Sketchcoded is ready → http://127.0.0.1:${port}\n  Projects saved in ${store.root}\n`,
  ),
);
