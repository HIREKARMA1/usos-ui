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
  packageId: PackageId;
  status: AccountStatus;
  level: number;
  joinedAt: string;
  totalEarningsPaise: number;
  earnings: number;
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
  payment?: UpiPayment | null;
}

export interface PaymentSettings {
  upi_id: string;
  display_name: string;
  qr_code_url?: string | null;
  instructions: string;
  updated_at?: string | null;
}

export interface AdminPaymentRow {
  id: string;
  kind?: string;
  user_id: string;
  user_name: string;
  email: string;
  application_id: string;
  package_name?: string | null;
  amount_paise: number;
  amount_inr: number;
  currency: string;
  payment_method: string;
  transaction_id?: string | null;
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
