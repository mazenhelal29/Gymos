import { useState } from 'react';
import {
  useAdminGyms,
  useUpdateGymSubscription,
  PLAN_LABELS,
  SUB_STATUS_LABELS,
  PAY_STATUS_LABELS,
} from '@/hooks/use-super-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@gymos/utils';
import type { AdminGymRow, SaasSubscriptionStatus, SaasPaymentStatus, SaasPlanType } from '@gymos/types';
import { Settings2, CalendarPlus, PauseCircle, PlayCircle } from 'lucide-react';

function statusBadge(status: string | null) {
  switch (status) {
    case 'active':
      return <Badge variant="success">نشط</Badge>;
    case 'expired':
      return <Badge variant="danger">منتهي</Badge>;
    case 'suspended':
      return <Badge variant="warning">موقوف</Badge>;
    case 'cancelled':
      return <Badge variant="outline">ملغي</Badge>;
    default:
      return <Badge variant="outline">—</Badge>;
  }
}

export function AdminGyms() {
  const { data: gyms, isLoading } = useAdminGyms();
  const { mutate: updateSub, isPending } = useUpdateGymSubscription();

  const [selected, setSelected] = useState<AdminGymRow | null>(null);
  const [status, setStatus] = useState<SaasSubscriptionStatus>('active');
  const [paymentStatus, setPaymentStatus] = useState<SaasPaymentStatus>('paid');
  const [planType, setPlanType] = useState<SaasPlanType>('1_month');
  const [endDate, setEndDate] = useState('');
  const [extendDays, setExtendDays] = useState('14');
  const [formError, setFormError] = useState('');

  const openManage = (gym: AdminGymRow) => {
    setSelected(gym);
    setStatus((gym.subscription_status as SaasSubscriptionStatus) ?? 'active');
    setPaymentStatus((gym.payment_status as SaasPaymentStatus) ?? 'paid');
    setPlanType((gym.plan_type as SaasPlanType) ?? '1_month');
    setEndDate(gym.end_date ? gym.end_date.split('T')[0] : '');
    setExtendDays('14');
    setFormError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    updateSub(
      {
        gymId: selected.gym_id,
        status,
        paymentStatus,
        planType,
        endDate: endDate || undefined,
      },
      {
        onSuccess: () => setSelected(null),
        onError: (err: { message?: string }) => setFormError(err.message ?? 'فشل التحديث'),
      }
    );
  };

  const handleExtend = () => {
    if (!selected) return;
    const days = Number(extendDays);
    if (!days || days < 1) {
      setFormError('أدخل عدد أيام صحيحاً');
      return;
    }
    updateSub(
      { gymId: selected.gym_id, extendDays: days, status: 'active', paymentStatus: 'paid' },
      {
        onSuccess: () => setSelected(null),
        onError: (err: { message?: string }) => setFormError(err.message ?? 'فشل التمديد'),
      }
    );
  };

  const handleQuickSuspend = (gym: AdminGymRow) => {
    updateSub({ gymId: gym.gym_id, status: 'suspended' });
  };

  const handleQuickActivate = (gym: AdminGymRow) => {
    updateSub({ gymId: gym.gym_id, status: 'active', paymentStatus: 'paid' });
  };

  const handleQuickExtend = (gym: AdminGymRow, days: number) => {
    updateSub({ gymId: gym.gym_id, extendDays: days, status: 'active', paymentStatus: 'paid' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="page-title">إدارة الصالات</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          تفعيل، إيقاف، وتمديد اشتراكات الصالات المشتركة.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع الصالات</CardTitle>
          <CardDescription>{gyms?.length ?? 0} صالة مسجّلة</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-scroll">
            <table className="w-full text-sm text-right">
              <thead className="text-xs uppercase bg-[hsl(var(--muted))] border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="px-4 py-3">الصالة</th>
                  <th className="px-4 py-3">المالك</th>
                  <th className="px-4 py-3">الأعضاء</th>
                  <th className="px-4 py-3">الباقة</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">ينتهي</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : gyms?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      لا توجد صالات
                    </td>
                  </tr>
                ) : (
                  gyms?.map((gym) => (
                    <tr key={gym.gym_id} className="hover:bg-[hsl(var(--accent))/40]">
                      <td className="px-4 py-3 font-medium">{gym.gym_name}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                        {gym.owner_name ?? '—'}
                      </td>
                      <td className="px-4 py-3">{gym.members_count}</td>
                      <td className="px-4 py-3">
                        {gym.plan_type ? PLAN_LABELS[gym.plan_type as SaasPlanType] : '—'}
                      </td>
                      <td className="px-4 py-3">{statusBadge(gym.subscription_status)}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                        {gym.end_date ? formatDate(gym.end_date) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {gym.amount != null ? formatCurrency(gym.amount) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {gym.subscription_status === 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-600 border-amber-500/30"
                              disabled={isPending}
                              onClick={() => handleQuickSuspend(gym)}
                              title="إيقاف الاشتراك"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 border-emerald-500/30"
                              disabled={isPending}
                              onClick={() => handleQuickActivate(gym)}
                              title="تفعيل الاشتراك"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleQuickExtend(gym, 30)}
                            title="تمديد 30 يوم"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openManage(gym)}>
                            <Settings2 className="w-4 h-4 ml-1" />
                            إدارة
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-right">إدارة اشتراك: {selected?.gym_name}</DialogTitle>
              <DialogDescription className="text-right">
                تعديل حالة الاشتراك أو تمديده بعد استلام الدفع.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-right">
              {formError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>حالة الاشتراك</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as SaasSubscriptionStatus)}>
                    <SelectTrigger className="text-right flex-row-reverse">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUB_STATUS_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k} className="text-right justify-end pr-2">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>حالة الدفع</Label>
                  <Select
                    value={paymentStatus}
                    onValueChange={(v) => setPaymentStatus(v as SaasPaymentStatus)}
                  >
                    <SelectTrigger className="text-right flex-row-reverse">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAY_STATUS_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k} className="text-right justify-end pr-2">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>نوع الباقة</Label>
                  <Select value={planType} onValueChange={(v) => setPlanType(v as SaasPlanType)}>
                    <SelectTrigger className="text-right flex-row-reverse">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLAN_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k} className="text-right justify-end pr-2">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">تاريخ الانتهاء</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[hsl(var(--border))] p-3 space-y-2 bg-[hsl(var(--muted))]/50">
                <Label className="flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  تمديد سريع (أيام)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="text-right"
                  />
                  <Button type="button" variant="secondary" onClick={handleExtend} disabled={isPending}>
                    تمديد
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="submit" className="btn-brand" disabled={isPending}>
                {isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
