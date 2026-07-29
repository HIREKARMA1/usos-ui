import type { BinarySide, PackageId, UserRole } from '@/lib/constants';

export type { BinarySide, PackageId, UserRole };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  referralCode: string;
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
  activatedAt?: string | null;
  windowEndsAt?: string | null;
  seatsRemaining?: number;
  coachStatus?: 'not_activated' | 'racing' | 'smart_unlocked' | 'window_closed' | string;
  nextLevel?: number | null;
  nextRank?: string | null;
  nextCash?: number | null;
  nextMaterialReward?: string | null;
  packageCode?: string | null;
  packageName?: string | null;
  packageItems?: Array<{ name: string; quantity: number }>;
  sponsorLabel?: string | null;
  pointsUserShareBps?: number;
  pointsSponsorShareBps?: number;
}

export interface ProofEvent {
  id: string;
  kind: 'payout' | 'reward' | string;
  title: string;
  amountPaise: number;
  materialReward?: string | null;
  memberLabel: string;
  occurredAt: string;
}

export interface ProofWall {
  totalPayoutsPaise: number;
  totalRewardCashPaise: number;
  payoutCount: number;
  rewardCount: number;
  events: ProofEvent[];
}

export interface TrustRules {
  rules: {
    max_direct_referrals?: number;
    qualification_window_days?: number;
    description?: string;
  };
  levels: Array<{
    level: number;
    nodes: number;
    title?: string;
    cash_paise: number;
    material_reward?: string | null;
  }>;
  points: {
    point_value_paise: number;
    user_share_bps: number;
    sponsor_share_bps: number;
  };
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
}

export interface PackagePlan {
  id: PackageId;
  name: string;
  price: number;
  description: string;
  features: string[];
  badge?: string;
  stock?: number;
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
  name: string;
  email: string;
  phone: string;
  packageId: PackageId;
  status: AccountStatus;
  joinedAt: string;
  earnings: number;
}

export interface RewardClaim {
  id: string;
  userName: string;
  milestone: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AdminStats {
  totalRevenue: number;
  totalUsers: number;
  activeUsers: number;
  totalPayouts: number;
  pendingRewards: number;
  monthlyGrowth: number;
}

export interface PaymentOrder {
  action: string;
  fields: Record<string, string>;
}
