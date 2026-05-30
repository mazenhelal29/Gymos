-- ============================================================
-- GymOS — Super Admin (نفّذ في Supabase SQL Editor)
-- بعد التنفيذ: أضف نفسك كسوبر أدمن (انظر الأسفل)
-- ============================================================

CREATE TABLE IF NOT EXISTS super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- ─── إحصائيات المنصة ───────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_gyms', (SELECT COUNT(*)::int FROM gyms),
      'active_subscriptions', (
        SELECT COUNT(DISTINCT gym_id)::int FROM gym_subscriptions WHERE status = 'active'
      ),
      'expired_subscriptions', (
        SELECT COUNT(DISTINCT gym_id)::int FROM gym_subscriptions WHERE status = 'expired'
      ),
      'suspended_subscriptions', (
        SELECT COUNT(DISTINCT gym_id)::int FROM gym_subscriptions WHERE status = 'suspended'
      ),
      'total_platform_revenue', COALESCE(
        (SELECT SUM(amount)::numeric FROM gym_subscriptions WHERE payment_status = 'paid'), 0
      ),
      'new_gyms_this_month', (
        SELECT COUNT(*)::int FROM gyms
        WHERE created_at >= date_trunc('month', now())
      ),
      'pending_payments', (
        SELECT COUNT(*)::int FROM gym_subscriptions WHERE payment_status IN ('pending', 'overdue')
      )
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_platform_stats() TO authenticated;

-- ─── قائمة الصالات ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_list_gyms()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  RETURN COALESCE((
    SELECT json_agg(row_to_json(t) ORDER BY t.gym_created_at DESC)
    FROM (
      SELECT
        g.id AS gym_id,
        g.name AS gym_name,
        g.phone,
        g.address,
        g.created_at AS gym_created_at,
        u.id AS owner_user_id,
        u.full_name AS owner_name,
        COALESCE(mc.cnt, 0)::int AS members_count,
        gs.id AS subscription_id,
        gs.plan_type,
        gs.status AS subscription_status,
        gs.end_date,
        gs.payment_status,
        gs.amount::numeric AS amount,
        gs.start_date
      FROM gyms g
      LEFT JOIN users u ON u.gym_id = g.id AND u.role = 'owner'
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt FROM members m WHERE m.gym_id = g.id
      ) mc ON true
      LEFT JOIN LATERAL (
        SELECT *
        FROM gym_subscriptions
        WHERE gym_id = g.id
        ORDER BY created_at DESC
        LIMIT 1
      ) gs ON true
    ) t
  ), '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_list_gyms() TO authenticated;

-- ─── تحديث اشتراك صالة ─────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_gym_subscription(
  p_gym_id uuid,
  p_status saas_subscription_status DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_plan_type saas_plan_type DEFAULT NULL,
  p_payment_status saas_payment_status DEFAULT NULL,
  p_extend_days integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_id uuid;
  new_end date;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  SELECT id INTO sub_id
  FROM gym_subscriptions
  WHERE gym_id = p_gym_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF sub_id IS NULL THEN
    RAISE EXCEPTION 'لا يوجد اشتراك لهذه الصالة';
  END IF;

  IF p_extend_days IS NOT NULL AND p_extend_days > 0 THEN
    SELECT COALESCE(end_date, CURRENT_DATE) + (p_extend_days || ' days')::interval
    INTO new_end
    FROM gym_subscriptions WHERE id = sub_id;
    p_end_date := new_end;
    p_status := COALESCE(p_status, 'active');
  END IF;

  UPDATE gym_subscriptions
  SET
    status = COALESCE(p_status, status),
    end_date = COALESCE(p_end_date, end_date),
    plan_type = COALESCE(p_plan_type, plan_type),
    payment_status = COALESCE(p_payment_status, payment_status)
  WHERE id = sub_id;

  RETURN json_build_object('success', true, 'subscription_id', sub_id);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_gym_subscription(uuid, saas_subscription_status, date, saas_plan_type, saas_payment_status, integer) TO authenticated;

-- ─── إعدادات التسعير ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_saas_settings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  row saas_settings%ROWTYPE;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  SELECT * INTO row FROM saas_settings ORDER BY updated_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN row_to_json(row);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_saas_settings() TO authenticated;

CREATE OR REPLACE FUNCTION admin_update_saas_settings(
  p_monthly numeric,
  p_three_month numeric,
  p_six_month numeric,
  p_yearly numeric,
  p_lifetime numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_id uuid;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  SELECT id INTO settings_id FROM saas_settings ORDER BY updated_at DESC LIMIT 1;

  IF settings_id IS NULL THEN
    INSERT INTO saas_settings (monthly_price, three_month_price, six_month_price, yearly_price, lifetime_price)
    VALUES (p_monthly, p_three_month, p_six_month, p_yearly, p_lifetime)
    RETURNING id INTO settings_id;
  ELSE
    UPDATE saas_settings
    SET
      monthly_price = p_monthly,
      three_month_price = p_three_month,
      six_month_price = p_six_month,
      yearly_price = p_yearly,
      lifetime_price = p_lifetime,
      updated_at = NOW()
    WHERE id = settings_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_saas_settings(numeric, numeric, numeric, numeric, numeric) TO authenticated;

-- سياسات RLS إضافية (اختياري — الدوال SECURITY DEFINER تكفي)
DROP POLICY IF EXISTS "Super admins update saas settings" ON saas_settings;
CREATE POLICY "Super admins update saas settings"
  ON saas_settings FOR UPDATE
  USING (is_super_admin());

-- ─── أضف نفسك كسوبر أدمن (غيّر البريد) ─────────────────────
-- INSERT INTO super_admins (user_id, email)
-- SELECT id, email FROM auth.users WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id) DO NOTHING;
