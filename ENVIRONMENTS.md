# Environment

Ensyncro runs as a **single environment** for now (multi-environment separation
is deferred — see PRD §8 / §10). The full deployment runbook, including the
variable list and Vercel/Neon setup, is in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Where configuration comes from

- **Local development:** a `.env` file at the repo root (copy from
  `.env.example`). Leave `DATABASE_URL` blank unless you point at a local
  Postgres — the API boots with a warning and `/api/health` reports
  `db: "not-configured"`.
- **Hosted (Vercel):** variables are set in the project settings;
  `DATABASE_URL` / `DIRECT_URL` are injected by the Neon integration.

## Backend variables

Validated at boot (`apps/api/src/config/env.validation.ts`): a wrong type/enum
throws; missing production secrets warn.

| Variable                                | Notes                                              |
| --------------------------------------- | -------------------------------------------------- |
| `APP_ENV`                               | `production`                                       |
| `NODE_ENV`                              | `development` locally; set by Vercel when hosted   |
| `API_PORT`                              | default `3000`                                     |
| `CORS_ORIGIN`                           | allowed origin(s), comma-separated                 |
| `DATABASE_URL` / `DIRECT_URL`           | injected by the Neon integration                   |
| `JWT_ACCESS_SECRET` / `_REFRESH_SECRET` | generate with `openssl rand -hex 32`               |
| `JWT_ACCESS_TTL` / `_REFRESH_TTL`       | seconds; default `900` / `1209600`                 |
| `OTP_MODE`                              | `mock` (real provider is phase 2)                  |

## Frontend variables

**Public** build-time values only (never secrets). `apps/web/scripts/set-env.mjs`
(via the `prebuild` hook) bakes them into the bundle before `ng build`:

| Variable       | Notes                              |
| -------------- | ---------------------------------- |
| `APP_ENV`      | `production`                       |
| `API_BASE_URL` | deployed API URL, including `/api` |

```bash
npm run web:build   # uses APP_ENV / API_BASE_URL from the environment
```
