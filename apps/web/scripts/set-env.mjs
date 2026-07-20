/**
 * Generates src/environments/environment.ts at build time (single environment).
 *
 * Ensyncro runs one environment (production). The only injectable value is the
 * API base URL: set API_BASE_URL in Vercel to override the default. Angular does
 * not read process.env at runtime, so this bakes it into the bundle. Runs via
 * the `prebuild` npm hook before `ng build`. See ENVIRONMENTS.md.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const DEFAULT_API_BASE_URL = 'https://api.ensyncro.app/api';
const apiBaseUrl = process.env.API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

const contents = `// GENERATED FILE — do not edit by hand.
// Written by scripts/set-env.mjs at build time (API_BASE_URL). See ENVIRONMENTS.md.
import type { Environment } from './environment.model';

export const environment: Environment = {
  appEnv: 'production',
  production: true,
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
};
`;

const target = resolve(here, '../src/environments/environment.ts');
writeFileSync(target, contents);
console.log(`set-env: wrote production environment (apiBaseUrl=${apiBaseUrl})`);
