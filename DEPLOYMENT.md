# Deployment & environment — runbook

Ensyncro runs as a **single environment** for now. Multi-environment
(demo / staging / production separation) is **deferred** until real usage
justifies the added complexity — see PRD §8 and the decisions log (§10).

> **Secrets are never committed.** This file documents structure and
> placeholders only. Real values live in the Vercel dashboard (DB connection
> strings are injected by the Neon integration). The tracked `.env*.example`
> files are templates.

## Layout

| Piece | Value |
| ----- | ----- |
| Git branch | `main` (the only long-lived branch) |
| Frontend (Vercel project) | `ensyncro-web` — Root Directory `apps/web` |
| Backend (Vercel project) | `ensyncro-api` — Root Directory `apps/api` |
| Database | one Neon project, its default `main` branch |

Each app is its own Vercel project, both deploying from `main`.

## Environment variables (set once, in each Vercel project)

### `ensyncro-api`

| Variable                                | Value                                   |
| --------------------------------------- | --------------------------------------- |
| `APP_ENV`                               | `production`                            |
| `CORS_ORIGIN`                           | the deployed web URL                    |
| `DATABASE_URL`                          | pooled URL — **injected** by the Neon integration |
| `DIRECT_URL`                            | unpooled URL for migrations — **set manually** (see Database migrations) |
| `JWT_ACCESS_SECRET` / `_REFRESH_SECRET` | «unique random values»                  |
| `JWT_ACCESS_TTL` / `_REFRESH_TTL`       | `900` / `1209600`                       |
| `OTP_MODE`                              | `mock` (real provider is phase 2)       |

Generate JWT secrets with `openssl rand -hex 32`. `NODE_ENV` is set to
`production` automatically by Vercel — do not add it.

### `ensyncro-web`

| Variable       | Value                                |
| -------------- | ------------------------------------ |
| `APP_ENV`      | `production`                         |
| `API_BASE_URL` | the deployed API URL, incl. `/api`   |

These are **public** build-time values (baked into the bundle by
`scripts/set-env.mjs` via the `prebuild` hook) — never secrets.

## One-time setup

1. **Neon:** one project; the Vercel–Neon integration on `ensyncro-api`
   injects `DATABASE_URL` (pooled). Set `DIRECT_URL` (unpooled) manually —
   see [Database migrations](#database-migrations).
2. **Vercel (each app):** create the project from the GitHub repo, set the
   **Root Directory** (`apps/web` / `apps/api`), set **Framework Preset =
   Other** and **Build Command = `npm run build`** (so the app's own build,
   incl. `prebuild`, runs — not a raw `ng build`), and add the variables above.
3. **Production Branch = `main`** (Settings → Git).

## Database migrations

Prisma migrations live in `apps/api/prisma/migrations/` and are applied with
`prisma migrate deploy` (`npm run prisma:deploy`).

**Gotcha — you can't read the DB connection string back from Vercel.** Env vars
added to a Vercel project are stored as **Sensitive (write-only)**: `vercel env
pull` returns *stubs*, not the real values. So you cannot recover the production
connection string that way, and Prisma's `directUrl` needs the **unpooled**
endpoint. Get it from **Neon** instead (capture to a shell variable — never
print it):

```bash
# from apps/api
DBURL=$(neonctl connection-string main --project-id dry-bonus-70315470 --pooled false)
DATABASE_URL="$DBURL" DIRECT_URL="$DBURL" npx prisma migrate deploy
unset DBURL
```

`DIRECT_URL` is also set as a Vercel env var on `ensyncro-api` (the unpooled
string) so a migration run from the Vercel build context wouldn't need this.
**Caveat:** it's a manual copy — if the Neon password is rotated, the integration
auto-updates `DATABASE_URL`/`DATABASE_URL_UNPOOLED` but **not** the hand-set
`DIRECT_URL`; re-set it after any rotation (pipe the new string to `vercel env
add DIRECT_URL production --value "$DBURL"`).

## Deploying

Push to `main` → both projects deploy. Note: Vercel **skips builds with no
changes in the project's Root Directory**, so an *empty* commit will be
canceled at 0ms — trigger a real deploy with an actual change, or use the
dashboard **Redeploy** button / `vercel redeploy`.

## Verification

- **API:** `GET https://<api-url>/api/health` → `{ "status":"ok",
  "env":"production", "db":"up" }`. The initial schema (auth tables) is migrated;
  `db:"up"` = connectivity.
- **Web:** the page renders and the env badge shows `production`.
- The web app calls the correct API (`API_BASE_URL`).

## How config flows

- **Web:** `scripts/set-env.mjs` (`prebuild`) reads `APP_ENV` / `API_BASE_URL`
  at build time → `src/environments/environment.ts`. See [ENVIRONMENTS.md](ENVIRONMENTS.md).
- **API:** `APP_ENV` is validated at boot (`src/config/env.validation.ts`) and
  surfaced at `/api/health`.
