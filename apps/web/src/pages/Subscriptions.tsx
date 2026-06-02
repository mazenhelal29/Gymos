import { useState, useMemo } from 'react';
import { useSubscriptions, useCreateSubscription, useUpdateSubscription, useDeleteSubscription } from '@/hooks/use-subscriptions';
import { useMembers } from '@/hooks/use-members';
import { usePackages } from '@/hooks/use-packages';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { formatDate, formatCurrency, daysUntil } from '@gymos/utils';
import { Plus, MoreVertical, Edit, Trash, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function Subscriptions() {
  const [tab, setTab] = useState('active');
  const [expiryRange, setExpiryRange] = useState('7days');
  const { data, isLoading } = useSubscriptions({ tab, expiryRange });
  
  const { user } = useAuth();
  const { data: membersData } = useMembers({ pageSize: 1000 });
  const members = membersData?.data ?? [];

  const { data: packagesData } = usePackages();
  const packages = packagesData ?? [];

  const { mutate: createSub, isPending: isCreating } = useCreateSubscription();
  const { mutate: updateSub, isPending: isUpdating } = useUpdateSubscription();
  const { mutate: deleteSub } = useDeleteSubscription();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  // Form states
  const [memberId, setMemberId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [price, setPrice] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
  const [formError, setFormError] = useState('');

  // Update End Date & Price when package changes
  const handlePackageChange = (val: string) => {
    setPackageId(val);
    const selectedPkg = packages.find(p => p.id === val);
    if (selectedPkg) {
      setPrice(String(selectedPkg.price));
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + selectedPkg.duration_days);
      setEndDate(newEndDate.toISOString().split('T')[0]);
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    const selectedPkg = packages.find(p => p.id === packageId);
    if (selectedPkg) {
      const newEndDate = new Date(val);
      newEndDate.setDate(newEndDate.getDate() + selectedPkg.duration_days);
      setEndDate(newEndDate.toISOString().split('T')[0]);
    }
  };

  const handleAddClick = () => {
    setSelectedSub(null);
    setMemberId('');
    setPackageId('');
    setPrice('');
    setStartDate(new Date().toISOString().split('T')[0]);
    
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setEndDate(d.toISOString().split('T')[0]);
    
    setPaymentStatus('unpaid');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleEditClick = (sub: any) => {
    setSelectedSub(sub);
    setMemberId(sub.member_id || '');
    setPackageId(sub.package_id || '');
    setPrice(sub.price ? String(sub.price) : '');
    setStartDate(sub.start_date ? new Date(sub.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setEndDate(sub.end_date ? new Date(sub.end_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setPaymentStatus(sub.payment_status || 'unpaid');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      setFormError('يرجى اختيار عضو');
      return;
    }
    if (!packageId && !selectedSub?.plan_name) {
      setFormError('يرجى اختيار باقة');
      return;
    }
    if (!price || isNaN(Number(price))) {
      setFormError('يجب إدخال سعر صحيح');
      return;
    }

    const selectedPkg = packages.find(p => p.id === packageId);
    // fallback to original plan_name for old subscriptions if no package is selected
    const planName = selectedPkg?.name || selectedSub?.plan_name || 'باقة مخصصة';

    const subData = {
      gym_id: user?.gymId ?? '',
      member_id: memberId,
      package_id: packageId || null,
      plan_name: planName,
      price: Number(price),
      start_date: startDate,
      end_date: endDate,
      payment_status: paymentStatus,
    };

    if (selectedSub) {
      updateSub(
        { id: selectedSub.id, ...subData },
        {
          onSuccess: () => setIsDialogOpen(false),
          onError: (err: any) => setFormError(err.message || 'فشل تحديث بيانات الاشتراك'),
        }
      );
    } else {
      createSub(
        subData,
        {
          onSuccess: () => setIsDialogOpen(false),
          onError: (err: any) => setFormError(err.message || 'فشل إضافة الاشتراك الجديد'),
        }
      );
    }
  };

  // Grouping subscriptions by plan_name (since some old subs might not have package_id)
  const groupedSubs = useMemo<Record<string, any[]>>(() => {
    if (!data) return {};
    return data.reduce((acc: Record<string, any[]>, sub: any) => {
      const key = sub.plan_name || 'باقات أخرى';
      if (!acc[key]) acc[key] = [];
      acc[key].push(sub);
      return acc;
    }, {});
  }, [data]);

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">الاشتراكات</h1>
          <p className="text-[hsl(var(--muted-foreground))]">متابعة الاشتراكات النشطة، والتي شارف تاريخها على الانتهاء، والمنتهية.</p>
        </div>
        <Button className="w-full sm:w-auto btn-brand" onClick={handleAddClick}>
          <Plus className="ml-2 h-4 w-4" /> إضافة اشتراك جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))] border-[hsl(var(--border))]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))] text-right w-full">إجمالي الاشتراكات الحالية</CardTitle>
            <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-gradient-brand">{data?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:min-w-[320px] md:min-w-[400px]">
            <TabsTrigger value="active">نشط</TabsTrigger>
            <TabsTrigger value="expiring">ينتهي قريباً</TabsTrigger>
            <TabsTrigger value="expired">منتهي</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'expiring' && (
          <Select value={expiryRange} onValueChange={setExpiryRange}>
            <SelectTrigger className="w-full sm:w-[180px] justify-between flex-row-reverse">
              <SelectValue placeholder="المدة الزمنية للانتهاء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today" className="text-right justify-end pr-2">اليوم</SelectItem>
              <SelectItem value="3days" className="text-right justify-end pr-2">الـ 3 أيام القادمة</SelectItem>
              <SelectItem value="7days" className="text-right justify-end pr-2">الـ 7 أيام القادمة</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">جاري التحميل...</div>
      ) : data?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-[hsl(var(--muted-foreground))]">
            لا توجد اشتراكات في هذا القسم.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSubs).map(([groupName, subs]) => (
            <Card key={groupName} className="overflow-hidden">
              <div className="bg-[hsl(var(--muted))] px-4 py-3 border-b border-[hsl(var(--border))] flex justify-between items-center flex-row-reverse">
                <h3 className="font-semibold text-[hsl(var(--foreground))] text-right">{groupName}</h3>
                <Badge variant="secondary">{subs.length} مشترك</Badge>
              </div>
              <CardContent className="p-0">
                <div className="table-scroll">
                  <table className="w-full text-sm text-left text-right">
                    <thead className="text-xs text-[hsl(var(--muted-foreground))] uppercase border-b border-[hsl(var(--border))]">
                      <tr>
                        <th className="px-3 sm:px-6 py-4 font-medium text-right">العضو</th>
                        <th className="px-3 sm:px-6 py-4 font-medium text-right">فترة الاشتراك</th>
                        <th className="px-3 sm:px-6 py-4 font-medium text-right">حالة الدفع</th>
                        {tab === 'expiring' && <th className="px-3 sm:px-6 py-4 font-medium text-right">الانتهاء</th>}
                        <th className="px-3 sm:px-6 py-4 font-medium text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {subs.map((sub: any) => (
                        <tr key={sub.id} className="hover:bg-[hsl(var(--accent))/50] transition-colors">
                          <td className="px-3 sm:px-6 py-4 text-right">
                            <p className="font-medium text-[hsl(var(--foreground))]">{sub.members?.full_name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{sub.members?.phone}</p>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="text-[hsl(var(--muted-foreground))]">البدء: {formatDate(sub.start_date)}</span>
                              <span className="font-medium text-[hsl(var(--foreground))]">الانتهاء: {formatDate(sub.end_date)}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right">
                            <Badge 
                              variant={sub.payment_status === 'paid' ? 'success' : sub.payment_status === 'unpaid' ? 'danger' : 'warning'}
                            >
                              {sub.payment_status === 'paid' ? 'مدفوع' : sub.payment_status === 'unpaid' ? 'غير مدفوع' : 'مدفوع جزئياً'}
                            </Badge>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{formatCurrency(sub.price)}</p>
                          </td>
                          {tab === 'expiring' && (
                            <td className="px-3 sm:px-6 py-4 text-right">
                              <Badge variant={daysUntil(sub.end_date) === 0 ? 'danger' : 'warning'}>
                                {daysUntil(sub.end_date) === 0 ? 'اليوم' : `متبقي ${daysUntil(sub.end_date)} أيام`}
                              </Badge>
                            </td>
                          )}
                          <td className="px-3 sm:px-6 py-4 text-left">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-40 z-50 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-md shadow-md p-1">
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-[hsl(var(--accent))] rounded-sm w-full text-right justify-start"
                                  onClick={() => handleEditClick(sub)}
                                >
                                  <Edit className="h-4 w-4 ml-1" /> تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer text-rose-500 hover:bg-rose-500/10 rounded-sm w-full text-right justify-start"
                                  onClick={() => {
                                    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الاشتراك؟')) {
                                      deleteSub(sub.id);
                                    }
                                  }}
                                >
                                  <Trash className="h-4 w-4 ml-1" /> حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-right">{selectedSub ? 'تعديل الاشتراك' : 'إضافة اشتراك جديد'}</DialogTitle>
              <DialogDescription className="text-right">
                {selectedSub ? 'تحديث وتعديل تفاصيل باقة هذا الاشتراك.' : 'تسجيل باقة اشتراك جديدة لعضو بالصالة الرياضية.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-right">
              {formError && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-center">
                  {formError}
                </div>
              )}

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="memberSelect">اختر العضو *</Label>
                {selectedSub ? (
                  <Input 
                    value={members.find((m: any) => m.id === memberId)?.full_name || 'العضو المحدد'} 
                    className="text-right"
                    disabled 
                  />
                ) : (
                  <Combobox
                    options={members.map((m: any) => ({
                      value: m.id,
                      label: `${m.full_name} ${m.phone ? `(${m.phone})` : ''}`
                    }))}
                    value={memberId}
                    onChange={setMemberId}
                    placeholder="اختر عضواً"
                    searchPlaceholder="ابحث عن عضو..."
                    emptyText="لم يتم العثور على أعضاء."
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="packageSelect">الباقة *</Label>
                <Combobox
                  options={packages.map((p: any) => ({
                    value: p.id,
                    label: p.name
                  }))}
                  value={packageId}
                  onChange={handlePackageChange}
                  placeholder="اختر باقة"
                  searchPlaceholder="ابحث عن باقة..."
                  emptyText="لم يتم العثور على باقات."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="price">السعر ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="49.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="text-right"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="paymentStatus">حالة الدفع</Label>
                  <Select value={paymentStatus} onValueChange={(val: any) => setPaymentStatus(val)}>
                    <SelectTrigger id="paymentStatus" className="text-right justify-between flex-row-reverse">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid" className="text-right justify-end pr-2">مدفوع</SelectItem>
                      <SelectItem value="unpaid" className="text-right justify-end pr-2">غير مدفوع</SelectItem>
                      <SelectItem value="partial" className="text-right justify-end pr-2">مدفوع جزئياً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="startDate">تاريخ البدء</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="endDate">تاريخ الانتهاء</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row-reverse sm:justify-start gap-2">
              <Button type="submit" disabled={isCreating || isUpdating} className="btn-brand">
                {selectedSub ? (isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات') : (isCreating ? 'جاري الإضافة...' : 'إضافة الاشتراك')}
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
