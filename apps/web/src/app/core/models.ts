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
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

// ── Media, product page, gated sections ───────────────────────
export type MediaKind = 'DOCUMENT' | 'PITCH_VIDEO' | 'PRODUCT_IMAGE' | 'LOGO';

/** Mirrors MAX_BYTES_BY_KIND in the API. */
export const MAX_BYTES_BY_KIND: Readonly<Record<MediaKind, number>> = {
  DOCUMENT: 25 * 1024 * 1024,
  PITCH_VIDEO: 200 * 1024 * 1024,
  PRODUCT_IMAGE: 10 * 1024 * 1024,
  LOGO: 10 * 1024 * 1024,
};

/** Total storage per founder. The pitch video does not count towards it. */
export const FOUNDER_QUOTA_BYTES = 500 * 1024 * 1024;

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
}

export type VideoProvider = 'YOUTUBE' | 'VIMEO' | 'LOOM';

export type PitchVideo =
  | { source: 'link'; provider: VideoProvider; embedUrl: string; watchUrl: string }
  | { source: 'upload'; fileName: string; playbackUrl: string | null };

export interface FounderMedia {
  website: string | null;
  video: PitchVideo | null;
}

export interface ProductPage {
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
  productName: string | null;
  tagline: string | null;
  productDescription: string | null;
  categories: string[];
  logoUrl: string | null;
  video: PitchVideo | null;
  /** Lets the UI show a locked state without firing a request that 404s. */
  access: { financials: boolean; fundingHistory: boolean };
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  occurredOn: string;
  achieved: boolean;
}

export interface Financials {
  mrr: number | null;
  arr: number | null;
  monthlyBurn: number | null;
  runwayMonths: number | null;
  useOfFunds: string | null;
  financialsVisibility: DataRoomVisibility;
  milestones: Milestone[];
}

export interface FundingRound {
  id: string;
  stage: FundingStage;
  amountRaised: number;
  preMoney: number | null;
  postMoney: number | null;
  closedOn: string;
  leadInvestor: string | null;
}

export interface FundingHistory {
  rounds: FundingRound[];
  totalRaised: number;
}

export type ProfileSection = 'FINANCIALS' | 'FUNDING_HISTORY';

export interface SectionAccessLogEntry {
  id: string;
  section: ProfileSection;
  viewedAt: string;
  viewer: { id: string; email: string; role: Role };
}

// ── Direct-to-storage upload ──────────────────────────────────
export type UploadTicket =
  | { mode: 'multipart' }
  | {
      mode: 'presigned-put';
      fileId: string;
      uploadUrl: string;
      headers: Record<string, string>;
      expiresInSeconds: number;
    };

// ── Request intro (PRD §10) ───────────────────────────────────
export type IntroStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface IntroCounterparty {
  userId: string;
  role: Role;
  name: string;
  detail: string;
}

export interface IntroRequest {
  id: string;
  status: IntroStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  counterparty: IntroCounterparty;
  /** Only present on received requests, and only once accepted. */
  contact?: { email: string; mobile: string | null } | null;
}

export interface IntroInbox {
  sent: IntroRequest[];
  received: IntroRequest[];
}
