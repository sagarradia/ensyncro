# Deployment & environments — runbook

Ensyncro uses **Option A**: long-lived Git branches, each mapped to a **Vercel
Custom Environment**, each backed by its own **Neon database branch**. The
application code is identical across environments — behaviour differs only by the
`APP_ENV` variable and the per-environment values injected at build/runtime.

> **Secrets are never committed.** This file documents *structure and
> placeholders only*. Real values live in the Vercel dashboard (and are injected
> from the Neon integration). The tracked `.env.*.example` files are templates.

## 1. Environment ↔ branch ↔ Neon mapping

| Environment    | Git branch | Vercel environment   | Web domain               | API domain                   | Neon branch  |
| -------------- | ---------- | -------------------- | ------------------------ | ---------------------------- | ------------ |
| **production** | `main`     | Production           | `ensyncro.app`           | `api.ensyncro.app`           | `production` |
| **staging**    | `staging`  | Custom → `staging`   | `staging.ensyncro.app`   | `staging-api.ensyncro.app`   | `staging`    |
| **demo**       | `demo`     | Custom → `demo`      | `demo.ensyncro.app`      | `demo-api.ensyncro.app`      | `demo`       |

Domains above are the assumed scheme — adjust to the real domains you attach in
Vercel. The two apps deploy as **separate Vercel projects** (`apps/web`,
`apps/api`), each configured with all three environments.

## 2. Branch strategy

- `main` is the trunk and the **production** source of truth (protect it: PRs +
  review before merge).
- `staging` and `demo` are **long-lived deployment branches**. Promote by
  fast-forwarding from `main`:

  ```bash
  git switch staging && git merge --ff-only main && git push
  git switch demo    && git merge --ff-only main && git push
  git switch main
  ```

- Each push to a mapped branch triggers a deploy to its Vercel environment.
- (Optional stricter flow to adopt later: land changes on `staging` for QA
  first, then promote `staging` → `main` for production.)

## 3. Environment variable matrix

Set these in each Vercel project under the matching **Environment**. Values shown
as «…» are placeholders you fill in the dashboard; "injected" values come from
the Neon integration and must not be set by hand.

### API project (`apps/api`)

| Variable             | demo                          | staging                          | production                   |
| -------------------- | ----------------------------- | -------------------------------- | ---------------------------- |
| `APP_ENV`            | `demo`                        | `staging`                        | `production`                 |
| `NODE_ENV`           | `production`                  | `production`                     | `production`                 |
| `API_PORT`           | `3000`                        | `3000`                           | `3000`                       |
| `CORS_ORIGIN`        | `https://demo.ensyncro.app`   | `https://staging.ensyncro.app`   | `https://ensyncro.app`       |
| `DATABASE_URL`       | injected (Neon `demo`)        | injected (Neon `staging`)        | injected (Neon `production`) |
| `DIRECT_URL`         | injected (Neon `demo`)        | injected (Neon `staging`)        | injected (Neon `production`) |
| `JWT_ACCESS_SECRET`  | «unique per env»              | «unique per env»                 | «unique per env»             |
| `JWT_REFRESH_SECRET` | «unique per env»              | «unique per env»                 | «unique per env»             |
| `JWT_ACCESS_TTL`     | `900`                         | `900`                            | `900`                        |
| `JWT_REFRESH_TTL`    | `1209600`                     | `1209600`                        | `1209600`                    |
| `OTP_MODE`           | `mock`                        | `mock`                           | `live`                       |

### Web project (`apps/web`)

| Variable       | demo                                  | staging                                  | production                        |
| -------------- | ------------------------------------- | ---------------------------------------- | --------------------------------- |
| `APP_ENV`      | `demo`                                | `staging`                                | `production`                      |
| `API_BASE_URL` | `https://demo-api.ensyncro.app/api`   | `https://staging-api.ensyncro.app/api`   | `https://api.ensyncro.app/api`    |

> **Generate JWT secrets uniquely per environment** — never reuse across envs:
> ```bash
> openssl rand -hex 32   # run once per secret, per environment
> ```
> `OTP_MODE=live` requires a real SMS/email provider (phase 2, PRD §9); until
> then production OTP is not delivered — keep production gated accordingly.

## 4. One-time setup

### 4a. Neon (database branching)

1. Create a Neon project for Ensyncro. Its default branch is `production`.
2. Create branches `staging` and `demo` off `production` (Neon → Branches).
3. Install the **Vercel ↔ Neon integration**; connect it to both the API Vercel
   project and each environment, mapping:
   - Vercel Production → Neon `production`
   - Vercel `staging`   → Neon `staging`
   - Vercel `demo`      → Neon `demo`
4. Confirm the integration injects `DATABASE_URL` (pooled) and `DIRECT_URL`
   (unpooled, for migrations) into each environment.

### 4b. Vercel (two projects, custom environments)

For **each** app (`apps/api`, then `apps/web`):

1. Create a Vercel project from the GitHub repo `sagarradia/ensyncro`.
2. Set **Root Directory** → `apps/api` (API) or `apps/web` (web). Build/output
   come from each app's `vercel.json` / package scripts.
3. Under **Settings → Environments**, create Custom Environments `staging` and
   `demo`; keep the built-in **Production**. Track branches:
   - Production ← `main`
   - `staging`  ← `staging` branch
   - `demo`     ← `demo` branch
4. Add the variables from §3 to each environment (API vs web tables).
5. Attach the domains from §1 to each environment.
6. Redeploy each branch and verify (§5).

## 5. Per-environment verification

After a deploy, for each environment:

- **API**: `GET https://<api-domain>/api/health` →
  `{ "status": "ok", "env": "<demo|staging|production>", "db": "up" }`.
  `env` must match the environment and `db` must be `up` (not `not-configured`)
  once Neon is connected.
- **Web**: the page renders and the environment badge shows the correct label
  (`demo` / `staging` / `production`) — it reflects the injected `APP_ENV`, so a
  wrong badge means the env var is missing.
- Confirm the web app calls the correct API (`API_BASE_URL`) for that env.

## 6. How `APP_ENV` flows

- **Web**: `scripts/set-env.mjs` (via the `prebuild` hook) reads `APP_ENV` /
  `API_BASE_URL` at build time and generates `src/environments/environment.ts`,
  which drives the badge and API base URL. See [ENVIRONMENTS.md](ENVIRONMENTS.md).
- **API**: `APP_ENV` is read + validated at boot (`src/config/env.validation.ts`)
  and surfaced at `/api/health`.

Because config is build/boot-time, **the environment is only as separated as the
Vercel env vars + Neon branches are** — this runbook is the source of truth for
what to set where.
