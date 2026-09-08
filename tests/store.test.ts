import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer, type Server } from 'node:http';
import { strFromU8, unzipSync } from 'fflate';
import { Store } from '../server/store';
import { createApp } from '../server/app';
import { analyze } from '../shared/graph';
const sketch = (color = 'tan') =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect width="100" height="80" fill="${color}"/></svg>`,
  );
let root: string, store: Store;
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'drawcode-store-'));
  store = new Store(path.join(root, 'data'));
  await store.init();
});
afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});
describe('durable local projects', () => {
  it('boots with a working demo, normalized images and valid references', async () => {
    const [summary] = await store.list();
    const p = await store.read(summary.id);
    expect(p.screens).toHaveLength(4);
    expect(p.assets).toHaveLength(4);
    expect(analyze(p).filter((i) => i.severity === 'error')).toEqual([]);
    expect(await fs.readdir(store.assetsDir)).toHaveLength(4);
  });
  it('saves atomically, retains a backup, and reloads from a new store', async () => {
    const p = await store.create('Sketch');
    p.name = 'Renamed';
    const saved = await store.save(p);
    const next = new Store(store.root);
    expect((await next.read(p.id)).name).toBe('Renamed');
    expect(saved.revision).toBe(2);
    expect(
      JSON.parse(await fs.readFile(path.join(store.projectsDir, `${p.id}.json.bak`), 'utf8')).name,
    ).toBe('Sketch');
    expect((await fs.readdir(store.projectsDir)).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });
  it('rejects stale or simultaneous saves instead of overwriting another tab', async () => {
    const p = await store.create('Conflict');
    const outcomes = await Promise.allSettled([
      store.save({ ...p, name: 'First' }),
      store.save({ ...p, name: 'Second' }),
    ]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect((await store.read(p.id)).name).toBe('First');
  });
  it('copies source images and adds changed versions without replacing snapshots', async () => {
    const folder = path.join(root, 'sketches');
    await fs.mkdir(folder);
    await fs.writeFile(path.join(folder, 'home.svg'), sketch());
    const first = await store.scanFolder(folder);
    const again = await store.scanFolder(folder);
    expect(first.assets[0].id).toBe(again.assets[0].id);
    await fs.writeFile(path.join(folder, 'home.svg'), sketch('blue'));
    const second = await store.scanFolder(folder);
    expect(first.assets[0].id).not.toBe(second.assets[0].id);
    await fs.rm(folder, { recursive: true });
    expect(
      (await fs.readFile(path.join(store.assetsDir, first.assets[0].file))).length,
    ).toBeGreaterThan(0);
    await expect(store.scanFolder(folder)).rejects.toThrow('could not be opened');
  });
  it('skips symlinks and reports unreadable images', async () => {
    const folder = path.join(root, 'sketches');
    await fs.mkdir(folder);
    await fs.writeFile(path.join(folder, 'bad.png'), 'not a png');
    await fs.symlink(store.assetsDir, path.join(folder, 'linked'));
    const result = await store.scanFolder(folder);
    expect(result.assets).toEqual([]);
    expect(result.warnings[0]).toContain('could not be read');
  });
  it('exports all graph information and assets without local source paths', async () => {
    const [summary] = await store.list();
    const p = await store.read(summary.id);
    p.folders = ['/private/sketches'];
    p.assets[0].source = '/private/sketches/secret.png';
    const zip = await store.export(p),
      files = unzipSync(zip);
    const saved = JSON.parse(strFromU8(files['project.json']));
    expect(saved.folders).toEqual([]);
    expect(saved.assets[0].source).toBeUndefined();
    expect(saved.transitions).toEqual(p.transitions);
    expect(files['review.json']).toBeDefined();
    expect(files['schema.json']).toBeDefined();
    expect(strFromU8(files['flow.md'])).toContain('Context passed: conversationId, selectedUserId');
    const imported = await store.importBundle(Buffer.from(zip));
    expect(imported.id).not.toBe(p.id);
    expect(imported.pins).toEqual(p.pins);
    expect(imported.layout).toEqual(p.layout);
    expect(imported.assets).toHaveLength(4);
  });
  it('rejects incomplete imports and invalid IDs', async () => {
    await expect(store.importBundle(Buffer.from('bad zip'))).rejects.toThrow('ZIP');
    await expect(store.read('../../etc/passwd')).rejects.toThrow('Invalid project');
  });
  it('reports missing disk assets at export instead of creating a broken bundle', async () => {
    const [summary] = await store.list();
    const p = await store.read(summary.id);
    await fs.unlink(path.join(store.assetsDir, p.assets[0].file));
    await expect(store.export(p)).rejects.toThrow('missing from disk');
  });
});
describe('local API boundaries', () => {
  let server: Server, url: string;
  beforeEach(async () => {
    server = createServer(createApp(store));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    url = `http://127.0.0.1:${typeof address === 'object' && address?.port}`;
  });
  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
  it('requires a local client header for writes and rejects foreign origins', async () => {
    expect(
      (
        await fetch(`${url}/api/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"name":"No"}',
        })
      ).status,
    ).toBe(403);
    expect(
      (await fetch(`${url}/api/projects`, { headers: { Origin: 'https://example.com' } })).status,
    ).toBe(403);
  });
  it('validates project shapes and exposes readable local errors', async () => {
    const result = await fetch(`${url}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Drawcode-Client': 'local' },
      body: '{"name":""}',
    });
    expect(result.status).toBe(400);
    expect((await result.json()).error).toContain('Invalid project data');
  });
  it('supports a complete create, write and read cycle', async () => {
    const headers = { 'Content-Type': 'application/json', 'X-Drawcode-Client': 'local' };
    let response = await fetch(`${url}/api/projects`, {
      method: 'POST',
      headers,
      body: '{"name":"API board"}',
    });
    expect(response.status).toBe(201);
    const p = await response.json();
    p.name = 'Saved through API';
    response = await fetch(`${url}/api/projects/${p.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(p),
    });
    expect(response.ok).toBe(true);
    expect((await (await fetch(`${url}/api/projects/${p.id}`)).json()).name).toBe(
      'Saved through API',
    );
  });
});
