-- تحليلات المالية لصاحب الصالة — نفّذ في Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.get_gym_finance_analytics(p_months integer DEFAULT 6)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  gid uuid;
  month_start timestamptz;
  last_month_start timestamptz;
  last_month_end timestamptz;
  result json;
BEGIN
  gid := get_user_gym_id();

  IF gid IS NULL THEN
    RETURN json_build_object(
      'total_revenue', 0,
      'monthly_revenue', 0,
      'last_month_revenue', 0,
      'monthly_growth_pct', 0,
      'transaction_count', 0,
      'avg_transaction', 0,
      'by_method', '[]'::json,
      'monthly_series', '[]'::json
    );
  END IF;

  month_start := date_trunc('month', now());
  last_month_start := date_trunc('month', now() - interval '1 month');
  last_month_end := month_start - interval '1 second';

  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(b.amt), 0),
    'monthly_revenue', COALESCE(SUM(b.amt) FILTER (WHERE b.paid_at >= month_start), 0),
    'last_month_revenue', COALESCE(
      SUM(b.amt) FILTER (WHERE b.paid_at >= last_month_start AND b.paid_at <= last_month_end), 0
    ),
    'monthly_growth_pct',
      CASE
        WHEN COALESCE(SUM(b.amt) FILTER (WHERE b.paid_at >= last_month_start AND b.paid_at <= last_month_end), 0) > 0
        THEN ROUND(
          (
            (COALESCE(SUM(b.amt) FILTER (WHERE b.paid_at >= month_start), 0)
              - COALESCE(SUM(b.amt) FILTER (WHERE b.paid_at >= last_month_start AND b.paid_at <= last_month_end), 0))
            / COALESCE(SUM(b.amt) FILTER (WHERE b.paid_at >= last_month_start AND b.paid_at <= last_month_end), 0)
          ) * 100, 1
        )
        WHEN COALESCE(SUM(b.amt) FILTER (WHERE b.paid_at >= month_start), 0) > 0 THEN 100
        ELSE 0
      END,
    'transaction_count', COUNT(b.amt)::int,
    'avg_transaction', ROUND(COALESCE(AVG(b.amt), 0)::numeric, 2),
    'by_method', COALESCE((
      SELECT json_agg(
        json_build_object(
          'method', pm.payment_method::text,
          'total', ROUND(pm.method_total::numeric, 2),
          'count', pm.method_count
        )
        ORDER BY pm.method_total DESC
      )
      FROM (
        SELECT payment_method, SUM(amt) AS method_total, COUNT(*)::int AS method_count
        FROM (SELECT amount::numeric AS amt, payment_method FROM payments WHERE gym_id = gid) x
        GROUP BY payment_method
      ) pm
    ), '[]'::json),
    'monthly_series', COALESCE((
      SELECT json_agg(
        json_build_object(
          'month_key', to_char(m.month_start, 'YYYY-MM'),
          'revenue', ROUND(COALESCE(ms.month_revenue, 0)::numeric, 2),
          'transactions', COALESCE(ms.month_count, 0)
        )
        ORDER BY m.month_start
      )
      FROM generate_series(
        date_trunc('month', now()) - ((GREATEST(p_months, 1) - 1) || ' months')::interval,
        date_trunc('month', now()),
        '1 month'::interval
      ) AS m(month_start)
      LEFT JOIN LATERAL (
        SELECT SUM(p.amount::numeric) AS month_revenue, COUNT(*)::int AS month_count
        FROM payments p
        WHERE p.gym_id = gid
          AND p.paid_at >= m.month_start
          AND p.paid_at < m.month_start + interval '1 month'
      ) ms ON true
    ), '[]'::json)
  )
  INTO result
  FROM (SELECT amount::numeric AS amt, paid_at FROM payments WHERE gym_id = gid) b;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_gym_finance_analytics(integer) TO authenticated;
