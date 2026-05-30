// ─── Database Row Types ──────────────────────────────────────────────────────

export interface Gym {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface User {
  id: string;
  gym_id: string;
  full_name: string;
  role: 'owner' | 'staff';
  created_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender: 'male' | 'female' | null;
  age: number | null;
  weight: number | string | null;
  status: 'active' | 'inactive' | 'frozen';
  join_date: string;
  notes: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  gym_id: string;
  member_id: string;
  plan_name: string;
  price: number;
  start_date: string;
  end_date: string;
  payment_status: 'paid' | 'unpaid' | 'partial';
  created_at: string;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'other';
  paid_at: string;
}

export type ExpenseCategory =
  | 'trainer_salary'
  | 'rent'
  | 'utilities'
  | 'equipment'
  | 'other';

export interface Expense {
  id: string;
  gym_id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  description: string | null;
  spent_at: string;
  created_at: string;
}

// ─── SaaS Subscriptions (Super Admin) ─────────────────────────────────────────

export type SaasPlanType = '1_month' | '3_months' | '6_months' | 'yearly' | 'lifetime';
export type SaasSubscriptionStatus = 'active' | 'expired' | 'suspended' | 'cancelled';
export type SaasPaymentStatus = 'paid' | 'pending' | 'overdue' | 'refunded';
export type SaasPaymentMethod = 'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer' | 'card';

export interface SaasSettings {
  id: string;
  monthly_price: number;
  three_month_price: number;
  six_month_price: number;
  yearly_price: number;
  lifetime_price: number;
  updated_at: string;
}

export interface GymSubscription {
  id: string;
  gym_id: string;
  plan_type: SaasPlanType;
  amount: number;
  start_date: string;
  end_date: string | null;
  payment_status: SaasPaymentStatus;
  payment_method: SaasPaymentMethod;
  status: SaasSubscriptionStatus;
  paid_at: string;
  created_at: string;
}

// ─── Insert Types ────────────────────────────────────────────────────────────

export type InsertGym = Omit<Gym, 'id' | 'created_at'>;

export type InsertMember = Omit<Member, 'id' | 'created_at'>;

export type InsertSubscription = Omit<Subscription, 'id' | 'created_at'>;

export type InsertPayment = Omit<Payment, 'id'>;

export type InsertExpense = Omit<Expense, 'id' | 'created_at'>;

export type InsertGymSubscription = Omit<GymSubscription, 'id' | 'created_at' | 'paid_at'>;
