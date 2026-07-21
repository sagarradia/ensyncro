import { AdminRole, FundingStage, InvestorType, Role } from '@prisma/client';

/**
 * Fixed demo accounts for the one-click "Pitch shortcuts" (task #18).
 *
 * Single source of truth: the seed script (scripts/seed-demo.mjs) creates these
 * from the compiled output, and the demo-login endpoint will only ever issue a
 * token for an email in this list. Keeping the allow-list here — rather than
 * shipping demo credentials to the browser — is what keeps the demo path
 * structurally separate from real password auth.
 */
export interface DemoAccount {
  role: Role;
  email: string;
  /** Shown on the shortcut button. */
  label: string;
}

export const DEMO_ACCOUNTS: Readonly<Record<'ADMIN' | 'FOUNDER' | 'INVESTOR', DemoAccount>> = {
  ADMIN: {
    role: Role.ADMIN,
    email: 'demo.admin@ensyncro.com',
    label: 'Ops-level platform access',
  },
  FOUNDER: {
    role: Role.FOUNDER,
    email: 'demo.founder@ensyncro.com',
    label: 'Verdant Labs',
  },
  INVESTOR: {
    role: Role.INVESTOR,
    email: 'demo.investor@ensyncro.com',
    label: 'Lumen Capital',
  },
};

export const DEMO_EMAILS: readonly string[] = Object.values(DEMO_ACCOUNTS).map((a) => a.email);

/** Profile content seeded alongside the demo accounts. */
export const DEMO_SEED = {
  /**
   * Deliberately OPS, not SUPER: the demo login needs no password, so anyone
   * who finds the endpoint gets this account. OPS keeps that blast radius off
   * SUPER-only actions (e.g. inviting admins).
   */
  adminRole: AdminRole.OPS,
  founderProfile: {
    companyName: 'Verdant Labs',
    sector: 'Climate Tech',
    stage: FundingStage.SERIES_A,
    fundingSought: 3_500_000,
    description:
      'Verdant Labs builds grid-scale battery analytics that help utilities squeeze more life out of existing storage assets.',
    website: 'https://verdantlabs.example',
    location: 'Bengaluru, India',
    teamSize: 22,
    completed: true,
  },
  investorProfile: {
    name: 'Lumen Capital',
    investorTypes: [InvestorType.ANGEL, InvestorType.SEED_VC, InvestorType.MICRO_VC],
    sectors: ['Climate', 'Fintech', 'SaaS'],
    ticketMin: 25_000,
    ticketMax: 500_000,
    description:
      'Lumen Capital writes first cheques into climate and fintech founders across India and South-East Asia.',
    website: 'https://lumencapital.example',
    location: 'Mumbai, India',
    completed: true,
  },
} as const;
