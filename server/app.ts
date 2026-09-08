import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { projectSchema } from '../shared/model';
import { AppError, Store } from './store';
export function createApp(store: Store) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const local = (value: string) => {
      try {
        return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname);
      } catch {
        return false;
      }
    };
    if (!local(`http://${req.headers.host}`) || (req.headers.origin && !local(req.headers.origin)))
      return res.status(403).json({ error: 'Sketchcoded accepts local browser requests only.' });
    if (
      req.path.startsWith('/api/') &&
      !['GET', 'HEAD'].includes(req.method) &&
      req.headers['x-drawcode-client'] !== 'local'
    )
      return res.status(403).json({ error: 'Missing local client header.' });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(express.json({ limit: '8mb' }));
  app.use(
    '/assets',
    express.static(store.assetsDir, { immutable: true, maxAge: '1y', dotfiles: 'deny' }),
  );
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 40 },
  });
  const bundle = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 150 * 1024 * 1024, files: 1 },
  });
  app.get('/api/projects', async (_req, res) => res.json(await store.list()));
  app.post('/api/projects', async (req, res) => {
    const { name, demo } = z
      .object({ name: z.string().trim().min(1).max(200), demo: z.boolean().optional() })
      .parse(req.body);
    res.status(201).json(await store.create(name, demo));
  });
  app.get('/api/projects/:id', async (req, res) => res.json(await store.read(req.params.id)));
  app.put('/api/projects/:id', async (req, res) => {
    const p = projectSchema.parse(req.body);
    if (p.id !== req.params.id) throw new AppError('Project identifier mismatch.');
    res.json(await store.save(p));
  });
  app.post('/api/images', upload.array('images', 40), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw new AppError('Choose one or more images.');
    const assets = [],
      warnings = [];
    for (const file of files) {
      try {
        assets.push(await store.importImage(file.buffer, file.originalname));
      } catch (error) {
        warnings.push((error as Error).message);
      }
    }
    res.json({ assets, warnings });
  });
  app.post('/api/folders/scan', async (req, res) => {
    const { folder } = z.object({ folder: z.string().trim().min(1).max(4000) }).parse(req.body);
    res.json(await store.scanFolder(folder));
  });
  // Export the submitted in-memory version too, so users can recover a save conflict.
  app.post('/api/export', async (req, res) => {
    const project = projectSchema.parse(req.body),
      zip = await store.export(project);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="sketchcoded-project.zip"');
    res.send(Buffer.from(zip));
  });
  app.post('/api/import', bundle.single('project'), async (req, res) => {
    if (!req.file) throw new AppError('Choose a Sketchcoded ZIP.');
    res.status(201).json(await store.importBundle(req.file.buffer));
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route.' }));
  app.use(
    (error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: `Invalid project data: ${error.issues[0]?.message}` });
      if (error instanceof multer.MulterError)
        return res.status(400).json({
          error:
            'Upload limit reached. Use up to 40 images under 25 MB each, or one project ZIP under 150 MB.',
        });
      const status = error instanceof AppError ? error.status : 500;
      if (status === 500) console.error(error);
      res.status(status).json({
        error:
          status === 500
            ? 'The local server could not complete this action. Your existing project is still on disk.'
            : error.message,
      });
    },
  );
  return app;
}
