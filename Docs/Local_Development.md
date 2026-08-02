# Local development

The hosted app runs on **Vercel** (serverless API + static web) against a
**Neon** Postgres database. You don't need any of that to develop locally — this
doc covers running the stack on your machine, optionally with a local database.

## Prerequisites

- Node.js ≥ 20
- Docker Desktop (only if you want the local database)

Install dependencies once from the repo root:

```bash
npm install
```

## Option A — develop against a local Postgres (offline)

1. **Start the database** (Postgres 16 in a container):

   ```bash
   npm run db:up          # start in the background
   npm run db:down        # stop (data is kept)
   npm run db:down -- -v  # stop AND wipe the data volume
   ```

2. **Create a `.env`** at the repo root (copy from `.env.example`) with:

   ```
   APP_ENV=demo
   DATABASE_URL=postgresql://ensyncro:ensyncro@localhost:5432/ensyncro?schema=public
   DIRECT_URL=postgresql://ensyncro:ensyncro@localhost:5432/ensyncro?schema=public
   JWT_ACCESS_SECRET=dev-access-secret
   JWT_REFRESH_SECRET=dev-refresh-secret
   ```

3. **Apply the schema** (runs all Prisma migrations against the local DB):

   ```bash
   npm run prisma:deploy --workspace @ensyncro/api
   ```

   Optionally seed demo data / an admin:

   ```bash
   npm run seed:demo --workspace @ensyncro/api
   npm run admin:bootstrap --workspace @ensyncro/api
   ```

## Option B — develop against the shared Neon database

Skip Docker; put the Neon `DATABASE_URL` / `DIRECT_URL` in your `.env` instead.
(Changes hit the shared data, so prefer Option A for anything destructive.)

## Run the apps

```bash
npm run api:dev   # NestJS on http://localhost:3000  (health: /api/health)
npm run web:dev   # Angular on http://localhost:4200
```

## Everyday commands (from the repo root)

| Command | What it does |
|---|---|
| `npm run build` | Build both apps |
| `npm run test` | Run the API unit tests (Jest) |
| `npm run lint` | Lint both workspaces |
| `npm run db:up` / `db:down` | Start / stop local Postgres |

> On Windows PowerShell, if `npm run …` is blocked by the execution policy, either
> use `npm.cmd run …` or allow local scripts once with
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
