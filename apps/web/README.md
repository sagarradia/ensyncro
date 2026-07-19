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

Build-time values live in `src/environments/`. `environment.ts` is the default
(demo); `angular.json` swaps it for `environment.staging.ts` /
`environment.production.ts` per configuration. These hold **public** values only
(e.g. `apiBaseUrl`) — no secrets or DB connection strings ever ship in the bundle.

## Structure

```
src/
├── app/
│   ├── app.component.*      # root shell (header / router-outlet / footer)
│   ├── app.config.ts        # standalone providers (router, http)
│   ├── app.routes.ts        # route table
│   └── pages/home/          # landing page
├── environments/            # demo / staging / production
├── favicon.svg
├── index.html
├── main.ts
└── styles.css               # global styles + charcoal-green palette tokens
```
