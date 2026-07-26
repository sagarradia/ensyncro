# Ensyncro — Product Requirements Document v2 (VMB-aligned)

*Supersedes Ensyncro_PRD_v1.md. This is a structural pivot, not an edit — see §9 for what carries over.*

> **Maintained incrementally by Claude Code** per instructions relayed from planning discussions — see [Docs/Prompts_Summary.md](Prompts_Summary.md) for the full decision history.

## 1. Product summary & positioning

Ensyncro is a **technology-enabled Virtual Merchant Banker (VMB)** — not a discovery marketplace. Per the source spec, this distinction is deliberate and central to every design decision:

- **Not** "browse investor listings" — the core value is transforming structured business information into professional investment documentation (Teaser, Information Memorandum) and supporting the full investment transaction lifecycle, start to close.
- Ensyncro is a **facilitator**, not a principal to any transaction. It does not guarantee or recommend investments.
- **Ownership principle**: all business information/documents uploaded remain the property of the Investee. Ensyncro acts solely as custodian/facilitator, never acquiring ownership rights.

## 2. Business model

- **Success fee** on completed transactions only — no upfront platform charges to either side. **Configurable by Admin via a dashboard control** (not hardcoded), with a **default of 5% flat**, set based on competitive benchmarking: traditional M&A/investment-banking success fees typically follow a Lehman-style tiered scale (starting 5-10% on the first tranche, tapering down), while direct comparables — equity crowdfunding platforms — charge Wefunder 7.5%, Republic ~8% effective, SeedInvest ~12.5% effective (cash + equity fee). 5% flat positions Ensyncro between pure crowdfunding platforms and traditional large-deal IB rates, reflecting the "structured merchant banker" positioning rather than either extreme. Admin can override per-deal or adjust the platform default; this control lives in Platform Administration → Settings.
- **Optional professional services** (revenue stream, phase v1.2): financial projections, IM preparation, Teaser preparation, due diligence, legal documentation, transaction advisory, VDR services.

## 6a. Geographic scope
**Global**, with **India as the launch priority/focus market** — revised from the source spec's India-only Phase 1. Regulatory/compliance considerations (KYC, agreements, disclosures) should be designed with India as the first jurisdiction but not hard-coded to assume it's the only one (e.g. country field on profiles, not an implicit assumption).

## 3. Core design principles (govern every module)

1. Every investment opportunity is represented by a **Deal** — the central object.
2. Structured information is preferred over uploaded documents wherever possible.
3. The Information Memorandum is **generated automatically** from structured data, not manually assembled.
4. The Virtual Data Room remains strictly permission-based.
5. Every significant event produces a **Timeline Entry + Notification + Audit Log** — all three, not a subset.
6. No information is entered more than once — reuse over re-entry.
7. The platform stays modular and scalable (module-by-module rollout, per phase below).
8. Automation replaces repetitive manual work wherever practical.

## 4. User roles

Four roles now, not three:

| Role | Who | Notes |
|---|---|---|
| **Admin** (Platform Company) | Platform Administrator, Platform Staff | Sub-roles carried over: Super Admin, Finance, Legal, Ops |
| **Investor** | Angel, Family Office, VC, PE Fund, Strategic Investor, Corporate Investor, HNI, Overseas Investor | Broader than our current investor-type list — PE and Overseas added |
| **Investee** (was "Founder") | Businesses seeking investment | Terminology shift — "Investee" throughout going forward, matching the spec |
| **Consultant** *(new)* | Chartered Accountants, Company Secretaries, Advocates & Solicitors, Valuers | Entirely new role — own registration, profile, assignment, billing (phase v1.2) |

## 5. The Deal lifecycle (19 stages)

Interest → Platform Agreement → IM Access → Meeting → NDA → Virtual Data Room → Due Diligence → Offer → Negotiation → Documentation → Fee Settlement → Deal Closure

