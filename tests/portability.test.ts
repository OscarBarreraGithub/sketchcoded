import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { strFromU8, unzipSync } from 'fflate';
import { serverConfig } from '../server/config';
import { repoPath } from '../server/paths';
import { skillIds } from '../shared/agent';
import { demoArt, demoProject } from './fixtures/little-chat';

describe('portable startup', () => {
  it('keeps default storage with the checkout and resolves explicit paths from the caller', () => {
    const cwd = path.join(os.tmpdir(), 'another directory');
    expect(serverConfig([], {}, cwd).dataDir).toBe(repoPath('.drawcode'));
    expect(serverConfig(['--data-dir', 'my boards'], {}, cwd).dataDir).toBe(
      path.join(cwd, 'my boards'),
    );
    expect(serverConfig(['--port', '0', '--production'], { PORT: '5173' })).toMatchObject({
      port: 0,
      production: true,
    });
    expect(
      serverConfig([], { PORT: '5180', DRAWCODE_DATA_DIR: 'data', NODE_ENV: 'production' }, cwd),
    ).toMatchObject({ port: 5180, dataDir: path.join(cwd, 'data'), production: true });
    for (const port of ['-1', '65536', '1.5', '5173junk', ''])
      expect(() => serverConfig(['--port', port], {})).toThrow();
    expect(() => serverConfig(['--data-dir', ''], {})).toThrow('cannot be empty');
  });

  it('serves the app, live instructions and complete portable exports from another directory', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'sketchcoded new user '));
    // Exercise the real entry point without relying on shell syntax, a fixed port or user data.
    const child = spawn(
      process.execPath,
      [
        '--import',
        import.meta.resolve('tsx'),
        repoPath('server/index.ts'),
        '--port',
        '0',
        '--data-dir',
        'boards with spaces',
      ],
      {
        cwd,
        env: { ...process.env, NODE_ENV: 'development' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const exited = once(child, 'exit');
    let output = '';
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Startup timed out: ${output}`)), 30000);
        const stopWaiting = () => clearTimeout(timeout);
        child.once('error', (error) => {
          stopWaiting();
          reject(error);
        });
        child.once('exit', (code) => {
          stopWaiting();
          reject(new Error(`Exited ${code}: ${output}`));
        });
        child.stderr.on('data', (chunk) => {
          output += chunk;
        });
        child.stdout.on('data', (chunk) => {
          output += chunk;
          const address = output.match(/ready → (http:\/\/127\.0\.0\.1:\d+)/)?.[1];
          if (address) {
            stopWaiting();
            resolve(address);
          }
        });
      });
      expect((await fetch(url)).status).toBe(200);
      expect(await (await fetch(`${url}/api/checklist.md`)).text()).toContain('# Build checklist');
      for (const skill of skillIds) {
        const response = await fetch(`${url}/api/skills/${skill}.md`);
        expect(response.status).toBe(200);
        expect(await response.text()).toBe(
          await readFile(repoPath('docs/skills', `${skill}.md`), 'utf8'),
        );
      }
      // A board with sketches, built through the API as a user's agent would build it.
      const write = { 'Content-Type': 'application/json', 'X-Drawcode-Client': 'local' };
      const made = await (
        await fetch(`${url}/api/projects`, {
          method: 'POST',
          headers: write,
          body: JSON.stringify({ name: 'Little chat' }),
        })
      ).json();
      const form = new FormData();
      for (const [file, svg] of Object.entries(demoArt))
        form.append('images', new Blob([svg], { type: 'image/svg+xml' }), file);
      const { assets } = await (
        await fetch(`${url}/api/images`, {
          method: 'POST',
          headers: { 'X-Drawcode-Client': 'local' },
          body: form,
        })
      ).json();
      const project = await (
        await fetch(`${url}/api/projects/${made.id}`, {
          method: 'PUT',
          headers: write,
          body: JSON.stringify({
            ...demoProject(assets, made.id),
            name: 'Little chat',
            revision: made.revision,
          }),
        })
      ).json();
      const brief = await (
        await fetch(
          `${url}/api/projects/${project.id}/brief?view=screen-editor&screen=${project.screens[0].id}`,
        )
      ).text();
      expect(brief).toContain(`${url}/api/checklist.md`);
      expect(brief).toContain(`${url}/assets/`);
      const response = await fetch(`${url}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Drawcode-Client': 'local' },
        body: JSON.stringify(project),
      });
      expect(response.status).toBe(200);
      const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
      expect(strFromU8(files['BUILD-CHECKLIST.md'])).toContain('# Build checklist');
      for (const skill of skillIds) expect(files[`skills/${skill}.md`]).toBeDefined();
      expect(JSON.parse(strFromU8(files['project.json'])).folders).toEqual([]);
      expect(strFromU8(files['project.json'])).not.toContain(cwd);
      expect(
        JSON.parse(
          await readFile(
            path.join(cwd, 'boards with spaces/projects', `${project.id}.json`),
            'utf8',
          ),
        ).id,
      ).toBe(project.id);
    } finally {
      if (child.exitCode === null) child.kill('SIGTERM');
      const timeout = setTimeout(() => child.kill('SIGKILL'), 10000);
      try {
        await exited;
      } finally {
        clearTimeout(timeout);
      }
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60000);
});
