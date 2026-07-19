# Ensyncro

A funding marketplace connecting founders raising capital with investors across the full spectrum — angel, seed, VC, syndicate, and crowdfunding.

> This repository is the **project skeleton** only. No product features are implemented yet — just the monorepo structure, environment configuration, and tooling. See [`Docs/Ensyncro_PRD_v1.md`](Docs/Ensyncro_PRD_v1.md) for the full product requirements.

## Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | Angular 18 (standalone components)            |
| Backend    | NestJS 10 (Node / TypeScript)                 |
| Database   | PostgreSQL via Prisma                         |
| Hosting    | Vercel, with the Neon integration for Postgres |

## Repository layout

```
ensyncro/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── prisma/
│   │   │   └── schema.prisma # DB schema (models added later)
│   │   └── src/
│   │       ├── config/       # env-sourced runtime config
│   │       ├── prisma/       # PrismaModule + PrismaService
│   │       ├── app.module.ts
│   │       ├── app.controller.ts  # /api/health
│   │       └── main.ts
│   └── web/                  # Angular frontend
│       └── src/
│           ├── app/          # standalone app shell
│           └── environments/ # demo / staging / production
├── Docs/                     # PRD and prompt history
├── .env.example              # base env template
├── .env.demo.example
├── .env.staging.example
├── .env.production.example
└── package.json              # npm workspaces root
```

This is an [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) monorepo (`apps/*`, `packages/*`).

## Getting started

Requires Node.js >= 20.

```bash
# Install all workspace dependencies from the repo root
npm install

# Copy an environment template and fill in local values
cp .env.example .env

# Run the backend (http://localhost:3000/api/health)
npm run api:dev

# Run the frontend (http://localhost:4200) in a second terminal
npm run web:dev
```

## Environments

See [ENVIRONMENTS.md](ENVIRONMENTS.md) for the full variable reference, local setup, and validation behaviour.

Ensyncro runs in three logical environments, each with its own database, secrets, and subdomain (PRD §8):

| Environment    | Purpose                                                        | Stats behaviour                                              |
| -------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| **demo**       | Working demo, all 3 roles instantly accessible, seeded data    | Seeded demo numbers, clearly not live                       |
| **staging**    | Real schema, real auth, seeded data — QA + pitch screenshots   | Real numbers from the `platform_stats` pipeline             |
| **production** | Hardened, real OTP delivery (phase 2)                          | Qualitative framing until thresholds, then live counts      |

The active environment is selected by the `APP_ENV` variable (`demo` \| `staging` \| `production`).
Matching frontend build configurations exist in `apps/web` (`npm run web:build:demo|staging|production`).

## Database connection (`DATABASE_URL`)

**The database connection string is never hardcoded.** Prisma reads it from the `DATABASE_URL` environment variable (see [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma)).

Once the Vercel project is connected to Neon, the integration **injects `DATABASE_URL` (and `DIRECT_URL`) automatically, per environment**. You do not commit or paste a connection string anywhere:

- **Locally**: leave `DATABASE_URL` blank in `.env` unless you are pointing at your own local Postgres. With no URL set, the API boots and logs a warning instead of connecting.
- **demo / staging / production**: provided by Vercel's Neon integration for that environment.

The `.env*.example` files are templates — copy them, fill in secrets out-of-band, and **never commit a populated `.env`** (only `*.example` files are tracked; see [`.gitignore`](.gitignore)).

## Scripts (repo root)

| Script                  | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run api:dev`       | Start NestJS in watch mode           |
| `npm run api:build`     | Build the backend                    |
| `npm run web:dev`       | Start Angular dev server (demo)      |
| `npm run web:build`     | Build the frontend (production)      |
| `npm run prisma:generate` | Generate the Prisma client         |
| `npm run prisma:migrate`  | Run a dev migration                |

## Roadmap

Feature work (auth + OTP, RBAC, founder/investor discovery, private data room with signed URLs, CMS, live stats) is scoped in the PRD. This skeleton deliberately contains no feature code, no Prisma models, and no routes yet.
