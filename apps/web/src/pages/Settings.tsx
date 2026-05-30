import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@gymos/utils';
import {
  formatSubscriptionRemaining,
  getSubscriptionDaysLeft,
  isLifetimeActive,
  isGymAccessBlocked,
} from '@/lib/gym-subscription';
import { WhatsAppSupportButton } from '@/components/whatsapp-support-button';
import { PLAN_LABELS, SUB_STATUS_LABELS } from '@/hooks/use-super-admin';
import type { SaasPlanType, SaasSubscriptionStatus } from '@gymos/types';
import { CalendarClock, AlertTriangle } from 'lucide-react';

function subscriptionStatusVariant(status: SaasSubscriptionStatus | undefined) {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'suspended':
      return 'warning' as const;
    case 'expired':
    case 'cancelled':
      return 'danger' as const;
    default:
      return 'outline' as const;
  }
}

export function Settings() {
  const { user, gymSubscription } = useAuth();
  const daysLeft = getSubscriptionDaysLeft(gymSubscription);
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const blocked = isGymAccessBlocked(gymSubscription);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto md:mx-0 text-right min-w-0">
      <div>
        <h1 className="page-title">الإعدادات</h1>
        <p className="text-[hsl(var(--muted-foreground))]">إدارة الملف الشخصي واشتراك البرنامج.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2 justify-end">
            <CalendarClock className="w-5 h-5 text-red-500" />
            اشتراك البرنامج (GymOS)
          </CardTitle>
          <CardDescription className="text-right">
            المدة المتبقية لتجديد اشتراك صالتك في النظام.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!gymSubscription ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">تعذر تحميل بيانات الاشتراك.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-[hsl(var(--border))] p-3 bg-[hsl(var(--muted))]/30">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">الباقة</p>
                  <p className="font-semibold">
                    {PLAN_LABELS[gymSubscription.plan_type as SaasPlanType] ?? gymSubscription.plan_type}
                  </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] p-3 bg-[hsl(var(--muted))]/30">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">الحالة</p>
                  <Badge variant={subscriptionStatusVariant(gymSubscription.status)}>
                    {SUB_STATUS_LABELS[gymSubscription.status] ?? gymSubscription.status}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border border-[hsl(var(--border))] p-4 space-y-2 bg-gradient-to-l from-red-500/5 to-blue-500/5">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">المدة المتبقية للتجديد</p>
                <p className="text-2xl font-bold">{formatSubscriptionRemaining(gymSubscription)}</p>
                {!isLifetimeActive(gymSubscription) && gymSubscription.end_date && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    ينتهي في: {formatDate(gymSubscription.end_date)}
                  </p>
                )}
              </div>

              {(blocked || isExpiringSoon) && (
                <div
                  className={`flex items-start gap-3 rounded-lg p-3 text-sm ${
                    blocked
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p>
                      {blocked
                        ? 'اشتراك صالتك غير نشط. تواصل مع الدعم الفني لتجديد الاشتراك.'
                        : 'اشتراكك على وشك الانتهاء. جدّد مبكراً لتجنب توقف الحساب.'}
                    </p>
                    <WhatsAppSupportButton size="sm" className="max-w-xs" />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">تفاصيل الملف الشخصي</CardTitle>
          <CardDescription className="text-right">تحديث المعلومات والبيانات الشخصية الخاصة بك.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-right block" htmlFor="name">
              الاسم الكامل
            </Label>
            <Input id="name" defaultValue={user?.fullName} className="text-right" />
          </div>
          <div className="space-y-2">
            <Label className="text-right block" htmlFor="email">
              البريد الإلكتروني
            </Label>
            <Input id="email" defaultValue={user?.email} className="text-right" disabled />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">لا يمكن تغيير البريد الإلكتروني للحساب.</p>
          </div>
          <div className="flex justify-start">
            <Button className="btn-brand">حفظ التغييرات</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
