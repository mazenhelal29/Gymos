-- ============================================================
-- GymOS — تشغيل على مشروع Supabase موجود مسبقاً
-- لا تلصق schema.sql كاملاً إذا كانت الجداول موجودة.
-- نفّذ هذا الملف فقط في: Supabase → SQL Editor → Run
-- ============================================================

-- دالة مساعدة (آمنة للتكرار)
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID AS $$
  SELECT gym_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- سياسة قراءة الملف الشخصي (مطلوبة لتحميل gym_id بعد تسجيل الدخول)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- قراءة الملف عبر الدالة (تتجاوز مشاكل RLS عند تسجيل الدخول)
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

-- تحليلات المالية: نفّذ أيضاً ملف finance-analytics.sql
-- سوبر أدمن: نفّذ ملف super-admin.sql ثم أضف بريدك في super_admins
