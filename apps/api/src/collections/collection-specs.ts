import { CollectionKind } from '@prisma/client';

/**
 * One declarative spec per homepage collection. This is the single source of
 * truth that (a) maps a URL slug to a CollectionKind, (b) tells the service
 * which fields are meaningful for that kind, and (c) drives the generic admin
 * editor so all six collections share one CRUD/form shape. Adding a collection
 * or a field is a change here and nowhere else.
 */
export type CollectionFieldType = 'text' | 'textarea' | 'number' | 'date';

export interface CollectionFieldSpec {
  /** Maps to a CollectionItem column. */
  name: 'title' | 'subtitle' | 'body' | 'linkUrl' | 'matchPct' | 'sector' | 'date';
  label: string;
  type: CollectionFieldType;
  required?: boolean;
}

export interface CollectionSpec {
  slug: string;
  kind: CollectionKind;
  label: string;
  /** One-line guidance shown in the admin editor. */
  note: string;
  /** True if a marketing example that must be labelled "Illustrative example". */
  illustrative: boolean;
  /** Whether this collection uses an uploaded image. */
  image: boolean;
  imageLabel?: string;
  /** Homepage sections hide themselves when a collection is empty. */
  hideWhenEmpty: boolean;
  fields: CollectionFieldSpec[];
}

export const COLLECTION_SPECS: readonly CollectionSpec[] = [
  {
    slug: 'sample-listings',
    kind: CollectionKind.SAMPLE_LISTING,
    label: 'Sample listing previews',
    note: 'Example founder cards for the homepage. Always shown with an "Illustrative example" badge — not real founders.',
    illustrative: true,
    image: false,
    hideWhenEmpty: true,
    fields: [
      { name: 'title', label: 'Founder / company name', type: 'text', required: true },
      { name: 'subtitle', label: 'One-liner', type: 'text' },
      { name: 'sector', label: 'Sector tag', type: 'text' },
      { name: 'matchPct', label: 'Illustrative match %', type: 'number' },
    ],
  },
  {
    slug: 'match-preview',
    kind: CollectionKind.MATCH_PREVIEW,
    label: 'Match preview mockup',
    note: 'One illustrative founder↔investor match card. Shown with an "Illustrative example" badge. Only the first entry is used.',
    illustrative: true,
    image: false,
    hideWhenEmpty: true,
    fields: [
      { name: 'title', label: 'Founder side (e.g. "Seed SaaS founder")', type: 'text', required: true },
      { name: 'subtitle', label: 'Investor side (e.g. "B2B seed investor")', type: 'text' },
      { name: 'body', label: 'Why they match', type: 'textarea' },
      { name: 'matchPct', label: 'Illustrative match %', type: 'number' },
    ],
  },
  {
    slug: 'team',
    kind: CollectionKind.TEAM,
    label: 'Team bios',
    note: 'Real team members only — leave empty until ready; the section is hidden when there are none.',
    illustrative: false,
    image: true,
    imageLabel: 'Photo',
    hideWhenEmpty: true,
    fields: [
      { name: 'title', label: 'Name', type: 'text', required: true },
      { name: 'subtitle', label: 'Role', type: 'text' },
      { name: 'body', label: 'Short bio', type: 'textarea' },
    ],
  },
  {
    slug: 'testimonials',
    kind: CollectionKind.TESTIMONIAL,
    label: 'Testimonials',
    note: 'Real testimonials only — the section is hidden when there are none.',
    illustrative: false,
    image: true,
    imageLabel: 'Photo (optional)',
    hideWhenEmpty: true,
    fields: [
      { name: 'body', label: 'Quote', type: 'textarea', required: true },
      { name: 'title', label: 'Name', type: 'text', required: true },
      { name: 'subtitle', label: 'Role / company', type: 'text' },
    ],
  },
  {
    slug: 'blog',
    kind: CollectionKind.BLOG,
    label: 'Blog posts',
    note: 'Published posts appear on /blog and as a homepage teaser (latest three).',
    illustrative: false,
    image: true,
    imageLabel: 'Cover image (optional)',
    hideWhenEmpty: true,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'date', label: 'Publish date', type: 'date' },
      { name: 'body', label: 'Body', type: 'textarea', required: true },
    ],
  },
  {
    slug: 'achievements',
    kind: CollectionKind.ACHIEVEMENT,
    label: 'Achievements / success stories',
    note: 'Footer links. Hidden when there are none.',
    illustrative: false,
    image: false,
    hideWhenEmpty: true,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'body', label: 'Short description', type: 'textarea' },
      { name: 'linkUrl', label: 'Link (optional)', type: 'text' },
    ],
  },
];

export const SPEC_BY_SLUG: ReadonlyMap<string, CollectionSpec> = new Map(
  COLLECTION_SPECS.map((s) => [s.slug, s]),
);
