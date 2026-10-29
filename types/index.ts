import type { BinarySide, PackageId, UserRole } from '@/lib/constants';

export type { BinarySide, PackageId, UserRole };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  referralCode: string;
  usosId?: string;
  packageId?: PackageId;
  status?: AccountStatus;
}

export interface TokenResponse {
  access_token: string;
  role: UserRole;
  user: AuthUser;
}

export type AccountStatus = 'active' | 'inactive' | 'pending';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type TransactionType = 'referral' | 'binary' | 'reward' | 'withdrawal' | 'payment';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
}

export interface OverviewStats {
  totalEarnings: number;
  walletBalance: number;
  directReferrals: number;
  maxDirectReferrals?: number;
  referralSlotsFull?: boolean;
  treeSlotsUsed?: number;
  qualifiedDirects?: number;
  daysLeftInWindow?: number | null;
  isSmart?: boolean;
  currentLevel?: number;
  totalDownline: number;
  activeDownline: number;
  rank: string;
  kycStatus?: string;
  kycRejectedReason?: string | null;
}

export interface TreeMember {
  id: string;
  name: string;
  referralCode: string;
  packageId: PackageId;
  status: AccountStatus;
  joinedAt: string;
  children?: TreeMember[];
  /** @deprecated binary layout removed */
  side?: BinarySide;
  left?: TreeMember | null;
  right?: TreeMember | null;
}

export interface TreeStatsData {
  totalMembers: number;
  leftCount: number;
  rightCount: number;
  activeCount: number;
  levels: number;
}

export interface Referral {
  id: string;
  name: string;
  joinedAt: string;
  packageId: PackageId;
  status: AccountStatus;
  referralCode?: string;
  usosId?: string;
}

export interface PackagePlan {
  id: string;
  code: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  badge?: string;
  stock?: number;
  isActive?: boolean;
  createdAt?: string;
  imageUrl?: string;
  items?: { name: string; quantity: number }[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  achieved: boolean;
}

export interface AdminUserRow {
  id: string;
  usosId?: string;
  name: string;
  email: string;
  phone: string;
  referralCode?: string;
  sponsorName?: string;
  sponsorUsosId?: string;
  packageId: PackageId;
  status: AccountStatus;
  rawStatus?: string;
  statusReason?: string;
  initialPaymentStatus?: string;
  monthlyEligiblePaise?: number;
  monthlyThresholdPaise?: number;
  monthlyPeriod?: string;
  level: number;
  joinedAt: string;
  totalEarningsPaise: number;
  earnings: number;
}

export interface ActivationMonthRow {
  period: string;
  eligiblePaise: number;
  thresholdPaise: number;
  exempt: boolean;
  closed: boolean;
  outcome: string;
}

export interface ActivationHistoryEntry {
  id: string;
  period?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason: string;
  eligiblePaise?: number | null;
  thresholdPaise?: number | null;
  source: string;
  createdAt: string;
}

export interface AdminActivationDetail {
  displayStatus: AccountStatus;
  statusReason: string;
  initialPaymentStatus: string;
  monthlyEligiblePaise: number;
  monthlyThresholdPaise: number;
  monthlyPeriod?: string;
  months: ActivationMonthRow[];
  history: ActivationHistoryEntry[];
}

export type RewardClaimStatus = 'pending' | 'approved' | 'fulfilled' | 'rejected';

export interface RewardClaim {
  id: string;
  userName: string;
  referralCode?: string;
  milestone: string;
  level?: number;
  cashPaise: number;
  materialReward?: string | null;
  requestedAt: string;
  status: RewardClaimStatus;
}

export interface MemberGrowthPoint {
  label: string;
  members: number;
}

export interface RevenueMonthPoint {
  month: string;
  value: number;
}

export interface AdminStats {
  totalRevenue: number;
  totalUsers: number;
  activeUsers: number;
  totalPayouts: number;
  pendingPayouts: number;
  pendingRewards: number;
  monthlyGrowth: number;
  kycTotal: any;
  kycPending: any;
  kycApproved: any;
  kycRejected: any;
  memberGrowth: MemberGrowthPoint[];
  revenueMonths: RevenueMonthPoint[];
}

export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface KycStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface KycRow {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  referral_code?: string | null;
  pan_number?: string | null;
  aadhaar_number?: string | null;
  aadhaar_masked?: string | null;
  kyc_status: KycStatus;
  rejected_reason?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
}

export interface KycListResponse {
  total: number;
  page: number;
  page_size: number;
  items: KycRow[];
  stats: KycStats;
}

export interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  read_at?: string | null;
  created_at?: string | null;
}

export interface UpiPayment {
  id: string;
  user_id: string;
  application_id: string;
  package_id?: string | null;
  amount_paise: number;
  amount_inr: number;
  currency: string;
  payment_method: string;
  transaction_id?: string | null;
  payment_reference?: string | null;
  status: string;
  submitted_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UpiCheckout {
  upi_id: string;
  display_name: string;
  qr_code_url?: string | null;
  instructions: string[];
  amount_paise: number;
  amount_inr: number;
  currency: string;
  package_name?: string | null;
  order_id?: string | null;
  payment_reference?: string | null;
  upi_intent_url?: string | null;
  intent_ready?: boolean;
  previous_rejection_reason?: string | null;
  payment?: UpiPayment | null;
}

export interface PaymentSettings {
  upi_id: string;
  display_name: string;
  qr_code_url?: string | null;
  instructions: string;
  updated_at?: string | null;
}

export interface AdminPaymentItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
  image_url?: string | null;
}

export interface AdminPaymentRow {
  id: string;
  kind?: string;
  user_id: string;
  user_name: string;
  email: string;
  phone?: string | null;
  member_id?: string | null;
  referral_code?: string | null;
  kyc_status?: string | null;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_pincode?: string | null;
  application_id: string;
  package_name?: string | null;
  items?: AdminPaymentItem[];
  amount_paise: number;
  amount_inr: number;
  currency: string;
  payment_method: string;
  transaction_id?: string | null;
  payment_reference?: string | null;
  upi_id?: string | null;
  status: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  created_at?: string | null;
}

export interface AdminPaymentList {
  items: AdminPaymentRow[];
  total: number;
  page: number;
  page_size: number;
  stats: { total: number; pending: number; approved: number; rejected: number };
}

export interface PaymentOrder {
  action?: string;
  fields?: Record<string, string>;
  provider?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  checkout?: {
    mode?: string;
    action_url?: string;
    params?: Record<string, string>;
    key_id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme?: {
      color?: string;
    };
    [key: string]: any;
  };
}
