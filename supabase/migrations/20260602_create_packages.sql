-- إنشاء جدول الباقات
CREATE TABLE packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ربط الباقات بالاشتراكات
ALTER TABLE subscriptions 
ADD COLUMN package_id UUID REFERENCES packages(id) ON DELETE SET NULL;

-- إنشاء فهارس (Indexes)
CREATE INDEX idx_packages_gym_id ON packages(gym_id);
CREATE INDEX idx_subscriptions_package_id ON subscriptions(package_id);

-- سياسات الأمان (RLS)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their gym packages"
  ON packages FOR SELECT
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can insert packages to their gym"
  ON packages FOR INSERT
  WITH CHECK (gym_id = get_user_gym_id());

CREATE POLICY "Users can update their gym packages"
  ON packages FOR UPDATE
  USING (gym_id = get_user_gym_id());

CREATE POLICY "Users can delete their gym packages"
  ON packages FOR DELETE
  USING (gym_id = get_user_gym_id());
