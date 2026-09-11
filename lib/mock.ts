import type {
  AdminStats,
  AdminUserRow,
  Milestone,
  OverviewStats,
  Referral,
  RewardClaim,
  Transaction,
  TreeMember,
  TreeStatsData,
} from '@/types';

/**
 * Demo data used to render the UI when the backend is not yet wired up.
 * Pages attempt the real API first and fall back to these values.
 */

export const mockOverview: OverviewStats = {
  totalEarnings: 184500,
  walletBalance: 42300,
  directReferrals: 12,
  maxDirectReferrals: 4,
  referralSlotsFull: false,
  qualifiedDirects: 3,
  daysLeftInWindow: 2,
  isSmart: true,
  currentLevel: 2,
  totalDownline: 269,
  activeDownline: 241,
  rank: 'Gold',
};

export const mockTransactions: Transaction[] = [
  { id: 't1', date: '2026-07-18', type: 'binary', description: 'Binary matching bonus', amount: 6400, status: 'completed' },
  { id: 't2', date: '2026-07-16', type: 'referral', description: 'Direct referral bonus', amount: 2500, status: 'completed' },
  { id: 't3', date: '2026-07-14', type: 'reward', description: 'Gold rank milestone', amount: 10000, status: 'completed' },
  { id: 't4', date: '2026-07-12', type: 'withdrawal', description: 'Bank withdrawal', amount: -15000, status: 'pending' },
  { id: 't5', date: '2026-07-09', type: 'binary', description: 'Binary matching bonus', amount: 4200, status: 'completed' },
  { id: 't6', date: '2026-07-05', type: 'referral', description: 'Direct referral bonus', amount: 2500, status: 'completed' },
  { id: 't7', date: '2026-07-02', type: 'withdrawal', description: 'Bank withdrawal', amount: -8000, status: 'failed' },
];

export const mockReferrals: Referral[] = [
  { id: 'r1', name: 'Anita Sharma', joinedAt: '2026-07-15', packageId: 'B', status: 'active' },
  { id: 'r2', name: 'Rahul Verma', joinedAt: '2026-07-12', packageId: 'A', status: 'active' },
  { id: 'r3', name: 'Priya Nayak', joinedAt: '2026-07-08', packageId: 'B', status: 'active' },
  { id: 'r4', name: 'Sourav Das', joinedAt: '2026-07-03', packageId: 'A', status: 'pending' },
  { id: 'r5', name: 'Meera Patel', joinedAt: '2026-06-28', packageId: 'A', status: 'inactive' },
];

function member(
  id: string,
  name: string,
  packageId: 'A' | 'B',
  status: 'active' | 'inactive' | 'pending',
  joinedAt: string,
  left?: TreeMember | null,
  right?: TreeMember | null
): TreeMember {
  return { id, name, referralCode: `USOS${id.toUpperCase()}`, packageId, status, joinedAt, left, right };
}

export const mockGenealogy: TreeMember = member(
  'you',
  'You',
  'B',
  'active',
  '2026-01-10',
  member(
    'l1',
    'Anita Sharma',
    'B',
    'active',
    '2026-07-15',
    member('l1a', 'Karan Singh', 'A', 'active', '2026-07-18'),
    member('l1b', 'Divya Rao', 'B', 'pending', '2026-07-19')
  ),
  member(
    'r1',
    'Rahul Verma',
    'A',
    'active',
    '2026-07-12',
    member('r1a', 'Sneha Jena', 'A', 'active', '2026-07-16'),
    member('r1b', 'Amit Kar', 'B', 'inactive', '2026-07-17')
  )
);

export const mockTreeStats: TreeStatsData = {
  totalMembers: 269,
  leftCount: 148,
  rightCount: 121,
  activeCount: 231,
  levels: 7,
};

