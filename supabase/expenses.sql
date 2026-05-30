-- ============================================================
-- GymOS — المصروفات (نفّذ في Supabase SQL Editor)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'trainer_salary',
    'rent',
    'utilities',
    'equipment',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  spent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_gym_id ON expenses(gym_id);
CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON expenses(spent_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their gym expenses" ON expenses;
CREATE POLICY "Users can view their gym expenses"
  ON expenses FOR SELECT
  USING (gym_id = get_user_gym_id());

DROP POLICY IF EXISTS "Users can insert expenses to their gym" ON expenses;
CREATE POLICY "Users can insert expenses to their gym"
  ON expenses FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

DROP POLICY IF EXISTS "Users can update their gym expenses" ON expenses;
CREATE POLICY "Users can update their gym expenses"
  ON expenses FOR UPDATE
  USING (gym_id = get_user_gym_id());

DROP POLICY IF EXISTS "Users can delete their gym expenses" ON expenses;
CREATE POLICY "Users can delete their gym expenses"
  ON expenses FOR DELETE
  USING (gym_id = get_user_gym_id());

-- بعد التنفيذ: أعد تشغيل finance-analytics.sql لتحديث دالة التحليلات
