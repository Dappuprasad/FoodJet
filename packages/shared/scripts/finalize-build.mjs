import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The package root has no "type" field, so Node reads .js as CommonJS. These
 * per-directory markers tell it that dist/esm is ESM while dist/cjs is not —
 * which is what lets the API (CommonJS/NestJS) and the web app (ESM/Vite)
 * consume the same source without either of them special-casing the other.
 */
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

for (const [dir, type] of [
  ['cjs', 'commonjs'],
  ['esm', 'module'],
]) {
  const target = join(dist, dir);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'package.json'), `${JSON.stringify({ type }, null, 2)}\n`);
}

console.log('wrote dist/cjs/package.json and dist/esm/package.json');
