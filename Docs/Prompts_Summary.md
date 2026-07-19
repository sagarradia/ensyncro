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

---

## Logging convention

A commit's hash is derived from its contents, so a commit can never contain its own final hash. To keep rows in the **same commit** as the change (as requested) while still producing references that resolve on GitHub:

1. When a prompt produces a commit, append its row in **that same commit**, with the `Commit / PR` cell set to `` `_pending_` ``.
2. **Right before pushing**, replace every `` `_pending_` `` cell with the real, now-final short hash (in one reconciliation step), then push. Rows for earlier commits reference ancestors, so their hashes resolve correctly on the remote.

The `Date` uses the current date; the `Prompt` cell is a one-line summary of what was asked; `Status` tracks committed/pushed state.

> Original instruction (kept for reference): _Maintain a file at `docs/Prompts_Summary.md`. Every time you execute a prompt that results in a commit, append a row to the "Claude Code" table: the date, a one-line summary of what was asked, the commit hash or PR link, and status. Do this as part of the same commit, not a separate one._
