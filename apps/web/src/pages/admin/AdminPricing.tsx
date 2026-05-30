import { useEffect, useState } from 'react';
import { useAdminSaasSettings, useUpdateSaasSettings } from '@/hooks/use-super-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tags } from 'lucide-react';

export function AdminPricing() {
  const { data: settings, isLoading } = useAdminSaasSettings();
  const { mutate: save, isPending, isSuccess } = useUpdateSaasSettings();

  const [monthly, setMonthly] = useState('');
  const [threeMonth, setThreeMonth] = useState('');
  const [sixMonth, setSixMonth] = useState('');
  const [yearly, setYearly] = useState('');
  const [lifetime, setLifetime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings) {
      setMonthly(String(settings.monthly_price));
      setThreeMonth(String(settings.three_month_price));
      setSixMonth(String(settings.six_month_price));
      setYearly(String(settings.yearly_price));
      setLifetime(String(settings.lifetime_price));
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const prices = {
      monthly: Number(monthly),
      threeMonth: Number(threeMonth),
      sixMonth: Number(sixMonth),
      yearly: Number(yearly),
      lifetime: Number(lifetime),
    };
    if (Object.values(prices).some((p) => isNaN(p) || p < 0)) {
      setError('أدخل أسعاراً صحيحة');
      return;
    }
    save(prices, {
      onError: (err: { message?: string }) => setError(err.message ?? 'فشل الحفظ'),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl min-w-0">
      <div>
        <h1 className="page-title flex flex-wrap items-center gap-2">
          <Tags className="w-8 h-8 text-red-500" />
          تسعير المنصة
        </h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          الأسعار التي تظهر للصالات عند الاشتراك في جيم أو إس (بالجنيه أو عملتك).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>باقات الاشتراك</CardTitle>
          <CardDescription>تُحفظ في جدول saas_settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            {isSuccess && (
              <div className="text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-lg text-center">
                تم حفظ الأسعار بنجاح
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="monthly">شهري</Label>
              <Input id="monthly" type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} className="text-right" disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="three">3 أشهر</Label>
              <Input id="three" type="number" value={threeMonth} onChange={(e) => setThreeMonth(e.target.value)} className="text-right" disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="six">6 أشهر</Label>
              <Input id="six" type="number" value={sixMonth} onChange={(e) => setSixMonth(e.target.value)} className="text-right" disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yearly">سنوي</Label>
              <Input id="yearly" type="number" value={yearly} onChange={(e) => setYearly(e.target.value)} className="text-right" disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lifetime">مدى الحياة</Label>
              <Input id="lifetime" type="number" value={lifetime} onChange={(e) => setLifetime(e.target.value)} className="text-right" disabled={isLoading} />
            </div>

            <Button type="submit" className="btn-brand" disabled={isPending || isLoading}>
              {isPending ? 'جاري الحفظ...' : 'حفظ الأسعار'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
