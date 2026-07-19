# Environments

Ensyncro runs in three logical environments, each with its own database, secrets, and subdomain (PRD §8). The active environment is selected by the **`APP_ENV`** variable.

Each environment maps to a long-lived Git branch and a Vercel Custom Environment (Option A). See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full runbook, the per-environment variable matrix, and Vercel/Neon setup steps.

| Environment  | Git branch | Neon branch  |
| ------------ | ---------- | ------------ |
| `demo`       | `demo`     | `demo`       |
| `staging`    | `staging`  | `staging`    |
| `production` | `main`     | `production` |

| `APP_ENV`    | Purpose                                                      | Frontend origin              | Stats behaviour                                          | OTP     |
| ------------ | ----------------------------------------------------------- | ---------------------------- | ------------------------------------------------------- | ------- |
| `demo`       | Working demo, all 3 roles instantly accessible, seeded data | `demo.ensyncro.app`          | Seeded demo numbers, clearly not live                   | mock    |
| `staging`    | Real schema, real auth, seeded data — QA + pitch screenshots| `staging.ensyncro.app`       | Real numbers from the `platform_stats` pipeline         | mock    |
| `production` | Hardened, real OTP delivery (phase 2)                       | `ensyncro.app`               | Qualitative framing until thresholds, then live counts  | live    |

## Where configuration comes from

- **Local development**: from `.env` files at the **repo root** (see below).
- **Hosted (Vercel)**: variables are set per-environment in the Vercel project settings, and `DATABASE_URL` / `DIRECT_URL` are **injected automatically by the Neon integration** — never committed or pasted anywhere.

The four tracked templates document every variable:

```
.env.example              # base template + inline docs
.env.demo.example
.env.staging.example
.env.production.example
```

## Local setup

Copy a template to a real env file at the repo root (git-ignored). The backend
selects the file by `APP_ENV`, searching in this order:

```
.env.<APP_ENV>.local   →   .env.<APP_ENV>   →   .env.local   →   .env
```

```bash
# Default (demo):
cp .env.example .env

# Or an environment-specific file:
cp .env.demo.example .env.demo
```

Leave `DATABASE_URL` blank unless you're pointing at a local Postgres — the API
boots with a warning and `/api/health` reports `db: "not-configured"`.

> The API process runs from `apps/api`, but these files live at the repo root.
> `ConfigModule` resolves the monorepo root (nearest `package.json` with
> `workspaces`) so root env files load correctly regardless of the workspace.

## Backend variables

| Variable                              | Required        | Notes                                                              |
| ------------------------------------- | --------------- | ------------------------------------------------------------------ |
| `APP_ENV`                             | yes             | `demo` \| `staging` \| `production` — selects environment behaviour |
| `NODE_ENV`                            | yes             | `development` \| `production` \| `test`                            |
| `API_PORT`                            | no (def 3000)   | Port the API listens on                                            |
| `CORS_ORIGIN`                         | no              | Comma-separated allowed origins                                    |
| `DATABASE_URL`                        | prod (injected) | Postgres URL — injected by Vercel's Neon integration               |
| `DIRECT_URL`                          | prod (injected) | Non-pooled URL for Prisma migrations — also injected by Neon       |
| `JWT_ACCESS_SECRET` / `_REFRESH_SECRET` | prod          | Generate strong, unique values per environment                     |
| `JWT_ACCESS_TTL` / `_REFRESH_TTL`     | no (defaults)   | Token lifetimes (seconds)                                          |
| `OTP_MODE`                            | no              | `mock` (demo/staging) \| `live` (production)                       |

### Validation

At boot the API validates the environment (`src/config/env.validation.ts`,
wired into `ConfigModule`):

- **Throws immediately** if a variable has the wrong type or an invalid enum
  (e.g. `APP_ENV=foo`, or a non-numeric `API_PORT`).
- **Warns** when production-critical values (`DATABASE_URL`, JWT secrets) are
  missing while `APP_ENV=production`. These become hard requirements once the
  features that depend on them are built.

## Frontend variables

The Angular app ships **public** build-time values only (never secrets). Angular
does not read `process.env` at runtime, so `apps/web/scripts/set-env.mjs`
(wired to the `prebuild` hook) generates `src/environments/environment.ts` from
environment variables before `ng build`:

| Variable       | Purpose                                                 | Default (per `APP_ENV`)                |
| -------------- | ------------------------------------------------------- | -------------------------------------- |
| `APP_ENV`      | `demo` \| `staging` \| `production`                     | `production`                           |
| `API_BASE_URL` | Overrides the API base URL for the selected environment | demo → `https://demo-api.ensyncro.app/api`, staging → `https://staging-api.ensyncro.app/api`, production → `https://api.ensyncro.app/api` |

On **Vercel**, set `APP_ENV` and (optionally) `API_BASE_URL` in the frontend
project's Environment Variables — `prebuild` bakes them into the bundle during
the build. Point `API_BASE_URL` at the deployed API for that environment.

```bash
npm run web:build             # APP_ENV / API_BASE_URL from the environment
npm run web:build:demo        # forces APP_ENV=demo
npm run web:build:staging     # forces APP_ENV=staging
npm run web:build:production  # forces APP_ENV=production
```
