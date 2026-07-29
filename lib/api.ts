import axios, { AxiosError, AxiosInstance } from 'axios';
import { env, TOKEN_KEY } from './constants';
import type {
  AdminStats,
  AdminUserRow,
  OverviewStats,
  PackagePlan,
  PaymentOrder,
  ProofWall,
  Referral,
  RewardClaim,
  TokenResponse,
  Transaction,
  TreeMember,
  TrustRules,
  UserRole,
} from '@/types';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function mapRole(role: string): UserRole {
  return role === 'super_admin' ? 'admin' : 'user';
}

class ApiClient {
  readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.apiUrl,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((cfg) => {
      const token = getToken();
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          window.localStorage.removeItem(TOKEN_KEY);
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const res = await this.client.post('/api/v1/auth/login', { email, password });
    const d = res.data;
    return {
      access_token: d.access_token,
      role: mapRole(d.role),
      user: {
        id: d.user_id,
        name: d.full_name,
        email: d.email,
        role: mapRole(d.role),
        referralCode: d.referral_code,
        status: d.status === 'active' ? 'active' : d.status === 'pending_payment' ? 'pending' : 'inactive',
      },
    };
  }

  async googleAuth(body: {
    id_token: string;
    phone?: string;
    package_code?: string;
    sponsor_referral_code?: string;
    full_name?: string;
  }): Promise<TokenResponse> {
    const res = await this.client.post('/api/v1/auth/google', body);
    const d = res.data;
    return {
      access_token: d.access_token,
      role: mapRole(d.role),
      user: {
        id: d.user_id,
        name: d.full_name,
        email: d.email,
        role: mapRole(d.role),
        referralCode: d.referral_code,
        status: d.status === 'active' ? 'active' : d.status === 'pending_payment' ? 'pending' : 'inactive',
      },
    };
  }

  async register(data: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    package_code: string;
    sponsor_referral_code?: string;
    preferred_binary_side?: string;
  }) {
    const res = await this.client.post<{
      message: string;
      user_id: string;
      email: string;
      referral_code: string;
      status: string;
      resumed?: boolean;
    }>('/api/v1/auth/register', data);
    return res.data;
  }

  async createPaymentOrder() {
    const res = await this.client.post('/api/v1/payments/create-order');
    const d = res.data;
    const checkout = d.checkout || {};
    return {
      action: checkout.action_url as string,
      fields: (checkout.params || {}) as Record<string, string>,
      provider: d.provider,
      order_id: d.order_id,
      amount: d.amount,
    } satisfies PaymentOrder & { provider?: string; order_id?: string; amount?: number };
  }

  async getOverview(): Promise<OverviewStats> {
    const d = await this.get<any>('/api/v1/users/overview');
    const max = d.max_direct_referrals || 4;
    const used = d.referral_slots_used ?? d.direct_referral_count ?? 0;
    const rank =
      d.current_rank ||
      (d.current_level ? `Level ${d.current_level}` : `${used}/${max} directs`);
    return {
      totalEarnings: (d.wallet_balance_paise || 0) / 100,
      walletBalance: (d.wallet_balance_paise || 0) / 100,
      directReferrals: used,
      maxDirectReferrals: max,
      referralSlotsFull: Boolean(d.referral_slots_full),
      qualifiedDirects: d.qualified_directs || 0,
      daysLeftInWindow: d.days_left_in_window,
      isSmart: Boolean(d.is_smart),
      currentLevel: d.current_level || 0,
      totalDownline: d.total_downline || 0,
      activeDownline: d.active_downline || 0,
      rank,
      activatedAt: d.activated_at || null,
      windowEndsAt: d.window_ends_at || null,
      seatsRemaining: d.seats_remaining ?? Math.max(max - used, 0),
      coachStatus: d.coach_status || 'not_activated',
      nextLevel: d.next_level ?? null,
      nextRank: d.next_rank ?? null,
      nextCash: d.next_cash_paise != null ? d.next_cash_paise / 100 : null,
      nextMaterialReward: d.next_material_reward ?? null,
      packageCode: d.package_code ?? null,
      packageName: d.package_name ?? null,
      packageItems: Array.isArray(d.package_items) ? d.package_items : [],
      sponsorLabel: d.sponsor_label ?? null,
      pointsUserShareBps: d.points_user_share_bps ?? 5000,
      pointsSponsorShareBps: d.points_sponsor_share_bps ?? 5000,
    };
  }

