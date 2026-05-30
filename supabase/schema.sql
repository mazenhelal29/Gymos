-- ============================================================
-- GymOS SaaS - Complete Database Schema
-- Multi-tenant architecture with Row Level Security (RLS)
--
-- ⚠️ مشروع Supabase جديد (فارغ) فقط:
--     نفّذ هذا الملف مرة واحدة.
--
-- ⚠️ المشروع فيه جداول بالفعل (خطأ user_role already exists):
--     لا تلصق هذا الملف. استخدم بدلاً منه:
--     supabase/patch-existing-project.sql
-- ============================================================

-- ─── Enums ──────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('owner', 'staff');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'frozen');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE payment_status AS ENUM ('paid', 'unpaid', 'partial');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'other');
CREATE TYPE saas_plan_type AS ENUM ('1_month', '3_months', '6_months', 'yearly', 'lifetime');
CREATE TYPE saas_subscription_status AS ENUM ('active', 'expired', 'suspended', 'cancelled');
CREATE TYPE saas_payment_status AS ENUM ('paid', 'pending', 'overdue', 'refunded');
CREATE TYPE saas_payment_method AS ENUM ('cash', 'vodafone_cash', 'instapay', 'bank_transfer', 'card');

-- ─── Gyms ───────────────────────────────────────────────────
CREATE TABLE gyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Users ──────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'owner' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Members ────────────────────────────────────────────────
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  gender gender,
  age INTEGER,
  weight NUMERIC(5,2),
  join_date DATE DEFAULT CURRENT_DATE NOT NULL,
  status member_status DEFAULT 'active' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Subscriptions ──────────────────────────────────────────
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_status payment_status DEFAULT 'unpaid' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Payments ───────────────────────────────────────────────
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method payment_method DEFAULT 'cash' NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- بعد payments — المصروفات (أو نفّذ expenses.sql على مشروع موجود)
CREATE TYPE expense_category AS ENUM ('trainer_salary', 'rent', 'utilities', 'equipment', 'other');

CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  spent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_expenses_gym_id ON expenses(gym_id);
CREATE INDEX idx_expenses_spent_at ON expenses(spent_at);

-- ─── SaaS Settings ──────────────────────────────────────────
CREATE TABLE saas_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  three_month_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  six_month_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  yearly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  lifetime_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default pricing
INSERT INTO saas_settings (monthly_price, three_month_price, six_month_price, yearly_price, lifetime_price)
VALUES (1000, 2500, 4500, 8000, 20000);

-- ─── Gym Subscriptions (SaaS) ───────────────────────────────
CREATE TABLE gym_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  plan_type saas_plan_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  payment_status saas_payment_status DEFAULT 'paid' NOT NULL,
  payment_method saas_payment_method DEFAULT 'cash' NOT NULL,
  status saas_subscription_status DEFAULT 'active' NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_users_gym_id ON users(gym_id);
CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_subscriptions_gym_id ON subscriptions(gym_id);
CREATE INDEX idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_payments_gym_id ON payments(gym_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_gym_subscriptions_gym_id ON gym_subscriptions(gym_id);
CREATE INDEX idx_gym_subscriptions_status ON gym_subscriptions(status);

-- ============================================================
-- Helper Functions
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID AS $$
  SELECT gym_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_gym_profile()
RETURNS TABLE (gym_id UUID, full_name TEXT, role user_role)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.gym_id, u.full_name, u.role
  FROM users u
  WHERE u.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_gym_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_gym_profile() TO anon;

-- Finance analytics RPC — see finance-analytics.sql (run after schema on fresh projects)

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_subscriptions ENABLE ROW LEVEL SECURITY;

-- ─── Gyms Policies ─────────────────────────────────────────
CREATE POLICY "Users can view their own gym"
  ON gyms FOR SELECT
  USING (id = get_user_gym_id());

CREATE POLICY "Users can update their own gym"
  ON gyms FOR UPDATE
  USING (id = get_user_gym_id());

CREATE POLICY "Allow gym creation during signup"
  ON gyms FOR INSERT
  WITH CHECK (true);

-- ─── Users Policies ────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view gym staff"
  ON users FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Allow user creation during signup"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ─── Members Policies ──────────────────────────────────────
CREATE POLICY "Users can view their gym members"
  ON members FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert members to their gym"
  ON members FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update their gym members"
  ON members FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete their gym members"
  ON members FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ─── Subscriptions Policies ────────────────────────────────
CREATE POLICY "Users can view their gym subscriptions"
  ON subscriptions FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert subscriptions to their gym"
  ON subscriptions FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update their gym subscriptions"
  ON subscriptions FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete their gym subscriptions"
  ON subscriptions FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ─── Payments Policies ─────────────────────────────────────
CREATE POLICY "Users can view their gym payments"
  ON payments FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert payments to their gym"
  ON payments FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update their gym payments"
  ON payments FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete their gym payments"
  ON payments FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ─── Expenses Policies ─────────────────────────────────────
CREATE POLICY "Users can view their gym expenses"
  ON expenses FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert expenses to their gym"
  ON expenses FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update their gym expenses"
  ON expenses FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete their gym expenses"
  ON expenses FOR DELETE
  USING (gym_id = get_user_gym_id());

-- ─── SaaS Settings Policies ────────────────────────────────
CREATE POLICY "Anyone can view saas settings"
  ON saas_settings FOR SELECT
  USING (true);

-- ─── Gym Subscriptions Policies ────────────────────────────
CREATE POLICY "Users can view their gym subscription"
  ON gym_subscriptions FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Allow gym_subscriptions creation during signup"
  ON gym_subscriptions FOR INSERT
  WITH CHECK (true);