/**
 * The registry of every editable CMS field — the single source of truth for the
 * homepage marketing copy, the pricing tiers, and admin-configurable settings
 * (PRD §2 / §6). It validates writes (only known keys are accepted), supplies a
 * default so an unset key still renders, and drives the admin edit form and the
 * bulk-upload template. To add an editable field, add a row here — nothing else
 * needs to change.
 */
export type CmsFieldType = 'text' | 'textarea' | 'list' | 'number';

export interface CmsField {
  key: string;
  label: string;
  group: CmsGroup;
  type: CmsFieldType;
  default: string;
  /** Shown under the field in the admin form. */
  help?: string;
}

export type CmsGroup = 'homepage' | 'pricing' | 'settings';

/** A pricing tier's feature list is stored as one newline-separated string. */
export const CMS_FIELDS: readonly CmsField[] = [
  {
    key: 'homepage.tagline',
    label: 'Hero tagline (above headline)',
    group: 'homepage',
    type: 'text',
    default: 'The funding marketplace',
    help: 'Short line shown above the main headline.',
  },
  {
    key: 'homepage.headline',
    label: 'Homepage headline',
    group: 'homepage',
    type: 'text',
    default: 'Where founders and investors sync up.',
  },
  {
    key: 'homepage.subtext',
    label: 'Homepage subtext',
    group: 'homepage',
    type: 'textarea',
    default:
      'Ensyncro is a funding marketplace connecting founders raising capital with investors across the full spectrum — angel, seed, VC, syndicate, and crowdfunding.',
  },

  // ── Pricing tiers ────────────────────────────────────────────
  { key: 'pricing.tier1.name', label: 'Tier 1 · name', group: 'pricing', type: 'text', default: 'Founder' },
  { key: 'pricing.tier1.price', label: 'Tier 1 · price', group: 'pricing', type: 'text', default: 'Free' },
  {
    key: 'pricing.tier1.features',
    label: 'Tier 1 · features',
    group: 'pricing',
    type: 'list',
    default: 'Discoverable pitch profile\nPrivate data room\nRequest investor intros',
    help: 'One feature per line.',
  },
  { key: 'pricing.tier2.name', label: 'Tier 2 · name', group: 'pricing', type: 'text', default: 'Investor' },
  { key: 'pricing.tier2.price', label: 'Tier 2 · price', group: 'pricing', type: 'text', default: 'On request' },
  {
    key: 'pricing.tier2.features',
    label: 'Tier 2 · features',
    group: 'pricing',
    type: 'list',
    default: 'Full founder discovery\nDeal pipeline\nGated data room access',
    help: 'One feature per line.',
  },
  { key: 'pricing.tier3.name', label: 'Tier 3 · name', group: 'pricing', type: 'text', default: 'Enterprise' },
  { key: 'pricing.tier3.price', label: 'Tier 3 · price', group: 'pricing', type: 'text', default: 'Custom' },
  {
    key: 'pricing.tier3.features',
    label: 'Tier 3 · features',
    group: 'pricing',
    type: 'list',
    default: 'Everything in Investor\nDedicated support\nCustom onboarding',
    help: 'One feature per line.',
  },

  // ── Closing CTA banner (after pricing, before the footer) ────
  {
    key: 'homepage.cta.headline',
    label: 'Closing CTA · headline',
    group: 'homepage',
    type: 'text',
    default: 'Ready to sync up?',
  },
  {
    key: 'homepage.cta.subtext',
    label: 'Closing CTA · subtext',
    group: 'homepage',
    type: 'textarea',
    default: 'Join founders and investors already building their next chapter on Ensyncro.',
  },
  {
    key: 'homepage.cta.button',
    label: 'Closing CTA · button label',
    group: 'homepage',
    type: 'text',
    default: 'Get Started',
  },

  // ── Settings ─────────────────────────────────────────────────
  {
    key: 'settings.success_fee_pct',
    label: 'Success fee (%)',
    group: 'settings',
    type: 'number',
    default: '5',
    help: 'Charged on a successful raise (PRD §2). Admin-configurable, not hardcoded.',
  },
];

export const CMS_FIELD_BY_KEY: ReadonlyMap<string, CmsField> = new Map(
  CMS_FIELDS.map((f) => [f.key, f]),
);

export function isKnownCmsKey(key: string): boolean {
  return CMS_FIELD_BY_KEY.has(key);
}

/** Split a stored list value into trimmed, non-empty lines. */
export function toList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
