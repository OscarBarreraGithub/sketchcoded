import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Bundled resources belong to this checkout, regardless of the launch directory.
export const repoRoot = fileURLToPath(new URL('../', import.meta.url));
export const repoPath = (...parts: string[]) => path.join(repoRoot, ...parts);
