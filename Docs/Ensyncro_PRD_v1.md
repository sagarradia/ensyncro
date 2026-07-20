# Ensyncro — Product Requirements Document (v1, Demo/Staging scope)

## 1. Product summary
Ensyncro is a funding marketplace that connects founders raising capital with investors across the full spectrum — angel, seed, VC, syndicate, and crowdfunding. Founders create a profile and discoverable pitch; investors discover, save, and engage with founders; admins operate the platform and its content behind role-based access.

**Positioning**: simple and purpose-built, not a traditional stock-market or banking interface.

## 2. Goals for this phase
- Working demo with all 3 roles instantly accessible (no real signup needed)
- Staging environment with real schema, real auth, seeded data — used for QA and pitch-deck screenshots
- Production hardening (real OTP delivery, security review, legal review) scoped as phase 2, not squeezed into the initial 3–4 day build

## 3. Users & roles

| Role | Access | Notes |
|---|---|---|
| Admin | All founder + investor data, CMS, user management | Sub-roles: Super Admin, Finance, Legal, Ops. Created by invite only — no public admin signup. |
| Founder | Own profile, discover investors, data room | Signs up → fills company profile after account creation |
| Investor | Own profile, discover founders | Signs up → fills company profile + investor type after account creation |

**Investor types** (multi-select where relevant): Angel, Pre-seed, Seed VC, Series A+ VC, Micro-VC, Syndicate, Crowdfunding platform/backer, Corporate VC, Family Office, Accelerator/Incubator fund, Government/institutional fund.

## 4. Authentication & security
- Email + mobile OTP verification required at signup for Founders and Investors
- Session-based JWT auth, short-lived access tokens + refresh tokens
- Role-based access control (RBAC) enforced server-side on every request, not just hidden in the UI
- **No file or document is ever reachable by a static/public URL.** Every file request is checked against session + role, then served via a short-lived signed URL (see architecture diagram shared earlier). This covers pitch decks, cap tables, financials, and any admin-uploaded asset.
- Rate limiting on auth endpoints, password reset, and OTP requests
- Password policy + optional 2FA for Admin roles
- Full audit log: who viewed which founder/investor record, when, and what data room asset was opened

## 5. Site map

**Public / marketing**
Home · For Founders · For Investors · How it Works · Discover (preview) · Pricing · About · Legal (Terms, Privacy, Security)

**Auth**
Login · Signup (role picker: Founder / Investor) · OTP verification · Forgot password

**Founder area** (post-login)
Company profile setup (wizard) · Founder dashboard · Discover Investors (filter by type, check size, sector) · Data room (upload deck/cap table/financials with granular sharing) · Messages · Settings

**Investor area** (post-login)
Company/fund profile setup (wizard, incl. investor type) · Investor dashboard · Discover Founders (filter by sector, stage, ticket size) · Saved/shortlist · Messages · Settings

**Admin area**
Super Admin: full platform + user management + role assignment
Finance: pricing/billing data
Legal: compliance/document review, verification queue
Ops: general user & content management
**Content CMS**: edit homepage marketing copy, stats counters, pricing tiers — with bulk edit via Excel upload
Audit log viewer

## 6. Homepage content strategy
Marketing stats (deals count, founders count, investors count, etc.) are pulled live from the database, not hardcoded — with a documented fallback/default value for when counts are still low (early on, real counts might look sparse; we should decide together whether to show real numbers from day one or a "coming soon" state until there's real traction).

All homepage/marketing copy, pricing tiers, and stats are editable by Admins through the CMS, including a bulk-edit path via Excel upload.

*Design/content reference note: pocketfund.in and pocket-fund.com were used as structural references (nav layout, section types, footer categories) — actual copy, visuals, and code will be original to Ensyncro, not copied.*

## 7. Data model (high level)
- `users` (id, email, mobile, role, status, created_at)
- `founder_profiles` (user_id, company name, sector, stage, funding sought, description, ...)
- `investor_profiles` (user_id, fund/individual name, investor_type[], sectors of interest, ticket size range, ...)
- `admin_profiles` (user_id, admin_role: super/finance/legal/ops)
- `data_room_files` (owner_id, file_key [private storage], visibility rules, uploaded_at)
- `data_room_access_log` (file_id, viewer_id, viewed_at)
- `matches` / `saved_shortlist` (founder_id, investor_id, status)
- `messages` (thread_id, sender_id, recipient_id, body, sent_at)
- `cms_content` (key, value, updated_by, updated_at) — powers editable homepage/pricing text
- `platform_stats` (metric_name, value, computed_at) — for the live counters

## 8. Tech stack (recap)
- Frontend: Angular (web), Ionic + Angular (iOS/Android app — shared components)
- Backend: NestJS (Node/TypeScript)
- DB: PostgreSQL (Prisma or TypeORM)
- File storage: S3-compatible, private bucket, signed URLs only
- Environment: **single environment for now** — one `main` branch, one Vercel project per app, one Neon database. Multi-environment separation (Demo / Staging / Production with separate DBs, secrets, subdomains) is **deferred** until real usage justifies it (see §10).

## 9. Out of scope for phase 1 (flag for phase 2)
- Real payment/escrow processing
- SEBI/regulatory compliance review and any legal disclaimers required for solicitation of securities in India
- Real OTP/SMS provider integration (demo/staging can use a mock OTP)
- Penetration testing / formal security audit
- Native push notifications

## 10. Decisions log

**Single environment (multi-env deferred) — 2026-07-20**
- Simplified to a **single environment**: one `main` branch, one Vercel project per app (`ensyncro-web`, `ensyncro-api`), one Neon database (`main` branch).
- The demo/staging/production separation (separate branches, DBs, secrets, subdomains) added significant setup and operational overhead with no real users yet. **Deferred** until there's actual usage to justify it — at which point staging/demo can be reintroduced per the earlier Option A plan.
- Consequence: the per-environment stats behaviour below (demo seeded / staging live / production gated) collapses to a single production configuration for now.

**Color palette — Charcoal green (locked)**
| Token | Hex | Use |
|---|---|---|
| Text primary / dark surfaces | `#2C2C2A` | Headings, nav bar, dark UI |
| Accent | `#1F6D3B` | Buttons, links, live-stat highlights |
| Page background | `#F6F5F1` | Light-mode page canvas |
| Card background | `#FFFFFF` | Cards, panels |
| Border | `#E1DFD6` | Hairlines, card borders |
| Secondary text | `#7A7870` | Muted labels, captions |

**Homepage / marketing stats**
- Demo environment: seeded demo data, clearly not live
- Staging: real numbers pulled from the actual `platform_stats` table (this is what staging is for — testing the real pipeline)
- Production: qualitative framing ("early access — join the first cohort") until a minimum threshold is crossed (proposed: 25+ founders, 10+ investors), then switch to real live counts automatically

**Founder ↔ investor messaging**
- Not in v1. Replaced with a lightweight "Request intro" action on founder/investor profiles — fires a notification + email, no threaded chat or real-time infra
- Full messaging deferred to phase 2, revisited once discovery usage validates demand

## 11. Open questions for you
- None outstanding right now — revisit this section as new decisions come up during the build.
