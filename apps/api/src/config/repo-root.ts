import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

/**
 * Walks up from `start` to find the monorepo root — the nearest ancestor
 * whose package.json declares npm `workspaces`. Needed because the API
 * process runs from `apps/api`, but the local `.env` files live at the
 * repo root (they document variables for the whole monorepo).
 *
 * Falls back to `start` if no workspace root is found (e.g. when env vars
 * are injected directly by the host, as on Vercel, and no file is needed).
 */
export function findRepoRoot(start: string = process.cwd()): string {
  let dir = resolve(start);

  for (;;) {
    const pkgPath = resolve(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if (pkg.workspaces) return dir;
      } catch {
        // Unreadable/invalid package.json — keep walking up.
      }
    }

    const parent = dirname(dir);
    if (parent === dir) return start; // reached filesystem root
    dir = parent;
  }
}
