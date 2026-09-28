import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { emptyProject, projectSchema } from '../shared/model';
import { agentBrief, contextSchema, skillIds, skills } from '../shared/agent';
import { flowDocument } from '../shared/flow-document';
import { publicExample } from '../shared/public-example';
import { planningOutline } from '../shared/planning';
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
  app.get('/api/projects/:id/example', async (req, res) =>
    res.json(publicExample(await store.read(req.params.id))),
  );
  app.get('/api/projects/:id', async (req, res) => res.json(await store.read(req.params.id)));
  // Rule (2026-09-26): every view can hand its task to the agent. The agent reads these from the
  // running app instead of asking the user: the brief for one task, the whole documents, the
  // user's rules and the skills.
  const base = (req: express.Request) => `http://${req.headers.host}`;
  const markdown = (res: express.Response, text: string) =>
    res.type('text/markdown; charset=utf-8').send(text);
  app.get('/api/projects/:id/brief', async (req, res) => {
    const project = await store.read(req.params.id);
    const context = contextSchema.safeParse(req.query);
    if (!context.success)
      throw new AppError(
        `Unknown brief context: ${context.error.issues[0]?.message ?? 'bad query'}. Use view=board|screen-editor|connection-editor|plan|outline|review|test-flow|library|boards with optional screen, pin, layout, transition, idea, finding, trail, mode (list|frames|built).`,
        400,
      );
    const extras = context.data.view === 'boards' ? { boards: await store.list() } : {};
    markdown(res, agentBrief(project, context.data, base(req), extras));
  });
  app.get('/api/brief', async (req, res) => {
    const context = contextSchema.safeParse(req.query);
    if (!context.success || context.data.view !== 'boards')
      throw new AppError(
        'This address serves the boards brief only: /api/brief?view=boards. A board’s own views live at /api/projects/:id/brief.',
        400,
      );
    markdown(
      res,
      agentBrief(emptyProject('Sketchcoded', 'sketchcoded'), context.data, base(req), {
        boards: await store.list(),
      }),
    );
  });
  app.get('/api/projects/:id/flow.md', async (req, res) =>
    markdown(res, flowDocument(await store.read(req.params.id))),
  );
  app.get('/api/projects/:id/outline.md', async (req, res) =>
    markdown(res, planningOutline(await store.read(req.params.id))),
  );
  app.get('/api/checklist.md', async (_req, res) =>
    markdown(res, await fs.readFile(path.resolve('docs/BUILD_CHECKLIST.md'), 'utf8')),
  );
  app.get('/api/skills', (req, res) =>
    res.json(
      skillIds.map((id) => ({ id, ...skills[id], url: `${base(req)}/api/skills/${id}.md` })),
    ),
  );
  app.get('/api/skills/:name', async (req, res) => {
    const name = req.params.name.replace(/\.md$/, '');
    if (!(skillIds as readonly string[]).includes(name))
      throw new AppError(`No skill named ${name}. See /api/skills.`, 404);
    markdown(res, await fs.readFile(path.resolve('docs/skills', `${name}.md`), 'utf8'));
  });
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
