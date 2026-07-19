# @ensyncro/api

NestJS 10 backend for Ensyncro (Node / TypeScript), with Prisma for PostgreSQL.

## Scripts

Run from the repo root (npm workspaces) or from this folder:

```bash
npm run api:dev            # nest start --watch — http://localhost:3000
npm run api:build          # nest build -> dist/
npm run prisma:generate    # generate the Prisma client
npm run prisma:migrate     # run a dev migration
```

## Endpoints

| Method | Path          | Description                                              |
| ------ | ------------- | ------------------------------------------------------- |
| GET    | `/api/health` | Liveness + environment + DB connectivity status         |

All routes are served under the global `api` prefix (see `src/main.ts`).

## Structure

```
src/
├── config/
│   └── configuration.ts   # runtime config sourced from env vars
├── health/                # HealthModule (/api/health, DB status check)
├── prisma/                # Global PrismaModule + PrismaService (lifecycle)
├── app.module.ts          # root module (feature modules register here)
└── main.ts                # bootstrap: prefix, CORS, global ValidationPipe
prisma/
└── schema.prisma          # DB schema; models added when feature work begins
```

## Database & environment

The connection string is **never hardcoded**. Prisma reads `DATABASE_URL`
(and `DIRECT_URL` for pooled migrations) from the environment — injected
per-environment (demo / staging / production) by Vercel's Neon integration.
Locally, leave it unset and the API boots with a warning; `/api/health`
reports `db: "not-configured"`. See the repo README for the full flow.
