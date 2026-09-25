import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { flowDocument } from '../shared/flow-document';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { emptyProject, projectSchema, type Asset, type Project } from '../shared/model';
import { analyze, decisionFor } from '../shared/graph';
import { demoProject } from '../shared/demo';
import { demoArt } from './demo-art';

export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const imageExt = /\.(png|jpe?g|webp|gif|avif|tiff?|svg)$/i;
const MAX_IMAGE = 25 * 1024 * 1024;
export class Store {
  private saves = new Map<string, Promise<unknown>>();
  private folderImageCache = new Map<string, { stamp: string; asset: Asset }>();
  constructor(public root: string) {}
  get assetsDir() {
    return path.join(this.root, 'assets');
  }
  get projectsDir() {
    return path.join(this.root, 'projects');
  }
  private projectPath(id: string) {
    if (!/^[\w-]{1,100}$/.test(id)) throw new AppError('Invalid project identifier.');
    return path.join(this.projectsDir, `${id}.json`);
  }
  async init() {
    await fs.mkdir(this.assetsDir, { recursive: true });
    await fs.mkdir(this.projectsDir, { recursive: true });
    if (!(await fs.readdir(this.projectsDir)).some((f) => f.endsWith('.json')))
      await this.create('Little chat', true);
  }
  async importImage(bytes: Buffer, name: string, source?: string): Promise<Asset> {
    if (bytes.length > MAX_IMAGE) throw new AppError(`${name}: images must be under 25 MB.`);
    let result;
    try {
      result = await sharp(bytes, { limitInputPixels: 40_000_000, animated: false })
        .autoOrient()
        .resize({ width: 4096, height: 4096, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 92 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new AppError(
        `${name}: this image could not be read. Use PNG, JPEG, WebP, GIF, AVIF, TIFF, or SVG.`,
      );
    }
    const hash = createHash('sha256').update(result.data).digest('hex');
    await fs
      .writeFile(path.join(this.assetsDir, `${hash}.webp`), result.data, { flag: 'wx' })
      .catch((error) => {
        if (error.code !== 'EEXIST') throw error;
      });
    return {
      id: hash,
      file: `${hash}.webp`,
      name,
      width: result.info.width,
      height: result.info.height,
      source,
      importedAt: new Date().toISOString(),
    };
  }
  async create(name: string, demo = false) {
    let project: Project;
    if (demo) {
      const assets: Asset[] = [];
      for (const [name, svg] of Object.entries(demoArt))
        assets.push(await this.importImage(Buffer.from(svg), name));
      project = demoProject(assets, randomUUID());
      project.name = name;
    } else project = emptyProject(name, randomUUID());
    return this.save(project, true);
  }
  async list() {
    const names = (await fs.readdir(this.projectsDir)).filter((f) => f.endsWith('.json'));
    const projects = await Promise.all(names.map((name) => this.read(name.slice(0, -5))));
    return projects
      .map((p) => ({
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        screenCount: p.screens.length,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async read(id: string): Promise<Project> {
    try {
      return projectSchema.parse(JSON.parse(await fs.readFile(this.projectPath(id), 'utf8')));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new AppError('This board could not be found.', 404);
      throw error;
    }
  }
  async save(input: Project, isNew = false): Promise<Project> {
    const project = projectSchema.parse(input);
    const previous = this.saves.get(project.id) ?? Promise.resolve();
    const next = previous
      .catch(() => {})
      .then(async () => {
        const destination = this.projectPath(project.id);
        if (!isNew) {
          const current = await this.read(project.id);
          if (current.revision !== project.revision)
            throw new AppError(
              'This board was changed in another tab. Export your current work, then reload to continue safely.',
              409,
            );
        }
        const saved = {
          ...project,
          revision: project.revision + 1,
          updatedAt: new Date().toISOString(),
        };
        const temp = `${destination}.${randomUUID()}.tmp`;
        await fs.writeFile(temp, JSON.stringify(saved, null, 2));
        if (!isNew) await fs.copyFile(destination, `${destination}.bak`);
        await fs.rename(temp, destination);
        return saved;
      });
    this.saves.set(project.id, next);
    try {
      return await next;
    } finally {
      if (this.saves.get(project.id) === next) this.saves.delete(project.id);
    }
  }
  async scanFolder(
    folder: string,
  ): Promise<{ assets: Asset[]; warnings: string[]; folder: string }> {
    if (!path.isAbsolute(folder))
      throw new AppError('Enter an absolute folder path, such as /Users/you/Pictures/sketches.');
    let root: string;
    try {
      root = await fs.realpath(folder);
      if (!(await fs.stat(root)).isDirectory()) throw new Error();
    } catch {
      throw new AppError('That folder could not be opened. Check the path and its permissions.');
    }
    const assets: Asset[] = [],
      warnings: string[] = [];
    let examined = 0,
      images = 0;
    const walk = async (dir: string, depth: number) => {
      if (depth > 8) {
        warnings.push('Skipped a folder more than 8 levels deep.');
        return;
      }
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (++examined > 5000 || images >= 500) {
          if (!warnings.includes('Folder limit reached (500 images / 5,000 entries).'))
            warnings.push('Folder limit reached (500 images / 5,000 entries).');
          return;
        }
        if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full, depth + 1);
          continue;
        }
        if (!entry.isFile() || !imageExt.test(entry.name)) continue;
        images++;
        try {
          const stat = await fs.stat(full);
          if (stat.size > MAX_IMAGE) throw new Error('Image is larger than 25 MB.');
          const stamp = `${stat.size}:${stat.mtimeMs}`,
            cached = this.folderImageCache.get(full);
          if (cached?.stamp === stamp) assets.push(cached.asset);
          else {
            const asset = await this.importImage(await fs.readFile(full), entry.name, full);
            this.folderImageCache.set(full, { stamp, asset });
            assets.push(asset);
          }
        } catch (error) {
          warnings.push(`${entry.name}: ${(error as Error).message}`);
        }
      }
    };
    await walk(root, 0);
    if (!images) warnings.push('No supported images found in this folder.');
    return { assets: [...new Map(assets.map((a) => [a.id, a])).values()], warnings, folder: root };
  }
  async export(project: Project) {
    const portable = {
      ...project,
      folders: [],
      assets: project.assets.map(({ source, ...asset }) => asset),
    };
    const diagnostics = analyze(portable).map((issue) => ({
      ...issue,
      ...decisionFor(issue, portable.reviews),
    }));
    const files: Record<string, Uint8Array> = {
      'project.json': strToU8(JSON.stringify(portable, null, 2)),
      'schema.json': strToU8(JSON.stringify(z.toJSONSchema(projectSchema), null, 2)),
      'flow.md': strToU8(flowDocument(portable)),
      'review.json': strToU8(
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            notice:
              'Conditions are natural language. Structural reachability does not prove runtime reachability. Accepted findings are user decisions, not proofs.',
            issues: diagnostics,
          },
          null,
          2,
        ),
      ),
      'READ-ME.md': strToU8(
        '# Sketchcoded project\n\nStart with flow.md for the organized specification, project.json for the canonical graph (schemaVersion 1), and schema.json for its JSON Schema. Screens reference assets; pins use normalized image coordinates; transitions connect a pin to a target screen or use dynamic back/dismiss history. A pin with kind=detail and detailTarget points to a supporting illustration; a missing kind means interaction. Dedicated detail screens have role=detail. These references never change app history or count as app paths or ways back. A screen with assetId=null is a planned frame that has not been drawn yet; an optional mobileAssetId is a second, mobile drawing of the same screen, and pins may carry a mobile position for it. ideas[] is the planning backlog: each idea may be assigned to a screen (screenId), placed as a pin (pinId) and lead to a screen (leadsTo). layout and viewport are presentation only.\n\nRead each pin description with all of its outgoing transitions: summary, condition, logic, context, fallback and navigation. Screens describe reusable views, not necessarily unique records. Entry screens model supported launch contexts. Screen roles describe intent, not automatic exceptions.\n\nreview.json contains structural findings and saved acceptances. Natural-language conditions are not executed or verified. Acknowledgments can be stale and must be reviewed again. Do not assume every branch is exhaustive or every structural return path is available at runtime.\n\nImages are relative to assets/. Source folder paths are excluded. Import this ZIP in Sketchcoded to continue editing.\n',
      ),
    };
    for (const asset of portable.assets) {
      try {
        files[`assets/${asset.file}`] = await fs.readFile(path.join(this.assetsDir, asset.file));
      } catch {
        throw new AppError(
          `The saved image ${asset.name} is missing from disk. Restore it before exporting.`,
          409,
        );
      }
    }
    return zipSync(files, { level: 1 });
  }
  async importBundle(bytes: Buffer) {
    let expanded = 0;
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(bytes, {
        filter: (file) => {
          expanded += file.originalSize;
          if (expanded > 250 * 1024 * 1024) throw new Error('Expanded project exceeds 250 MB.');
          return file.name === 'project.json' || /^assets\/[a-f0-9]{64}\.webp$/.test(file.name);
        },
      });
    } catch {
      throw new AppError('This ZIP is invalid or exceeds the 250 MB expanded limit.');
    }
    if (!files['project.json'])
      throw new AppError('The ZIP must contain a Sketchcoded project.json.');
    let decoded: unknown;
    try {
      decoded = JSON.parse(strFromU8(files['project.json']));
    } catch {
      throw new AppError('project.json is not valid JSON.');
    }
    const parsed = projectSchema.safeParse(decoded);
    if (!parsed.success)
      throw new AppError('The project format is invalid or uses an unsupported schema version.');
    const project = parsed.data;
    if (analyze(project).some((i) => i.severity === 'error'))
      throw new AppError('The project has broken graph references. Repair them before importing.');
    for (const asset of project.assets) {
      const data = files[`assets/${asset.file}`];
      if (!data || createHash('sha256').update(data).digest('hex') !== asset.file.slice(0, -5))
        throw new AppError(`Missing or damaged image: ${asset.name}`);
      const metadata = await sharp(data).metadata();
      if (metadata.width !== asset.width || metadata.height !== asset.height)
        throw new AppError(`Image dimensions do not match: ${asset.name}`);
    }
    for (const asset of project.assets)
      await fs
        .writeFile(path.join(this.assetsDir, asset.file), files[`assets/${asset.file}`], {
          flag: 'wx',
        })
        .catch((e) => {
          if (e.code !== 'EEXIST') throw e;
        });
    return this.save(
      {
        ...project,
        id: randomUUID(),
        name: `${project.name} (imported)`.slice(0, 200),
        revision: 0,
        folders: [],
        assets: project.assets.map(({ source, ...a }) => a),
      },
      true,
    );
  }
}
