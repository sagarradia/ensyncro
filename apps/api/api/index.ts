import type { IncomingMessage, ServerResponse } from 'http';
// Import the COMPILED Nest app (produced by `nest build` -> dist/) rather than
// the TypeScript source, so decorator metadata is intact. Vercel runs the
// build command (npm run build) before bundling this function, so dist/ exists.
import { bootstrapServer } from '../dist/serverless';

/**
 * Vercel serverless entrypoint for the NestJS API.
 * apps/api/vercel.json rewrites all requests here; the Express app (with its
 * global `api` prefix) then routes them — e.g. GET /api/health.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await bootstrapServer();
  app(req, res);
}
