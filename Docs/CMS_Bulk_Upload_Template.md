# Admin CMS — Excel bulk upload template

The Admin CMS ("Site content" in the admin nav, `/admin/cms`) lets an admin edit
the homepage marketing copy, pricing tiers and the platform success fee either
field-by-field or in bulk from an Excel file.

## The template

Download the current values as an `.xlsx` from the **Download template** button
on the Site content page (or `GET /api/admin/cms/template`). It is a single
sheet with two columns:

| key | value |
|-----|-------|
| homepage.headline | Where founders and investors sync up. |
| homepage.subtext | Ensyncro is a funding marketplace connecting… |
| pricing.tier1.name | Founder |
| pricing.tier1.price | Free |
| pricing.tier1.features | Discoverable pitch profile⏎Private data room⏎Request investor intros |
| … | … |
| settings.success_fee_pct | 5 |

### Rules

- **Row 1 is the header** — the columns must be named `key` and `value`
  (any order; the parser locates them by name, defaulting to A/B).
- **`key` must be a known content key** (the ones below). Rows with any other
  key are ignored and reported back as "skipped", so the file can't create
  arbitrary content.
- **`value`** is stored as-is. For a **features** field, put one feature per
  line inside the cell (Alt+Enter in Excel) — each line becomes a bullet on the
  homepage.
- **`settings.success_fee_pct`** must be a number between 0 and 100.
- You only need to include the rows you want to change; omitted rows keep their
  current value.

## The editable keys

| key | what it controls |
|-----|------------------|
| `homepage.headline` | Homepage hero headline |
| `homepage.subtext` | Homepage hero paragraph |
| `pricing.tier1.name` / `.price` / `.features` | Pricing tier 1 |
| `pricing.tier2.name` / `.price` / `.features` | Pricing tier 2 |
| `pricing.tier3.name` / `.price` / `.features` | Pricing tier 3 |
| `settings.success_fee_pct` | Success fee % shown on the homepage (PRD §2) |

The authoritative list lives in `apps/api/src/cms/cms-fields.ts`; adding a field
there automatically extends the admin form, the template and this contract.

## How it applies

`POST /api/admin/cms/bulk` (multipart, field `file`) parses the workbook,
upserts every known key in one transaction, and returns
`{ updated, appliedKeys, skippedKeys }`. The homepage reads
`GET /api/config/content` live, so applied changes are visible immediately.
