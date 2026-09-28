import path from 'node:path';
import { parseArgs } from 'node:util';
import { repoPath } from './paths';

export function serverConfig(
  args = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
) {
  const { values } = parseArgs({
    args,
    options: {
      port: { type: 'string' },
      'data-dir': { type: 'string' },
      production: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  const rawPort = values.port ?? env.PORT ?? '5173';
  if (!/^\d+$/.test(rawPort) || Number(rawPort) > 65535)
    throw new Error('Port must be an integer from 0 to 65535; use 0 to choose an available port.');
  const dataDir = values['data-dir'] ?? env.DRAWCODE_DATA_DIR;
  if (dataDir !== undefined && !dataDir.trim()) throw new Error('Data directory cannot be empty.');
  return {
    port: Number(rawPort),
    dataDir: dataDir === undefined ? repoPath('.drawcode') : path.resolve(cwd, dataDir),
    production: values.production ?? env.NODE_ENV === 'production',
    help: values.help ?? false,
  };
}

export const serverHelp = `Sketchcoded — local sketch flow designer

  npm run dev -- --port 5180 --data-dir "./my boards"
  npm run build
  npm start -- --port 5180 --data-dir "./my boards"

Options:
  --port NUMBER    Listening port (default: 5173; 0 chooses an available port)
  --data-dir PATH  Project storage (default: .drawcode inside this checkout)
  --production    Serve the built frontend; npm start sets this automatically
  --help, -h      Show this help

PORT, DRAWCODE_DATA_DIR and NODE_ENV are also supported. Flags take precedence.
An explicit relative data directory is resolved from the launch directory.
The server accepts local connections only. No account or API key is required.
`;
