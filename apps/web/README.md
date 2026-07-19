# @ensyncro/web

Angular 18 frontend for Ensyncro (standalone components).

## Scripts

Run from the repo root (npm workspaces) or from this folder:

```bash
npm run web:dev              # ng serve — http://localhost:4200 (demo config)
npm run web:build            # production build → apps/web/dist/web
npm run web:build:demo       # demo build
npm run web:build:staging    # staging build
npm run web:build:production # production build
```

## Deployment (Vercel)

This app deploys as its **own Vercel project**, independent of the API. Create a
Vercel project from the GitHub repo and set:

- **Root Directory** → `apps/web`
- Build command / output are read from [`vercel.json`](vercel.json):
  `npm run build` → `dist/web/browser` (Angular's application-builder output).

`vercel.json` also adds a SPA fallback (`/(.*)` → `/index.html`) so Angular
client-side routing works on refresh, and long-cache headers for the
content-hashed assets. The API is a **separate** Vercel project (Root Directory
`apps/api`), so the two deploy and scale independently.

> Tip: in the project's *Git → Ignored Build Step*, use
> `git diff --quiet HEAD^ HEAD -- .` so the web project only rebuilds when
> `apps/web` actually changes.

## Environments

Angular does not read `process.env` at runtime, so configuration is injected at
**build time**. `scripts/set-env.mjs` (wired to the `prebuild` hook) generates
`src/environments/environment.ts` from environment variables before `ng build`:

| Variable       | Purpose                                                    | Default                              |
| -------------- | ---------------------------------------------------------- | ------------------------------------ |
| `APP_ENV`      | `demo` \| `staging` \| `production` (selects behaviour)    | `production`                         |
| `API_BASE_URL` | Overrides the API base URL for the chosen environment      | per-env default in `set-env.mjs`     |

```bash
npm run build                 # uses APP_ENV / API_BASE_URL from the environment
npm run build:demo            # forces APP_ENV=demo
npm run build:staging         # forces APP_ENV=staging
npm run build:production      # forces APP_ENV=production
```

On **Vercel**, set `APP_ENV` and (optionally) `API_BASE_URL` in the project's
Environment Variables; `prebuild` bakes them into the bundle. Only **public**
values ever ship — no secrets or DB connection strings. `environment.ts` is a
generated file (a committed default keeps the repo type-checking); edit
`set-env.mjs` or `environment.model.ts`, never `environment.ts` directly.

## Structure

```
src/
├── app/
│   ├── app.component.*      # root shell (header / router-outlet / footer)
│   ├── app.config.ts        # standalone providers (router, http)
│   ├── app.routes.ts        # route table
│   └── pages/home/          # landing page
├── environments/
│   ├── environment.model.ts # Environment type (AppEnv union)
│   └── environment.ts       # GENERATED at build time by scripts/set-env.mjs
├── favicon.svg
├── index.html
├── main.ts
└── styles.css               # global styles + charcoal-green palette tokens
```
