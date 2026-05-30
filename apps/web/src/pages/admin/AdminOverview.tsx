import { usePlatformStats } from '@/hooks/use-super-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@gymos/utils';
import { Building2, CheckCircle2, XCircle, PauseCircle, DollarSign, TrendingUp, Clock } from 'lucide-react';

export function AdminOverview() {
  const { data: stats, isLoading } = usePlatformStats();

  const cards = [
    {
      title: 'إجمالي الصالات',
      value: stats?.total_gyms ?? 0,
      icon: Building2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'اشتراكات نشطة',
      value: stats?.active_subscriptions ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'منتهية',
      value: stats?.expired_subscriptions ?? 0,
      icon: XCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      title: 'موقوفة',
      value: stats?.suspended_subscriptions ?? 0,
      icon: PauseCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'إيرادات المنصة',
      value: formatCurrency(stats?.total_platform_revenue ?? 0),
      icon: DollarSign,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      title: 'صالات جديدة هذا الشهر',
      value: stats?.new_gyms_this_month ?? 0,
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'مدفوعات معلقة',
      value: stats?.pending_payments ?? 0,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="page-title">نظرة عامة على المنصة</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          إحصائيات جميع الصالات المشتركة في جيم أو إس.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{card.title}</p>
                  <p className="text-2xl font-bold">{isLoading ? '...' : card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle>مهام سريعة</CardTitle>
          <CardDescription>ما يحتاجه السوبر أدمن يومياً</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[hsl(var(--muted-foreground))] space-y-2">
          <p>• راجع الصالات ذات الاشتراك المنتهي من صفحة «الصالات» ومدّد أو فعّل الاشتراك.</p>
          <p>• حدّث أسعار الباقات من صفحة «التسعير» قبل طرح عروض جديدة.</p>
          <p>• تأكد من إضافة بريدك في جدول super_admins في Supabase بعد تشغيل super-admin.sql.</p>
        </CardContent>
      </Card>
    </div>
  );
}
