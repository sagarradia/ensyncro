export type Role = 'FOUNDER' | 'INVESTOR' | 'ADMIN';
export type OtpChannel = 'EMAIL' | 'MOBILE';

export interface AuthUser {
  id: string;
  email: string;
  mobile?: string | null;
  role: Role;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED';
  emailVerified: boolean;
  mobileVerified: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

export interface LoginResponse extends TokenPair {
  user: AuthUser;
}

export type DemoRole = 'ADMIN' | 'FOUNDER' | 'INVESTOR';

/**
 * One-click demo shortcuts (task #18). Labels only — no credentials live in
 * the frontend; POST /auth/demo-login resolves the account server-side.
 */
export const DEMO_SHORTCUTS: ReadonlyArray<{ role: DemoRole; title: string; detail: string }> = [
  { role: 'ADMIN', title: 'Admin', detail: 'Ops-level platform access' },
  { role: 'FOUNDER', title: 'Founder', detail: 'Verdant Labs' },
  { role: 'INVESTOR', title: 'Investor', detail: 'Lumen Capital' },
];

export type FundingStage =
  | 'IDEA'
  | 'PRE_SEED'
  | 'SEED'
  | 'SERIES_A'
  | 'SERIES_B'
  | 'SERIES_C_PLUS';

export const FUNDING_STAGES: ReadonlyArray<{ value: FundingStage; label: string }> = [
  { value: 'IDEA', label: 'Idea / pre-product' },
  { value: 'PRE_SEED', label: 'Pre-seed' },
  { value: 'SEED', label: 'Seed' },
  { value: 'SERIES_A', label: 'Series A' },
  { value: 'SERIES_B', label: 'Series B' },
  { value: 'SERIES_C_PLUS', label: 'Series C or later' },
];

export interface FounderProfile {
  id: string;
  userId: string;
  companyName: string;
  sector: string;
  stage: FundingStage;
  fundingSought: number | null;
  description: string | null;
  website: string | null;
  location: string | null;
  teamSize: number | null;
  completed: boolean;
}

/** Investor types from PRD §3 — multi-select. */
export type InvestorType =
  | 'ANGEL'
  | 'PRE_SEED'
  | 'SEED_VC'
  | 'SERIES_A_PLUS_VC'
  | 'MICRO_VC'
  | 'SYNDICATE'
  | 'CROWDFUNDING'
  | 'CORPORATE_VC'
  | 'FAMILY_OFFICE'
  | 'ACCELERATOR_INCUBATOR'
  | 'GOVERNMENT_INSTITUTIONAL';

export const INVESTOR_TYPES: ReadonlyArray<{ value: InvestorType; label: string }> = [
  { value: 'ANGEL', label: 'Angel' },
  { value: 'PRE_SEED', label: 'Pre-seed' },
  { value: 'SEED_VC', label: 'Seed VC' },
  { value: 'SERIES_A_PLUS_VC', label: 'Series A+ VC' },
  { value: 'MICRO_VC', label: 'Micro-VC' },
  { value: 'SYNDICATE', label: 'Syndicate' },
  { value: 'CROWDFUNDING', label: 'Crowdfunding platform / backer' },
  { value: 'CORPORATE_VC', label: 'Corporate VC' },
  { value: 'FAMILY_OFFICE', label: 'Family Office' },
  { value: 'ACCELERATOR_INCUBATOR', label: 'Accelerator / Incubator fund' },
  { value: 'GOVERNMENT_INSTITUTIONAL', label: 'Government / institutional fund' },
];

export interface InvestorProfile {
  id: string;
  userId: string;
  name: string;
  investorTypes: InvestorType[];
  sectors: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  description: string | null;
  website: string | null;
  location: string | null;
  completed: boolean;
}

export interface SignupResponse {
  userId: string;
  status: string;
  message: string;
  /** Present only while OTP_MODE=mock, so the wizard can pre-fill the codes. */
  devOtp?: { email?: string | null; mobile?: string | null };
}

// ── Discovery (task #11) ──────────────────────────────────────
export interface DiscoverResult<T> {
  total: number;
  take: number;
  skip: number;
  items: T[];
}

export interface FounderCard {
  id: string;
  userId: string;
  companyName: string;
  sector: string;
  stage: FundingStage;
  fundingSought: number | null;
  location: string | null;
  teamSize: number | null;
  description: string | null;
  website: string | null;
}

export interface InvestorCard {
  id: string;
  userId: string;
  name: string;
  investorTypes: InvestorType[];
  sectors: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  location: string | null;
  description: string | null;
  website: string | null;
}

// ── Data room (tasks #12 / #13) ───────────────────────────────
export type DataRoomVisibility = 'PRIVATE' | 'SHARED_ON_REQUEST' | 'VISIBLE_TO_INVESTORS';

export const VISIBILITY_OPTIONS: ReadonlyArray<{ value: DataRoomVisibility; label: string }> = [
  { value: 'PRIVATE', label: 'Private — only me' },
  { value: 'SHARED_ON_REQUEST', label: 'Shared on request' },
  { value: 'VISIBLE_TO_INVESTORS', label: 'Visible to investors' },
];

export interface DataRoomFile {
  id: string;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  visibility: DataRoomVisibility;
  uploadedAt: string;
  _count?: { accessLogs: number };
}

export interface SignedLink {
  fileId: string;
  fileName: string;
  expiresInSeconds: number;
  url: string;
}

export interface AccessLogEntry {
  id: string;
  viewedAt: string;
  file: { id: string; fileName: string };
  viewer: { id: string; email: string; role: Role };
}

/** Matches MAX_FILE_BYTES in the API — per file, not a per-founder quota. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
