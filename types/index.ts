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
}

export interface PaymentOrder {
  action: string;
  fields: Record<string, string>;
}
