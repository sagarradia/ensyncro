/**
 * Default environment (used by `ng serve` without a named configuration).
 * Mirrors the demo environment. The Angular build swaps this file out for
 * environment.demo.ts / environment.staging.ts / environment.production.ts
 * via fileReplacements in angular.json.
 *
 * NOTE: these are FRONTEND build-time values only (public API base URL, etc.).
 * No secrets or DB connection strings ever live in the frontend bundle.
 */
export const environment = {
  appEnv: 'demo' as const,
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
};
