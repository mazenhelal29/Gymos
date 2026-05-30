import type {
  SaasPlanType,
  SaasSubscriptionStatus,
  SaasPaymentStatus,
} from '@gymos/schema';

export type {
  Gym,
  User,
  Member,
  Subscription,
  Payment,
  Expense,
  ExpenseCategory,
  InsertGym,
  InsertMember,
  InsertSubscription,
  InsertPayment,
  InsertExpense,
  SaasSettings,
  GymSubscription,
  SaasPlanType,
  SaasSubscriptionStatus,
  SaasPaymentStatus,
  SaasPaymentMethod,
  InsertGymSubscription,
} from '@gymos/schema';

// ─── API Response Types ──────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Dashboard Types ─────────────────────────────────────
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredSubscriptions: number;
  monthlyRevenue: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface GrowthDataPoint {
  month: string;
  members: number;
}

export interface ExpiringSubscription {
  id: string;
  memberName: string;
  planName: string;
  endDate: string;
  daysLeft: number;
}

// ─── Filter Types ────────────────────────────────────────
export interface MembersFilter {
  search?: string;
  status?: 'active' | 'inactive' | 'frozen' | 'all';
  gender?: 'male' | 'female' | 'all';
  page?: number;
  pageSize?: number;
}

export interface SubscriptionsFilter {
  tab: 'active' | 'expiring' | 'expired';
  expiryRange?: 'today' | '3days' | '7days';
}

export interface PaymentsFilter {
  startDate?: string;
  endDate?: string;
  method?: 'cash' | 'card' | 'bank_transfer' | 'other' | 'all';
  page?: number;
  pageSize?: number;
}

// ─── Auth Types ──────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  gymId: string;
  fullName: string;
  role: 'owner' | 'staff';
  isSuperAdmin?: boolean;
}

export interface PlatformStats {
  total_gyms: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  suspended_subscriptions: number;
  total_platform_revenue: number;
  new_gyms_this_month: number;
  pending_payments: number;
}

export interface AdminGymRow {
  gym_id: string;
  gym_name: string;
  phone: string | null;
  address: string | null;
  gym_created_at: string;
  owner_user_id: string | null;
  owner_name: string | null;
  members_count: number;
  subscription_id: string | null;
  plan_type: SaasPlanType | null;
  subscription_status: SaasSubscriptionStatus | null;
  end_date: string | null;
  payment_status: SaasPaymentStatus | null;
  amount: number | null;
  start_date: string | null;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  gymName: string;
}

export interface LoginData {
  email: string;
  password: string;
}
