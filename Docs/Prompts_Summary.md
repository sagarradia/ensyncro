# Ensyncro — prompts summary

A running log of prompts/decisions from this chat and from Claude Code, in execution order. Claude Code should append its own entries here after each executed + pushed change (see instructions at the bottom).

## Chat (planning, PRD, deck)

| # | Prompt / decision | Outcome |
|---|---|---|
| 1 | Initial brief: build Ensyncro, a funding marketplace (demo/staging/prod), Angular + PostgreSQL, app included, high security, non-coder workflow | Scoped tool split: Claude Code for build, this chat for planning/docs/deck |
| 2 | "do you think claude or kimi would fit better" | Compared honestly; stuck with Claude for the integrated chat + Claude Code workflow |
| 3 | PRD outline + wireframes | PRD v1 drafted; homepage wireframe + palette options shown |
| 4 | Connect to GitHub for auto commit/push/deploy | No GitHub MCP connector available; Vercel connector is read-only. Recommended Claude Code (real git credentials) + Vercel auto-deploy-on-push instead |
| 5 | Move to Claude Desktop / Claude Code | Handoff plan given: PRD.md into repo, first scaffold prompt provided |
| 6 | Keep documents in doc, excel, ppt | Generated Ensyncro_PRD_v1.docx, Ensyncro_Execution_Plan.xlsx, Ensyncro_Pitch_Deck.pptx (+ kept .md as fast-editing source) |
| 7 | Stats question: demo vs staging vs prod data | Demo = seeded, Staging = real live data, Production = threshold-gated (25+ founders, 10+ investors) before showing real counts |
| 8 | Messaging in v1? | Recommended against full messaging for v1; "Request intro" action instead. Full messaging deferred to phase 2 |
| 9 | Palette decision | Locked: Charcoal green (#2C2C2A / #1F6D3B / #F6F5F1 / #FFFFFF / #E1DFD6 / #7A7870) |
| 10 | Maintain a running Prompts_Summary doc across chat + Claude Code | This file created |

## Claude Code (build, commits, pushes)

| # | Date | Prompt given to Claude Code | Commit / PR | Status |
|---|---|---|---|---|
| 1 | 2026-07-19 | Scaffold monorepo skeleton: Angular + NestJS + Prisma, env config for demo/staging/production, git init, README | `6dc5415` | Pushed |
| 2 | 2026-07-19 | Maintain this Prompts_Summary log; append a row per commit within the same commit | `753ba30` | Pushed |
| 3 | 2026-07-19 | Document the "same commit, fill hashes at push" logging convention | `1f6a6a0` | Pushed |
| 4 | 2026-07-19 | Init git repo, connect GitHub remote (origin), commit and push | [`origin/main`](https://github.com/sagarradia/ensyncro/tree/main) | Pushed |
| 5 | 2026-07-19 | Scaffold Angular frontend app: root shell, home page, routing, favicon, .editorconfig; verified `ng build` | `0388a49` | Pushed |
| 6 | 2026-07-19 | Scaffold NestJS backend app: HealthModule (/api/health + DB status), tsconfig.build, validation deps, placeholder Prisma model; verified build + live health request | `2ff6f74` | Pushed |
| 7 | 2026-07-19 | Plan task #4 — Env config for demo/staging/production: boot-time env validation (fail-fast + prod warnings), monorepo-root .env loading, ENVIRONMENTS.md; add execution plan to repo | `a31c4d4` | Pushed |
| 8 | 2026-07-19 | Plan task #5 — Auth: signup, login, JWT, mock OTP. Minimal User/OtpCode/RefreshToken models (replaces ScaffoldProbe), AuthModule (bcrypt, JWT access + revocable refresh, mock OTP), guard + /me; verified build, routes, validation/guard, security primitives (DB round-trip pending a database) | `8da08a8` | Pushed |
| 9 | 2026-07-19 | Fix Vercel build TS2305 (@prisma/client missing Role/OtpChannel): confirmed enums in schema; add prisma generate via postinstall + prebuild in apps/api; verified from a clean state with npm run api:build | `c978a3c` | Pushed |
| 10 | 2026-07-19 | Confirm frontend is its own app (apps/web) and make it independently deployable: add apps/web/vercel.json (static SPA, outputDirectory dist/web/browser, SPA rewrite, asset caching) + README deploy notes | `d8612a0` | Pushed |
| 11 | 2026-07-19 | Fix blank deployed frontend (NG0908): add zone.js polyfill in angular.json; wire build-time env injection (scripts/set-env.mjs via prebuild, APP_ENV/API_BASE_URL) replacing fileReplacements, add Environment type; verified render + no console errors in browser + injected URL in bundle | `6eb30d2` | Pushed |
| 12 | 2026-07-19 | Option A environment separation: add DEPLOYMENT.md runbook (branch↔Vercel-env↔Neon mapping, env matrix with placeholders/no secrets, setup + verification steps), link from ENVIRONMENTS.md, and create long-lived demo + staging branches | `21ca2c2` | Pushed |
| 13 | 2026-07-19 | Update DEPLOYMENT.md to reflect real Neon setup: production maps to Neon `main` branch (kept, not renamed) in the Vercel-managed project neon-bronze-pocket; staging/demo branches added | `660acd2` | Pushed |
| 14 | 2026-07-20 | Simplify to a single environment: delete demo+staging git branches (local+origin); rewrite DEPLOYMENT.md + ENVIRONMENTS.md for one branch/one Vercel project per app/one Neon DB; update PRD §8 + §10 (multi-env deferred); remove orphaned demo-scoped Vercel env var (no custom envs existed). Neon branch/project deletions handed to user (permanent-deletion policy); production-branch dashboard check flagged | `5526fba` | Pushed |
| 15 | 2026-07-20 | (1) Investigate duplicate Vercel API projects — `ensyncro-api` is the real one (repo-linked, full Neon integration env vars, prod URL, Prisma-fix history); `ensyncro-api-new` is redundant (zero env vars/no DB) — user deletes in dashboard. (2) Strip multi-env scaffolding: remove build:demo/staging(/production) scripts, production-only set-env.mjs; verified `npm run build`. (3) Production Branch not exposed by CLI (`vercel project inspect` shows framework/root but no git branch; REST API 403) — user must check dashboard | `2398627` | Pushed |
| 16 | 2026-07-20 | (1) Delete redundant ensyncro-api-new — permanent-deletion policy, gave `vercel project rm` command instead. (2) Set ensyncro-api Framework→Other + Build Command `npm run build` via `vercel project update`; verified prisma generate runs via prebuild (clean build); add NestJS serverless entrypoint for Vercel (api/index.ts + src/serverless.ts + configure-app.ts + apps/api/vercel.json), verified /api/health boots via the serverless app. (3) No CLI flag for Git Production Branch (project update/inspect help + REST 403) — dashboard only | `899d4ba` | Pushed |
| 17 | 2026-07-20 | Add APP_ENV=production to ensyncro-api Production via CLI (was absent — no `rm` needed; that's why /api/health showed demo). Found the serverless deploy was failing with "No Output Directory named public" (Framework=Other expects static output) — fix apps/api/vercel.json (framework null, buildCommand, outputDirectory=public) + add public/.gitkeep; push to trigger a production redeploy and confirm env: production | `7c3bc7c` | Pushed |
| 18 | 2026-07-20 | Wire frontend→API: add API_BASE_URL=https://ensyncro-api.vercel.app/api to ensyncro-web Production (was missing); also set CORS_ORIGIN=https://ensyncro-web.vercel.app on ensyncro-api (was defaulting to localhost:4200, would have blocked browser calls). Redeployed both to production; verified the deployed bundle bakes the API URL and a cross-origin fetch from ensyncro-web.vercel.app → /api/health returns 200 (env: production, db: up). CLI/dashboard work — no repo change | `8984820` | Pushed |
| 19 | 2026-07-20 | Day 2 kickoff: (1) generate + set JWT_ACCESS_SECRET/JWT_REFRESH_SECRET on ensyncro-api Production (openssl piped straight to `vercel env add` — values never printed). (2) Task #10 DB migration: create initial Prisma migration (offline `migrate diff`; users/otp_codes/refresh_tokens + enums) and `migrate deploy` to the prod Neon DB (used neonctl unpooled connection string since Vercel Sensitive vars aren't readable); verified tables exist via a count query. (3) Redeploy ensyncro-api; ran full auth e2e against prod — signup → verify both OTPs → ACTIVE → login returns a valid JWT (role FOUNDER) + refresh token. Commit the migration files | `3ccca37` | Pushed |

---

## Logging convention

A commit's hash is derived from its contents, so a commit can never contain its own final hash. To keep rows in the **same commit** as the change (as requested) while still producing references that resolve on GitHub:

1. When a prompt produces a commit, append its row in **that same commit**, with the `Commit / PR` cell set to `` `_pending_` ``.
2. **Right before pushing**, replace every `` `_pending_` `` cell with the real, now-final short hash (in one reconciliation step), then push. Rows for earlier commits reference ancestors, so their hashes resolve correctly on the remote.

The `Date` uses the current date; the `Prompt` cell is a one-line summary of what was asked; `Status` tracks committed/pushed state.

> Original instruction (kept for reference): _Maintain a file at `docs/Prompts_Summary.md`. Every time you execute a prompt that results in a commit, append a row to the "Claude Code" table: the date, a one-line summary of what was asked, the commit hash or PR link, and status. Do this as part of the same commit, not a separate one._