  async getProofWall(limit = 18): Promise<ProofWall> {
    const d = await this.get<any>(`/api/v1/trust/proof-wall?limit=${limit}`);
    return {
      totalPayoutsPaise: d.total_payouts_paise || 0,
      totalRewardCashPaise: d.total_reward_cash_paise || 0,
      payoutCount: d.payout_count || 0,
      rewardCount: d.reward_count || 0,
      events: (d.events || []).map((e: any) => ({
        id: e.id,
        kind: e.kind,
        title: e.title,
        amountPaise: e.amount_paise || 0,
        materialReward: e.material_reward,
        memberLabel: e.member_label,
        occurredAt: e.occurred_at,
      })),
    };
  }

  async getTrustRules(): Promise<TrustRules> {
    return this.get('/api/v1/trust/rules');
  }

  async getRewardPlan(): Promise<{
    rules: Record<string, unknown>;
    levels: Array<{
      level: number;
      nodes: number;
      title?: string;
      rank_label?: string;
      cash_paise: number;
      material_reward?: string | null;
    }>;
  }> {
    return this.get('/api/v1/rewards/plan');
  }

  async getGenealogy(): Promise<TreeMember> {
    return this.get<TreeMember>('/api/v1/genealogy/my-tree');
  }

  async getWallet(): Promise<Transaction[]> {
    const rows = await this.get<any[]>('/api/v1/wallet/transactions');
    return (rows || []).map((t) => ({
      id: t.id,
      date: t.created_at,
      type: t.category?.includes('referral') || t.category === 'sponsor_share'
        ? 'referral'
        : t.category?.includes('matching')
          ? 'binary'
          : t.category === 'withdrawal'
            ? 'withdrawal'
            : 'reward',
      description: t.description || t.category,
      amount: (t.amount_paise || 0) / 100,
      status: t.status === 'cleared' ? 'completed' : t.status === 'pending' ? 'pending' : 'failed',
    }));
  }

  async getReferrals(): Promise<Referral[]> {
    const rows = await this.get<any[]>('/api/v1/users/referrals');
    return (rows || []).map((r) => ({
      id: r.id,
      name: r.full_name,
      joinedAt: r.created_at,
      packageId: 'A',
      status: r.status === 'active' ? 'active' : 'pending',
      referralCode: r.referral_code,
    }));
  }

  async getPackages(): Promise<PackagePlan[]> {
    const rows = await this.get<any[]>('/api/v1/packages');
    return (rows || []).map((p) => ({
      id: p.code,
      name: p.name,
      price: (p.price_paise || 0) / 100,
      description: p.description || '',
      features: (p.items || []).map((i: any) => i.name),
      stock: p.stock_count,
    }));
  }

  async getAdminStats(): Promise<AdminStats> {
    const d = await this.get<any>('/api/v1/admin/analytics');
    return {
      totalRevenue: (d.gross_revenue_paise || 0) / 100,
      totalUsers: d.total_members || 0,
      activeUsers: d.active_members || 0,
      totalPayouts: (d.cleared_payouts_paise || 0) / 100,
      pendingRewards: d.pending_rewards || 0,
      monthlyGrowth: 0,
    };
  }

