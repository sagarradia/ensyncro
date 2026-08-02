export type Role = 'FOUNDER' | 'INVESTOR' | 'ADMIN' | 'CONSULTANT';

export type ConsultantType = 'CA' | 'CS' | 'ADVOCATE' | 'VALUER';

export const CONSULTANT_TYPE_LABELS: Record<ConsultantType, string> = {
  CA: 'Chartered Accountant',
  CS: 'Company Secretary',
  ADVOCATE: 'Advocate / Solicitor',
  VALUER: 'Valuer',
};

export interface ConsultantProfile {
  userId: string;
  email: string;
  consultantType: ConsultantType;
  name: string | null;
  firm: string | null;
  registrationNumber: string | null;
  completed: boolean;
}
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
export const DEMO_SHORTCUTS: readonly { role: DemoRole; title: string; detail: string }[] = [
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

export const FUNDING_STAGES: readonly { value: FundingStage; label: string }[] = [
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

export const INVESTOR_TYPES: readonly { value: InvestorType; label: string }[] = [
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

export const VISIBILITY_OPTIONS: readonly { value: DataRoomVisibility; label: string }[] = [
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
  // Public structured detail (VMB profile).
  usp: string | null;
  businessModel: string | null;
  marketSize: string | null;
  targetSegment: string | null;
  marketGeography: string | null;
  // Classification + funding requirement + operations (public).
  natureOfBusiness: NatureOfBusiness[];
  businessStage: BusinessStage | null;
  companyClassification: CompanyClassification | null;
  fundingRequirementType: FundingRequirementType | null;
  fundingInstrument: string | null;
  fundingUseSummary: string | null;
  manufacturing: string | null;
  operations: string | null;
  promoters: Promoter[];
  groupCompanies: GroupCompany[];
  productsServices: ProductServiceItem[];
  competitors: Competitor[];
  swotItems: SwotItem[];
  keyCustomers: NamedItem[];
  suppliers: NamedItem[];
  journey: Milestone[];
  /** Lets the UI show a locked state without firing a request that 404s. */
  access: {
    financials: boolean;
    fundingHistory: boolean;
    risks: boolean;
    futurePlans: boolean;
    shareholding: boolean;
    projectedFinancials: boolean;
  };
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  occurredOn: string;
  achieved: boolean;
}

export interface FinancialRatios {
  arrGrowthPct?: number;
  runwayMonthsFromCash?: number;
  revenuePerEmployee?: number;
  burnMultiple?: number;
  arrToMrrMultiple?: number;
}

export interface BenchmarkPeer {
  id: string;
  peerName: string;
  arr: number | null;
  growthPct: number | null;
  grossMarginPct: number | null;
  note: string | null;
}

export interface Financials {
  mrr: number | null;
  arr: number | null;
  monthlyBurn: number | null;
  runwayMonths: number | null;
  useOfFunds: string | null;
  annualRevenue: number | null;
  grossMarginPct: number | null;
  cashBalance: number | null;
  priorYearArr: number | null;
  financialsVisibility: DataRoomVisibility;
  ratios: FinancialRatios;
  benchmarkPeers: BenchmarkPeer[];
}

// ── Deep profile (VMB structured sections) ────────────────────
export interface Promoter {
  id: string;
  name: string;
  background: string | null;
  shareholdingPct: number | null;
  priorExperience: string | null;
}

export interface GroupCompany {
  id: string;
  name: string;
  relationship: string | null;
  ownershipPct: number | null;
}

export interface ProductServiceItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

export interface Competitor {
  id: string;
  name: string;
  differentiation: string | null;
}

export type SwotCategory = 'STRENGTH' | 'WEAKNESS' | 'OPPORTUNITY' | 'THREAT';

export interface SwotItem {
  id: string;
  category: SwotCategory;
  text: string;
}

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskItem {
  id: string;
  title: string;
  description: string | null;
  severity: RiskSeverity | null;
}

export interface FuturePlan {
  id: string;
  title: string;
  description: string | null;
  timeframe: string | null;
}

/** Everything the founder's editor loads from GET /founder/profile/sections. */
// ── Broader Investee scope (PRD v2 §7/§8) ─────────────────────
export type NatureOfBusiness = 'MANUFACTURING' | 'TRADING' | 'SERVICE';
export type BusinessStage =
  | 'IDEA' | 'STARTUP' | 'EARLY_REVENUE' | 'GROWTH' | 'EXPANSION' | 'MATURE' | 'TURNAROUND';
export type CompanyClassification =
  | 'MSME' | 'LARGE_ENTERPRISE' | 'LISTED' | 'UNLISTED' | 'GOVERNMENT' | 'PSU';
export type FundingRequirementType =
  | 'SEED' | 'ANGEL' | 'GROWTH' | 'EXPANSION' | 'BRIDGE' | 'PRE_IPO' | 'STRATEGIC' | 'ACQUISITION';

export interface Shareholder {
  id: string;
  name: string;
  shareClass: string | null;
  percentage: number | null;
}

export interface NamedItem {
  id: string;
  name: string;
  description: string | null;
}

export interface ProjectedFinancial {
  id: string;
  periodLabel: string;
  revenue: number | null;
  ebitda: number | null;
  note: string | null;
}

export interface SectorOption {
  id: string;
  name: string;
}

export interface OwnSections {
  companyName: string | null;
  sector: string | null;
  usp: string | null;
  businessModel: string | null;
  marketSize: string | null;
  targetSegment: string | null;
  marketGeography: string | null;
  natureOfBusiness: NatureOfBusiness[];
  businessStage: BusinessStage | null;
  companyClassification: CompanyClassification | null;
  fundingRequirementType: FundingRequirementType | null;
  fundingInstrument: string | null;
  fundingUseSummary: string | null;
  fundingSought: number | null;
  manufacturing: string | null;
  operations: string | null;
  risksVisibility: DataRoomVisibility;
  futurePlansVisibility: DataRoomVisibility;
  shareholdingVisibility: DataRoomVisibility;
  projectedFinancialsVisibility: DataRoomVisibility;
  promoters: Promoter[];
  groupCompanies: GroupCompany[];
  productsServices: ProductServiceItem[];
  competitors: Competitor[];
  swotItems: SwotItem[];
  riskItems: RiskItem[];
  futurePlanItems: FuturePlan[];
  journey: Milestone[];
  shareholders: Shareholder[];
  keyCustomers: NamedItem[];
  suppliers: NamedItem[];
  projectedFinancials: ProjectedFinancial[];
  completionScore: number;
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

export type ProfileSection =
  | 'FINANCIALS' | 'FUNDING_HISTORY' | 'RISKS' | 'FUTURE_PLANS'
  | 'SHAREHOLDING' | 'PROJECTED_FINANCIALS';

export interface RiskList {
  items: RiskItem[];
}

export interface FuturePlanList {
  items: FuturePlan[];
}

export interface ShareholderList {
  items: Shareholder[];
}

export interface ProjectedFinancialList {
  items: ProjectedFinancial[];
}

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

// ── Deal Management (PRD v2 §5) ────────────────────────────────
export type DealStage =
  | 'INTEREST' | 'MEETING_SCHEDULED' | 'NDA' | 'DATA_ROOM_ACCESS'
  | 'DUE_DILIGENCE' | 'OFFER' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export type DealEventKind =
  | 'CREATED' | 'STAGE_CHANGED' | 'COMMENT' | 'TASK_ADDED' | 'TASK_COMPLETED';

/** Ordered stages (terminal states last), for the stage picker/stepper. */
export const DEAL_STAGES: readonly { value: DealStage; label: string }[] = [
  { value: 'INTEREST', label: 'Interest' },
  { value: 'MEETING_SCHEDULED', label: 'Meeting Scheduled' },
  { value: 'NDA', label: 'NDA' },
  { value: 'DATA_ROOM_ACCESS', label: 'Data Room Access' },
  { value: 'DUE_DILIGENCE', label: 'Due Diligence' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED_WON', label: 'Closed Won' },
  { value: 'CLOSED_LOST', label: 'Closed Lost' },
];

export interface DealParty {
  userId: string;
  email: string;
  name: string;
}

export interface DealSummary {
  id: string;
  stage: DealStage;
  stageLabel: string;
  status: DealStatus;
  createdAt: string;
  updatedAt: string;
  founder: DealParty;
  investor: DealParty;
}

export interface DealEvent {
  id: string;
  kind: DealEventKind;
  body: string;
  createdAt: string;
  actor: { id: string; email: string; role: Role } | null;
}

export interface DealTask {
  id: string;
  title: string;
  done: boolean;
  completedAt: string | null;
}

export interface DealDetail extends DealSummary {
  timeline: DealEvent[];
  tasks: DealTask[];
}
