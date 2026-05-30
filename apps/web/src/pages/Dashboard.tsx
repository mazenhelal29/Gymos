import { useDashboardStats, useGrowthChart, useRevenueChart, useExpiringSubscriptions } from '@/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { formatCurrency, daysUntil } from '@gymos/utils';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: revenueData } = useRevenueChart();
  const { data: growthData } = useGrowthChart();
  const { data: expiringData } = useExpiringSubscriptions();

  const cards = [
    {
      title: 'إجمالي الأعضاء',
      value: stats?.totalMembers ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'الأعضاء النشطين',
      value: stats?.activeMembers ?? 0,
      icon: UserCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'الاشتراكات المنتهية',
      value: stats?.expiredSubscriptions ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      title: 'أرباح الشهر الحالي',
      value: formatCurrency(stats?.monthlyRevenue ?? 0),
      icon: DollarSign,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  if (statsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="page-title">الرئيسية</h1>
        <p className="text-[hsl(var(--muted-foreground))]">نظرة عامة على أداء الصالة الرياضية الخاصة بك.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{card.title}</p>
                    <div className="text-2xl font-bold">{card.value}</div>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>نظرة عامة على الأرباح</CardTitle>
            <CardDescription>الأرباح الشهرية لآخر 6 أشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] sm:h-[300px] w-full min-w-0">
              {revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [formatCurrency(value), 'الأرباح']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
                  لا توجد بيانات متاحة حالياً
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>اشتراكات توشك على الانتهاء</CardTitle>
            <CardDescription>الاشتراكات التي تنتهي خلال الـ 7 أيام القادمة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringData && expiringData.length > 0 ? (
                expiringData.map((sub) => (
                  <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent))/50]">
                    <div>
                      <p className="font-medium">{sub.memberName}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{sub.planName}</p>
                    </div>
                    <Badge variant={sub.daysLeft < 0 ? 'danger' : sub.daysLeft <= 3 ? 'warning' : 'outline'}>
                      {sub.daysLeft < 0 ? 'منتهي' : sub.daysLeft === 0 ? 'اليوم' : `خلال ${sub.daysLeft} أيام`}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-8 w-8 text-[hsl(var(--muted-foreground))] mb-2 opacity-50" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد اشتراكات تنتهي قريباً</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
