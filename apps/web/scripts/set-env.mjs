/**
 * Generates src/environments/environment.ts at build time.
 *
 * Environment selection: first CLI arg  >  process.env.APP_ENV  >  'production'.
 * API base URL:          process.env.API_BASE_URL overrides the per-env default.
 *
 * This is how the frontend receives configuration on Vercel: set APP_ENV and/or
 * API_BASE_URL in the project's Environment Variables and this script bakes them
 * into the bundle during the build (Angular does not read process.env at runtime).
 * Runs automatically via the `prebuild` npm hook before `ng build`.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const DEFAULT_API_BASE_URL = {
  demo: 'https://demo-api.ensyncro.app/api',
  staging: 'https://staging-api.ensyncro.app/api',
  production: 'https://api.ensyncro.app/api',
};

const appEnv = (process.argv[2] || process.env.APP_ENV || 'production')
  .trim()
  .toLowerCase();

if (!Object.prototype.hasOwnProperty.call(DEFAULT_API_BASE_URL, appEnv)) {
  console.error(
    `set-env: invalid APP_ENV "${appEnv}" — expected demo | staging | production`,
  );
  process.exit(1);
}

const apiBaseUrl = process.env.API_BASE_URL?.trim() || DEFAULT_API_BASE_URL[appEnv];
const production = appEnv === 'production';

const contents = `// GENERATED FILE — do not edit by hand.
// Written by scripts/set-env.mjs at build time from APP_ENV / API_BASE_URL.
// See ENVIRONMENTS.md.
import type { Environment } from './environment.model';

export const environment: Environment = {
  appEnv: ${JSON.stringify(appEnv)},
  production: ${production},
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
};
`;

const target = resolve(here, '../src/environments/environment.ts');
writeFileSync(target, contents);
console.log(`set-env: wrote ${appEnv} environment (apiBaseUrl=${apiBaseUrl})`);
