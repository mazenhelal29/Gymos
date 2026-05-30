-- ============================================================
-- إعادة تفعيل اشتراكات الصالات (بعد إيقاف تجريبي أو انتهاء)
-- نفّذ في Supabase → SQL Editor
-- ============================================================

-- تفعيل كل الاشتراكات الموقوفة/المنتهية + تمديد 30 يوم
UPDATE gym_subscriptions
SET
  status = 'active',
  payment_status = 'paid',
  end_date = GREATEST(COALESCE(end_date, CURRENT_DATE), CURRENT_DATE) + INTERVAL '30 days'
WHERE status IN ('expired', 'suspended', 'cancelled')
   OR end_date IS NULL
   OR end_date < CURRENT_DATE;

-- إضافة سوبر أدمن (غيّر البريد إن لزم)
INSERT INTO super_admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'mazenhelal29@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- تحقق
SELECT g.name, gs.status, gs.end_date, gs.payment_status
FROM gym_subscriptions gs
JOIN gyms g ON g.id = gs.gym_id
ORDER BY gs.created_at DESC;