  async getAdminUsers(): Promise<AdminUserRow[]> {
    const rows = await this.get<any[]>('/api/v1/admin/users');
    return (rows || []).map((u) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      phone: u.phone || '',
      packageId: 'A',
      status: u.status === 'active' ? 'active' : u.status === 'suspended' ? 'inactive' : 'pending',
      joinedAt: u.created_at,
      earnings: 0,
    }));
  }

  async toggleUserStatus(userId: string, status: string) {
    return this.client.patch(`/api/v1/admin/users/${userId}/status`, { status });
  }

  async getRewardClaims(): Promise<RewardClaim[]> {
    const rows = await this.get<any[]>('/api/v1/rewards/queue');
    return (rows || []).map((r) => ({
      id: r.id,
      userName: r.user_name || r.referral_code || '',
      milestone: r.milestone_key,
      requestedAt: r.achieved_at,
      status:
        r.status === 'approved' || r.status === 'fulfilled'
          ? 'approved'
          : r.status === 'rejected'
            ? 'rejected'
            : 'pending',
    }));
  }

  async getMe() {
    return this.get('/api/v1/auth/me');
  }

  async get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
    const res = await this.client.get<T>(path, { params });
    return res.data;
  }

  async post<T = unknown>(path: string, data?: unknown): Promise<T> {
    const res = await this.client.post<T>(path, data);
    return res.data;
  }

  async patch<T = unknown>(path: string, data?: unknown): Promise<T> {
    const res = await this.client.patch<T>(path, data);
    return res.data;
  }

  async put<T = unknown>(path: string, data?: unknown): Promise<T> {
    const res = await this.client.put<T>(path, data);
    return res.data;
  }

  async delete<T = unknown>(path: string): Promise<T> {
    const res = await this.client.delete<T>(path);
    return res.data;
  }

  // ----- Shop -----

  async getShopProducts() {
    return this.get<any[]>('/api/v1/shop/products');
  }

  async getShopProduct(id: string) {
    return this.get<any>(`/api/v1/shop/products/${id}`);
  }

  async getAdminProducts() {
    return this.get<any[]>('/api/v1/shop/admin/products');
  }

  async createProduct(data: Record<string, unknown>) {
    return this.post('/api/v1/shop/admin/products', data);
  }

  async updateProduct(id: string, data: Record<string, unknown>) {
    return this.patch(`/api/v1/shop/admin/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.delete(`/api/v1/shop/admin/products/${id}`);
  }

  async uploadProductImage(file: File) {
    const body = new FormData();
    body.append('file', file);
    const res = await this.client.post<{ url: string }>('/api/v1/uploads/products', body, {
      // Let the browser set multipart boundary (default JSON Content-Type breaks uploads)
      headers: { 'Content-Type': false as unknown as string },
    });
    return res.data;
  }

  async uploadReviewMedia(file: File) {
    const body = new FormData();
    body.append('file', file);
    const res = await this.client.post<{ url: string; media_type: 'image' | 'video' }>(
      '/api/v1/uploads/reviews',
      body,
      {
        headers: { 'Content-Type': false as unknown as string },
      }
    );
    return res.data;
  }

  async getProductReviews(productId: string) {
    return this.get<{
      avg_rating: number;
      review_count: number;
      items: any[];
    }>(`/api/v1/shop/products/${productId}/reviews`);
  }

  async submitProductReview(
    productId: string,
    payload: {
      rating: number;
      title?: string | null;
      comment?: string | null;
      media?: { media_type: string; url: string }[];
    }
  ) {
    return this.post(`/api/v1/shop/products/${productId}/reviews`, payload);
  }

  async getCart() {
    return this.get<any>('/api/v1/shop/cart');
  }

  async upsertCart(product_id: string, quantity: number) {
    return this.put('/api/v1/shop/cart', { product_id, quantity });
  }

  async checkoutShop(payload: Record<string, unknown>) {
    return this.post<any>('/api/v1/shop/checkout', payload);
  }

  async getShopOrders() {
    return this.get<any[]>('/api/v1/shop/orders');
  }

  async getShopOrder(id: string) {
    return this.get<any>(`/api/v1/shop/orders/${id}`);
  }

  async getPoints() {
    return this.get<any>('/api/v1/shop/points');
  }

  async redeemPoints(points: number) {
    return this.post<any>('/api/v1/shop/points/redeem', { points });
  }

  async withdrawWallet(amountPaise: number) {
    return this.post('/api/v1/wallet/withdraw', { amount_paise: amountPaise });
  }

  async getMyProfile() {
    return this.get<any>('/api/v1/users/me');
  }

  async updateMyLocation(payload: Record<string, unknown>) {
    return this.put<any>('/api/v1/users/me/location', payload);
  }

  async searchLocations(q: string, limit = 8) {
    return this.get<{ items: any[] }>(
      `/api/v1/location/search?q=${encodeURIComponent(q)}&limit=${limit}`
    );
  }

  async reverseGeocode(latitude: number, longitude: number) {
    return this.post<any>('/api/v1/location/reverse', { latitude, longitude });
  }

  async getMyWithdrawals() {
    return this.get<any[]>('/api/v1/wallet/withdrawals');
  }

  async getAdminWithdrawals(status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.get<{ payout_provider: string; items: any[] }>(`/api/v1/wallet/admin/withdrawals${q}`);
  }

  async approveWithdrawal(id: string, note?: string) {
    return this.post(`/api/v1/wallet/admin/withdrawals/${id}/approve`, { note: note || null });
  }

  async rejectWithdrawal(id: string, note?: string) {
    return this.post(`/api/v1/wallet/admin/withdrawals/${id}/reject`, { note: note || null });
  }
}

export const api = new ApiClient();

export function roleHome(role: UserRole): string {
  return role === 'admin' ? '/admin' : '/user';
}