*(Condensed from the source spec's 19-step version — see Functional Module Spec for full granularity.)* Every Deal carries a Dashboard, Timeline, Tasks, Comments, Attachments, Status, and Activity History.

## 6. Business objects (data model, high level)

Platform Organization · Platform Staff · Consultant · Investor · Investee · **Investment Opportunity** *(an Investee can have multiple, e.g. across funding rounds — distinct from the Investee profile itself)* · **Deal** · Teaser · Information Memorandum · Virtual Data Room · Document · Meeting · Professional Service Request · Due Diligence Request · Documentation Request · Notification · Timeline Event · Agreement

This is a materially richer object model than v1's flat founder/investor profile + data room. **Investment Opportunity ≠ Investee** — one company can raise multiple rounds, each a separate Opportunity feeding into its own Deal(s).

## 7. Module breakdown by phase

### MVP (near-term target — replaces the old "Day 1-4" plan entirely)
- Platform Administration (Dashboard, Staff Mgmt, RBAC, Masters, Settings, Audit)
- Investor Management (Registration, Profile, Investment Preferences/Philosophy, Dashboard, Watchlist, Saved Searches)
- Investee Management (Registration, Business Profile, Promoters, Group Companies, Products & Services, Journey, USP, Business Model, Market, Competition, Risks, Future Plans, Funding Requirement, Milestones, Shareholding, Completion Score)
- Investment Opportunity Management (Create, Publish, Visibility, Funding Round, Matching Criteria, Investor Discovery)
- **Structured Information Management** — the most important module per the spec: sections for Business/Industry/Products/Customers/Suppliers/Manufacturing/Operations/SWOT/Risks/Financial/Projected Financials/Benchmarking/Ratios/Images/Videos, feeding automatic Teaser + IM + Financial Analysis + Charts generation
- Basic Document Management
- Basic Virtual Data Room
- Notifications (basic)
- Search & Discovery (global search, filters, matching, saved search)

### v1.1
- Full Virtual Data Room (folder structure, watermark, download policy, version history, document requests, activity logs)
- Due Diligence Management (8 categories: Business/Financial/Tax/Legal/ROC/Technical/Environmental/Commercial — checklist, queries, responses, assignment, report)
- Agreement Management (templates, e-Sign, versioning — Platform Usage Agreement, NDA, Term Sheet, SHA, SPA)
- Communication Centre (Email/SMS/WhatsApp/Portal notifications, templates, scheduler, broadcast, inbox)

### v1.2
- Professional Engagement (service assignment, consultant allocation, deliverables, timesheets, billing)
- Consultant Management (registration, profile, qualifications, availability, performance)
- Finance & Billing (success fee, professional fees, invoices, GST, receipts, consultant payments)
- Reports & Analytics (investor/investee/deal reports, revenue, sector analysis, pipeline, success ratio)

### v2.0 (future)
AI-assisted matching, AI due-diligence assistance, advanced analytics/recommendation engine, built-in video conferencing, mobile apps, ESG analysis.

## 8. Investor/Investee classification (multi-dimensional — replaces the old single sector/stage fields)

- **Nature of business** (multi-select): Manufacturing, Trading, Service, or combinations
- **Business stage**: Idea, Startup, Early Revenue, Growth, Expansion, Mature, Turnaround
- **Sector**: maintained in Admin Masters (IT, Chemicals, Pharma, Agriculture, FMCG, Infrastructure, Retail, Logistics, extensible)
- **Funding requirement type**: Seed, Angel, Growth, Expansion, Bridge, Pre-IPO, Strategic, Acquisition
- **Company classification**: MSME, Large Enterprise, Listed, Unlisted, Government, PSU

## 9. What carries over from the current build vs. needs rework

| Area | Status |
|---|---|
| Auth (signup/login/JWT/OTP), RBAC guards | **Keep as-is** — foundation is role-agnostic to the pivot; extend RBAC for the new Consultant role |
| Data room security model (permission check → signed URL → audit log) | **Keep the model**, extend scope (folders, watermarking, download policy are additions) |
| S3 storage migration | **Keep** — unaffected by this pivot |
| Founder/Investor profile forms (wizards) | **Rework** — current fields are a subset of the much deeper Investee/Investor structured-info model above; not a clean extension |
| Discover pages | **Rework** — becomes "Investor Discovery" within Investment Opportunity Management, driven by the multi-dimensional taxonomy, not the old flat filters |
| Financials & Milestones (just built) | **Partial keep** — becomes part of Structured Information Management, but needs Projected Financials/Benchmarking/Ratios added |
| Demo-mode login shortcuts | **Keep** — orthogonal to this pivot |
| Deal object, Teaser/IM generation, Agreements, DD, Consultants, Billing, Communication Centre | **New builds, not extensions** — nothing exists yet |

## 10. Security (unchanged principles, extended scope)
Same non-negotiables as v1: no file ever reachable by a public URL, server-side RBAC on every request, full audit trail. Extended to cover: Deal-stage-based access control (a Consultant assigned to DD sees only what that engagement permits), e-signature integrity on Agreements (v1.1), watermarking on VDR documents (v1.1).

## 11. Tech stack
Unchanged: Angular (web) + Ionic/Angular (app), NestJS backend, PostgreSQL via Neon, AWS S3 for file storage, single production environment (demo/staging deferred per the earlier decision — still holds).

## 12. Timeline reset — important
The original "3-4 days" estimate was scoped against a much smaller product. **VMB's own MVP module list alone exceeds everything built in the first 3 days of this project.** This needs to be replanned as a proper multi-week effort, phased per §7, not compressed back into a few days. A new execution tracker (replacing Ensyncro_Execution_Plan.xlsx) is the next deliverable, built against the MVP module list above.

## 14. Solution Architecture (per partner's Solution Architecture Specification — adopted in full, conflicts flagged explicitly)

### 14.1 Architecture philosophy
Design goals: Modular, Secure, Highly Maintainable, Workflow Driven, API First, Cloud Deployable, Mobile Ready, AI Ready, Scalable, Multi-Version Compatible.

Architectural principles:
1. Business drives architecture, never the reverse.
2. Every module is independent — removable/replaceable without affecting the whole system.
3. Every business transaction is traceable.
4. Everything important is event-driven (e.g. Deal Created → Notification → Timeline → Audit → Dashboard).
5. Security before convenience.

### 14.2 Logical layers
- **Presentation**: Angular + PrimeNG + Tailwind — UI, validation, dashboards, reports, uploads
- **Business**: NestJS — business rules, workflow, validation, notifications, calculations, matching, report generation
- **Persistence**: PostgreSQL — business data, configuration, transactions, workflow, audit
- **Storage**: Object storage (S3) — documents, images, videos, generated PDFs

### 14.3 Core shared services (available to every module)
Authentication · Authorization · Audit · Notification · Search · Workflow · PDF Generation · Email · Storage · Configuration · Logging · Caching · Scheduler · File Upload · Image Compression · Excel Import

This is a substantial new "platform services" layer beyond what's currently built — PDF Generation and a formal Workflow/event engine in particular don't exist yet and are prerequisites for Teaser/IM generation and Deal Management.

### 14.4 Security architecture (extends §10)
JWT + Refresh Token + RBAC (have) · Session Timeout (new) · Password Policy (new — complexity rules, not just OTP) · Encrypted Password (have — hashed) · HTTPS (have, via Vercel) · Audit Trail (have) · Document Permissions (have) · Secure Download (have — signed URLs) · **Watermark** (new) · **Anti-Virus Scan on upload** (new — needs a provider decision, see §16) · Rate Limiting (partial — have on auth endpoints, needs extending platform-wide) · MFA (future/v2).

### 14.5 Document architecture
Every document follows: Metadata → Storage → Version → Permission → History → Audit. **Documents are never overwritten — every modification creates a new version.** This is a real gap vs. current build: our data room currently replaces/manages single file versions, not a version chain. Needs rework when Document Management is built out properly.

### 14.6 Workflow & notification engine
Every significant business action emits an internal event (e.g. `InvestorAcceptedPlatformAgreement`), which independently triggers notification, timeline update, audit log, dashboard refresh, and permission changes — without modules calling each other directly. This is a **formal event-driven architecture decision**, not just "log things" — it means building an actual internal event bus/emitter pattern in NestJS, which doesn't exist yet. Notification channels: Email + Portal now, SMS/WhatsApp future. Rules: event-based, scheduled, reminder, escalation, templated.

### 14.7 Reporting & search engines
Reporting: Database → Business Rules → Computed Values → Charts → Reports → Export (Excel/PDF). Search: Global, Module-level, Filtered now; AI/Semantic search future.

### 14.8 Deployment architecture — ⚠️ direct conflict with an earlier decision, flagged explicitly
The Solution Architecture Spec calls for **separate Development → Testing → Production environments** as standard practice (Chapter 13).

**This directly conflicts with our single-environment decision** (PRD §11, session log rows 23-24) — which wasn't arbitrary: we attempted full demo/staging/production separation earlier and hit many hours of genuine infrastructure pain (Vercel Custom Environments, Neon branching, Framework Preset conflicts, env var scoping) disproportionate to pre-MVP needs, and deliberately simplified to one environment.

Both positions are legitimate:
- **Partner's spec** reflects standard, correct practice for a serious production system, especially one handling financial/legal data (agreements, DD, billing) — untested changes hitting production directly is a real risk once this handles real deals.
- **Our simplification** was a pragmatic, evidence-based call given non-technical solo execution and the specific pain already experienced.

**This needs your explicit decision, not mine** — options: (a) stay single-environment through MVP, revisit once Deal/Agreement/Billing modules with real financial consequences are live; (b) reintroduce a lighter two-environment split (dev + prod only, skip a separate "demo") now that the earlier Vercel/Neon lessons are documented in DEPLOYMENT.md and shouldn't repeat the same pain; (c) follow the spec fully now. Flag this to your partner too, given it's his explicit architectural requirement.

### 14.9 Backup, logging, performance, scalability, disaster recovery, versioning, monitoring
All per the spec, none yet implemented, all reasonable and deferred to whichever build phase includes production hardening:
- **Backup**: daily incremental, weekly full, monthly archive; DB + document + config backup; retention policy
- **Logging**: application, security, audit, API, error, performance logs (separate concerns, not one log)
- **Performance**: lazy loading, server pagination, caching, compression, async jobs, queue processing, CDN (future)
- **Scalability**: horizontal scaling, stateless APIs, DB optimization, read-only reports, load balancer/containers (future)
- **Disaster recovery**: daily + off-site backup, restore testing, recovery documentation, RTO/RPO targets
- **Versioning**: API, database migration, application, document, agreement, and workflow versioning — each independently
- **Monitoring**: health checks (CPU/RAM/storage/API performance/slow queries/failed jobs/email queue/upload queue/background jobs)

### 14.10 Frozen architecture decisions (adopted as-is)
1. **Modular Monolith, not microservices** — matches our existing NestJS structure; no change needed, just discipline going forward (keep modules independent/removable)
2. **API First** — every interaction, including from Angular, goes through REST APIs, no direct DB access from frontend — already how we've built it
3. **PostgreSQL as single source of truth** — matches
4. **File storage outside the database** — matches (we already moved off Postgres-blob storage to S3)
5. **Event-driven business flow** — new discipline to adopt going forward (§14.6)

## 15. Frontend technology decision (per partner's Angular-vs-Next.js evaluation — adopted in full)

Your partner evaluated switching to Next.js and explicitly decided **against it**, retaining Angular. Full reasoning adopted:
- Next.js's distinctive strengths (React Server Components, file-system routing, server actions) aren't central to VMB, which is predominantly structured forms, workflows, dashboards, and tables — "authenticated application functions" that don't benefit from aggressive server rendering.
- Framework choice doesn't determine visual quality — a professional UI is a design/discipline outcome, not a framework one.
- **Product owner's Angular familiarity is treated as a project risk-control mechanism** — faster review, debugging, and correction of AI-generated code — not a minor convenience.
- NestJS is explicitly modeled on Angular's architecture (modules, controllers, providers, DI, decorators, guards) — this structural similarity is considered valuable and is preserved.
- Angular's opinionated conventions are considered an *advantage* for AI-assisted development specifically, since they constrain the arbitrary architectural choices an AI coding agent would otherwise have to make.
- Next.js + NestJS together would risk duplicated backend logic (ambiguity over where validation/auth/caching lives) — Angular's clear frontend/NestJS's clear backend separation avoids this entirely.
- Angular compiles to static assets — simpler deployment than Next.js's typical Node runtime requirement.

**Decision AD-006 (frozen for Version 1.0): Angular is retained as the frontend framework.**

### 15.1 Required UI stack addition — action item, not yet implemented
The current build uses plain Angular with hand-written CSS (no component library, no utility framework). Per the frozen decision, the following must be added:

- **PrimeNG** — feature-rich Angular component suite, design-agnostic theming with configurable presets/design tokens (not a fixed look), official Tailwind integration
- **Tailwind CSS** — utility-first responsive styling, constraint-based consistency
- **Custom VMB design system / design tokens** — built on top of both, incorporating the charcoal-green palette already locked in (PRD v1 decisions log)
- Together these are expected to produce: modern landing pages, premium dashboards, professional investor/investee cards, polished multi-step forms, responsive mobile layouts, charts, timelines, document workspaces — with **no inherent visual disadvantage** versus a Next.js/React alternative

This is a real, not-yet-done piece of work — see §16 for the concrete build prompt.

### 15.2 Structured-information data entry — profile editor panels, not wizard steps (design decision, confirmed)

The deep Investee structured-information sections (Promoters, Group Companies, Products & Services, USP, Business Model, Market, Competition, Risks, Future Plans, SWOT, Benchmarking & Ratios, and the further §7/§8 sections — Funding Requirement, Shareholding, Classification, Customers, Suppliers, Manufacturing, Operations, Projected Financials, Completion Score) are entered and edited as **independently autosaving panels within the Investee profile editor** (currently `/founder/content`). Each panel persists on its own and is resumable across sessions.

They are deliberately **not** steps in the first-run onboarding wizard: onboarding stays lightweight (core company profile only), while the depth of structured information is filled in and revised over time in the profile editor. This **overrides the earlier "polished multi-step forms / add as new wizard steps" framing** for the structured-information modules — that wording applies to short flows (signup, onboarding), not to the large structured-info surface.

## 16. Open decisions
1. ~~Confirm "Ensyncro" stays as the product name~~ — **Confirmed: yes**
2. ~~Success fee percentage~~ — **Confirmed: Admin-configurable dashboard control, default 5% flat (see §2 for benchmarking)**
3. ~~Sequencing within MVP~~ — **Confirmed: Investee/Investor Mgmt + Structured Info Mgmt first**
4. ~~Geographic scope~~ — **Confirmed: Global, India-priority (see §6a)** — revised from India-only
5. **§14.8 — single environment vs. separate Dev/Test/Prod**: still open — **deferred pending a direct discussion with the partner** (not resolved here, since it's his stated requirement)
6. Anti-virus scanning provider — defaulting to a cloud scanning API (e.g. VirusTotal) over self-hosted ClamAV, to avoid added infrastructure; flag if this should be discussed further. Document versioning (never-overwrite, version chains) still needs implementation design

## 17. Site map (current, per role)

*A reality snapshot of what is actually built and routable today — audited against `apps/web/src/app/app.routes.ts` and the NestJS controllers. This is **not** the target information architecture from §7; it is the current state. "Access" is the client-side route guard; the API independently enforces the same rules server-side on every request. (Terminology note: the PRD says "Investee", but the code and routes still say "founder" — `/founder/*`, `FounderProfile` — a rename is pending, tracked separately.)*

### 17.1 Pages that exist

| Route | Page | What it does | Access |
|---|---|---|---|
| `/` | Home | Marketing landing — hero + role cards. | Public |
| `/login` | Log in | Email/password login, plus one-click demo "Pitch shortcuts" (Founder/Investor/Admin) when demo logins are enabled. | Public |
| `/signup` | Sign up | Two-step registration: details → email + mobile OTP verification. | Public |
| `/founder/onboarding` | Founder onboarding | 3-step company-profile wizard (Company · Funding · About), saved per step. | Founder |
| `/investor/onboarding` | Investor onboarding | 3-step investor-profile wizard (Identity · Focus · About), incl. investor-type multi-select. | Investor |
| `/discover/investors` | Discover investors | Founders browse investors; filter by type, sector, cheque size. | Founder, Admin |
| `/discover/founders` | Discover founders | Investors browse founders; filter by sector, stage, amount sought; links through to each founder's product page. | Investor, Admin |
| `/data-room` | Data room | Founder uploads/manages documents with per-file visibility, secure (signed-URL) view, and the "who accessed" audit log. | Founder |
| `/founder/content` | Profile editor ("My profile") | Founder edits the full structured Investee profile as autosaving panels: media, product page, USP/business model/market, promoters, group companies, products & services, competition, SWOT, company journey, classification (§8), funding requirement, operations, key customers, key suppliers; plus gated sections (financials + ratios + benchmarking, funding history, risks, future plans, shareholding, projected financials) each with its own visibility control; a profile-completeness score; and the gated-section access log. | Founder |
| `/founders/:userId` | Product page | A founder's profile as seen by others: all public sections, plus each gated section shown or shown-locked per the viewer's permission (authorised + audited server-side). Carries the "Request intro" action. | Founder, Investor, Admin |
| `/intros` | Intros | Intro-request inbox — sent + received, accept/decline; contact details released only on acceptance. | Founder, Investor |
| `**` (unknown) | — | Redirects to Home. | Public |

### 17.2 Per-role summary

- **Founder** — onboarding wizard; profile editor (`/founder/content`, the 20+ structured sections covering the first 12 deep sections plus the §7/§8 additions); data room and its access audit log; discover investors; view any founder's product page; intros inbox.
- **Investor** — onboarding wizard; discover founders; view any founder's product page (public sections always; financials / funding history / risks / future plans / shareholding / projected financials only where that founder has shared them); intros inbox.
- **Admin** — **no dedicated admin UI is built.** An admin can reach the shared pages whose guards include `ADMIN`: `/discover/founders`, `/discover/investors`, and any `/founders/:userId` product page (where the API grants an admin the view of every gated section). All other admin capability exists **only as API endpoints, with no screens**:
  - `GET /api/admin/me` · `GET /api/admin/stats` · `GET /api/admin/invites` · `POST /api/admin/invites` (create — SUPER sub-role only) · `POST /api/admin/invites/accept`.
  - Admin sub-roles exist in the data model and are enforced server-side (**SUPER · FINANCE · LEGAL · OPS**), but there is no UI to manage them; the first admin is created by a server-side bootstrap script. Platform config (e.g. the configurable success-fee control from §2) is **not built** — no data model, no endpoint, no screen.
- **Consultant** — defined as a role in §4 but has **zero pages, zero routes, and zero API**. Entirely unbuilt (targeted for phase v1.2).

### 17.3 Reality notes (what is deliberately absent)

- No Deal, Teaser/IM generation, Investment Opportunity, Agreement, Due-Diligence, Notification-centre, or Platform-Administration UI exists yet — these are the phased §7 builds, none started.
- Discovery still uses the old flat sector/stage/ticket filters. The multi-dimensional §8 taxonomy now exists on the Investee profile, but the discover filters have **not** been reworked to use it (§9 "Discover — rework").
- There are no dashboards, reports, or search-beyond-filters screens yet.