export const mockMilestones: Milestone[] = [
  { id: 'm1', title: 'Starter', description: 'Enroll your first 3 direct members', target: 3, current: 3, reward: '₹1,000 bonus', achieved: true },
  { id: 'm2', title: 'Silver', description: 'Build a team of 25 members', target: 25, current: 25, reward: '₹5,000 + kit', achieved: true },
  { id: 'm3', title: 'Gold', description: 'Grow your network to 100 members', target: 100, current: 100, reward: '₹10,000 + tour', achieved: true },
  { id: 'm4', title: 'Platinum', description: 'Reach 250 active members', target: 250, current: 231, reward: '₹25,000 + laptop', achieved: false },
  { id: 'm5', title: 'Diamond', description: 'Reach 500 active members', target: 500, current: 231, reward: '₹75,000 + bike', achieved: false },
];

export const mockAdminStats: AdminStats = {
  totalRevenue: 8940000,
  totalUsers: 3421,
  activeUsers: 2987,
  totalPayouts: 3120000,
  pendingPayouts: 245800,
  pendingRewards: 18,
  monthlyGrowth: 12.4,
  kycTotal: 420,
  kycPending: 120,
  kycApproved: 250,
  kycRejected: 50,
};

export const mockAdminUsers: AdminUserRow[] = [
  { id: 'u1', name: 'Anita Sharma', email: 'anita@example.com', phone: '9876543210', packageId: 'B', status: 'active', joinedAt: '2026-07-15', totalEarningsPaise: 4230000, earnings: 42300 },
  { id: 'u2', name: 'Rahul Verma', email: 'rahul@example.com', phone: '9876543211', packageId: 'A', status: 'active', joinedAt: '2026-07-12', totalEarningsPaise: 1870000, earnings: 18700 },
  { id: 'u3', name: 'Priya Nayak', email: 'priya@example.com', phone: '9876543212', packageId: 'B', status: 'active', joinedAt: '2026-07-08', totalEarningsPaise: 6510000, earnings: 65100 },
  { id: 'u4', name: 'Sourav Das', email: 'sourav@example.com', phone: '9876543213', packageId: 'A', status: 'pending', joinedAt: '2026-07-03', totalEarningsPaise: 0, earnings: 0 },
  { id: 'u5', name: 'Meera Patel', email: 'meera@example.com', phone: '9876543214', packageId: 'A', status: 'inactive', joinedAt: '2026-06-28', totalEarningsPaise: 920000, earnings: 9200 },
  { id: 'u6', name: 'Karan Singh', email: 'karan@example.com', phone: '9876543215', packageId: 'A', status: 'active', joinedAt: '2026-06-20', totalEarningsPaise: 2450000, earnings: 24500 },
];

export const mockRewardClaims: RewardClaim[] = [
  {
    id: 'c1',
    userName: 'Priya Nayak',
    milestone: 'mission_l1',
    level: 1,
    cashPaise: 80000,
    materialReward: 'T-Shirt',
    requestedAt: '2026-07-18',
    status: 'pending',
  },
  {
    id: 'c2',
    userName: 'Karan Singh',
    milestone: 'mission_l2',
    level: 2,
    cashPaise: 320000,
    materialReward: 'Iron Box',
    requestedAt: '2026-07-17',
    status: 'pending',
  },
  {
    id: 'c3',
    userName: 'Anita Sharma',
    milestone: 'mission_l3',
    level: 3,
    cashPaise: 800000,
    materialReward: 'Ceiling Fan',
    requestedAt: '2026-07-16',
    status: 'pending',
  },
  {
    id: 'c4',
    userName: 'Rahul Verma',
    milestone: 'mission_l1',
    level: 1,
    cashPaise: 80000,
    materialReward: 'T-Shirt',
    requestedAt: '2026-07-14',
    status: 'approved',
  },
];

export const mockRevenueSeries: { month: string; value: number }[] = [
  { month: 'Feb', value: 620000 },
  { month: 'Mar', value: 710000 },
  { month: 'Apr', value: 680000 },
  { month: 'May', value: 820000 },
  { month: 'Jun', value: 910000 },
  { month: 'Jul', value: 1040000 },
];

export const mockMemberGrowthSeries: { label: string; members: number }[] = [
  { label: '25 Jul', members: 4120 },
  { label: '1 Aug', members: 4280 },
  { label: '8 Aug', members: 4410 },
  { label: '15 Aug', members: 4520 },
  { label: '22 Aug', members: 4630 },
  { label: '29 Aug', members: 4756 },
];
