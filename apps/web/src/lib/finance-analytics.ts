export interface PaymentMethodBreakdown {
  method: string;
  total: number;
  count: number;
}

export interface MonthlyFinancePoint {
  month_key: string;
  revenue: number;
  transactions: number;
}

export interface FinanceAnalytics {
  total_revenue: number;
  monthly_revenue: number;
  last_month_revenue: number;
  monthly_growth_pct: number;
  transaction_count: number;
  avg_transaction: number;
  by_method: PaymentMethodBreakdown[];
  monthly_series: MonthlyFinancePoint[];
}

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return `${AR_MONTHS[month - 1] ?? month} ${year}`;
}

export function computeFinanceAnalytics(
  payments: { amount: string | number; payment_method: string; paid_at: string }[],
  months = 6
): FinanceAnalytics {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  let totalRevenue = 0;
  let monthlyRevenue = 0;
  let lastMonthRevenue = 0;

  const methodMap = new Map<string, { total: number; count: number }>();

  for (const p of payments) {
    const amt = Number(p.amount) || 0;
    const paidAt = new Date(p.paid_at);
    totalRevenue += amt;

    if (paidAt >= monthStart) monthlyRevenue += amt;
    if (paidAt >= lastMonthStart && paidAt <= lastMonthEnd) lastMonthRevenue += amt;

    const m = methodMap.get(p.payment_method) ?? { total: 0, count: 0 };
    m.total += amt;
    m.count += 1;
    methodMap.set(p.payment_method, m);
  }

  const monthlyGrowthPct =
    lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
      : monthlyRevenue > 0
        ? 100
        : 0;

  const monthlySeries: MonthlyFinancePoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

    const inMonth = payments.filter((p) => {
      const paid = new Date(p.paid_at);
      return paid >= start && paid <= end;
    });

    monthlySeries.push({
      month_key: monthKey,
      revenue: inMonth.reduce((s, p) => s + (Number(p.amount) || 0), 0),
      transactions: inMonth.length,
    });
  }

  const by_method = [...methodMap.entries()]
    .map(([method, v]) => ({ method, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total);

  const transactionCount = payments.length;
  const avgTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  return {
    total_revenue: totalRevenue,
    monthly_revenue: monthlyRevenue,
    last_month_revenue: lastMonthRevenue,
    monthly_growth_pct: monthlyGrowthPct,
    transaction_count: transactionCount,
    avg_transaction: Math.round(avgTransaction * 100) / 100,
    by_method,
    monthly_series: monthlySeries,
  };
}
