import { useState } from 'react';
import { usePayments, useFinanceAnalytics, useCreatePayment } from '@/hooks/use-payments';
import { useMembers } from '@/hooks/use-members';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@gymos/utils';
import { formatMonthLabel } from '@/lib/finance-analytics';
import {
  CreditCard,
  DollarSign,
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Receipt,
  BarChart3,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const METHOD_COLORS: Record<string, string> = {
  cash: 'hsl(0 72% 51%)',
  card: 'hsl(217 91% 55%)',
  bank_transfer: 'hsl(199 89% 48%)',
  other: 'hsl(240 5% 65%)',
};

export function Payments() {
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments();
  const { data: analytics, isLoading: analyticsLoading } = useFinanceAnalytics(6);
  const { mutate: createPayment, isPending: isCreating } = useCreatePayment();

  const { data: membersData } = useMembers({ pageSize: 1000 });
  const members = membersData?.data ?? [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'other'>('cash');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'بطاقة';
      case 'cash':
        return 'نقدي';
      case 'bank_transfer':
        return 'تحويل بنكي';
      default:
        return 'أخرى';
    }
  };

  const chartData =
    analytics?.monthly_series.map((p) => ({
      name: formatMonthLabel(p.month_key),
      revenue: Number(p.revenue),
      transactions: p.transactions,
    })) ?? [];

  const methodChartData =
    analytics?.by_method.map((m) => ({
      name: getMethodLabel(m.method),
      value: Number(m.total),
      method: m.method,
    })) ?? [];

  const growth = analytics?.monthly_growth_pct ?? 0;
  const growthUp = growth >= 0;

  const handleAddClick = () => {
    setMemberId(members[0]?.id || '');
    setAmount('');
    setPaymentMethod('cash');
    setPaidAt(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      setFormError('يرجى اختيار عضو');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setFormError('يرجى إدخال مبلغ صحيح أكبر من 0');
      return;
    }

    createPayment(
      {
        member_id: memberId,
        amount: Number(amount),
        payment_method: paymentMethod,
        paid_at: paidAt,
      },
      {
        onSuccess: () => setIsDialogOpen(false),
        onError: (err: { message?: string }) => {
          setFormError(err.message || 'فشل تسجيل الدفعة المالية');
        },
      }
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">المالية</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            إجمالي الأرباح، التحليلات، وسجل المدفوعات لصالتك.
          </p>
        </div>
        <Button className="w-full sm:w-auto btn-brand" onClick={handleAddClick}>
          <Plus className="ml-2 h-4 w-4" /> تسجيل دفعة مالية
        </Button>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="gradient-brand text-white border-0 shadow-lg shadow-red-500/20 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-red-100">إجمالي الأرباح (كل الفترات)</CardDescription>
            <CardTitle className="text-2xl sm:text-4xl font-bold">
              {analyticsLoading ? '...' : formatCurrency(analytics?.total_revenue ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-100/90">
              {analytics?.transaction_count ?? 0} معاملة مسجّلة في النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">أرباح الشهر الحالي</p>
                <p className="text-2xl font-bold">
                  {analyticsLoading ? '...' : formatCurrency(analytics?.monthly_revenue ?? 0)}
                </p>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    growthUp ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {growthUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{growthUp ? '+' : ''}{growth}% عن الشهر الماضي</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <DollarSign className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">متوسط قيمة الدفعة</p>
                <p className="text-2xl font-bold">
                  {analyticsLoading ? '...' : formatCurrency(analytics?.avg_transaction ?? 0)}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">يساعدك في تسعير الباقات</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Receipt className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تحليلات */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-500" />
              تطور الأرباح
            </CardTitle>
            <CardDescription>إيرادات آخر 6 أشهر من جدول المدفوعات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[280px] w-full min-w-0">
              {analyticsLoading ? (
                <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
                  جاري التحميل...
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="financeRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(217 91% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'الأرباح']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(0 72% 51%)"
                      strokeWidth={2}
                      fill="url(#financeRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
                  لا توجد مدفوعات بعد — سجّل أول دفعة لرؤية التحليلات
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>طرق الدفع</CardTitle>
            <CardDescription>توزيع الإيرادات حسب طريقة التحصيل</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] sm:h-[200px] w-full min-w-0">
              {methodChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {methodChartData.map((entry) => (
                        <Cell
                          key={entry.method}
                          fill={METHOD_COLORS[entry.method] ?? METHOD_COLORS.other}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  لا توجد بيانات
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {methodChartData.map((m) => (
                <div key={m.method} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: METHOD_COLORS[m.method] ?? METHOD_COLORS.other }}
                    />
                    {m.name}
                  </span>
                  <span className="font-medium">{formatCurrency(m.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* معاملات الشهر — شريط */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>عدد المعاملات شهرياً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px] sm:h-[180px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                    }}
                  />
                  <Bar dataKey="transactions" fill="hsl(217 91% 55%)" radius={[4, 4, 0, 0]} name="معاملات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات</CardTitle>
          <CardDescription>آخر المدفوعات المحصّلة من الأعضاء.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-scroll">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] uppercase bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] border-t">
                <tr>
                  <th className="px-3 sm:px-6 py-4 font-medium text-right">التاريخ</th>
                  <th className="px-3 sm:px-6 py-4 font-medium text-right">العضو</th>
                  <th className="px-3 sm:px-6 py-4 font-medium text-right">طريقة الدفع</th>
                  <th className="px-3 sm:px-6 py-4 font-medium text-left">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : paymentsData?.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      لا توجد مدفوعات مسجلة.
                    </td>
                  </tr>
                ) : (
                  paymentsData?.data.map((payment: {
                    id: string;
                    paid_at: string;
                    payment_method: string;
                    amount: string | number;
                    members?: { full_name?: string };
                  }) => (
                    <tr key={payment.id} className="hover:bg-[hsl(var(--accent))/50] transition-colors">
                      <td className="px-3 sm:px-6 py-4 text-[hsl(var(--muted-foreground))]">
                        {formatDate(payment.paid_at)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 font-medium">{payment.members?.full_name}</td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                          {getMethodIcon(payment.payment_method)}
                          <span>{getMethodLabel(payment.payment_method)}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-left font-medium text-red-500">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-right">تسجيل دفعة مالية</DialogTitle>
              <DialogDescription className="text-right">
                تسجيل معاملة دفعة يدوياً لأحد الأعضاء.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-right">
              {formError && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-center">
                  {formError}
                </div>
              )}

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="memberSelect">
                  اختر العضو *
                </Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger id="memberSelect" className="text-right justify-between flex-row-reverse">
                    <SelectValue placeholder="اختر عضواً" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m: { id: string; full_name: string; phone?: string }) => (
                      <SelectItem key={m.id} value={m.id} className="text-right justify-end pr-2">
                        {m.full_name} ({m.phone || 'بدون هاتف'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="amount">
                    المبلغ *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-right"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="paymentMethod">
                    طريقة الدفع
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) =>
                      setPaymentMethod(val as 'cash' | 'card' | 'bank_transfer' | 'other')
                    }
                  >
                    <SelectTrigger id="paymentMethod" className="text-right justify-between flex-row-reverse">
                      <SelectValue placeholder="اختر الطريقة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="text-right justify-end pr-2">
                        نقدي
                      </SelectItem>
                      <SelectItem value="card" className="text-right justify-end pr-2">
                        بطاقة
                      </SelectItem>
                      <SelectItem value="bank_transfer" className="text-right justify-end pr-2">
                        تحويل بنكي
                      </SelectItem>
                      <SelectItem value="other" className="text-right justify-end pr-2">
                        أخرى
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="paidAt">
                  تاريخ المعاملة
                </Label>
                <Input
                  id="paidAt"
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            <DialogFooter className="flex-row-reverse sm:justify-start gap-2">
              <Button type="submit" disabled={isCreating} className="btn-brand">
                {isCreating ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
