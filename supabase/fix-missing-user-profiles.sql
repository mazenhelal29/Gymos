-- ============================================================
-- إصلاح حسابات موجودة في Auth بدون صف في public.users
-- أو بدون gym_id — نفّذ في Supabase → SQL Editor (مرة واحدة)
-- ============================================================

-- 1) إنشاء صالة + ملف لكل مستخدم في auth.users ليس له صف في users
DO $$
DECLARE
  au RECORD;
  new_gym_id UUID;
BEGIN
  FOR au IN
    SELECT id, email
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    new_gym_id := gen_random_uuid();

    INSERT INTO public.gyms (id, name)
    VALUES (new_gym_id, 'صالتي الرياضية');

    INSERT INTO public.users (id, gym_id, full_name, role)
    VALUES (
      au.id,
      new_gym_id,
      COALESCE(split_part(au.email, '@', 1), 'مالك الصالة'),
      'owner'
    );

    INSERT INTO public.gym_subscriptions (
      gym_id, plan_type, amount, start_date, end_date,
      payment_status, payment_method, status
    )
    VALUES (
      new_gym_id,
      '1_month',
      0,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '14 days',
      'paid',
      'cash',
      'active'
    );
  END LOOP;
END $$;

-- 2) ربط مستخدمين موجودين لكن gym_id فارغ
DO $$
DECLARE
  u RECORD;
  new_gym_id UUID;
BEGIN
  FOR u IN
    SELECT id FROM public.users WHERE gym_id IS NULL
  LOOP
    new_gym_id := gen_random_uuid();

    INSERT INTO public.gyms (id, name)
    VALUES (new_gym_id, 'صالتي الرياضية');

    UPDATE public.users
    SET gym_id = new_gym_id
    WHERE id = u.id;

    INSERT INTO public.gym_subscriptions (
      gym_id, plan_type, amount, start_date, end_date,
      payment_status, payment_method, status
    )
    VALUES (
      new_gym_id,
      '1_month',
      0,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '14 days',
      'paid',
      'cash',
      'active'
    );
  END LOOP;
END $$;

-- 3) تحقق (استبدل البريد)
-- SELECT au.email, u.gym_id, u.full_name, g.name
-- FROM auth.users au
-- LEFT JOIN public.users u ON u.id = au.id
-- LEFT JOIN public.gyms g ON g.id = u.gym_id
-- WHERE au.email = 'your@email.com';
