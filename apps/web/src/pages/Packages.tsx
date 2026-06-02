import { useState } from 'react';
import { usePackages, useCreatePackage, useUpdatePackage, useDeletePackage } from '@/hooks/use-packages';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@gymos/utils';
import { Plus, MoreVertical, Edit, Trash } from 'lucide-react';
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

export function Packages() {
  const { data, isLoading } = usePackages();
  const packages = data ?? [];

  const { mutate: createPkg, isPending: isCreating } = useCreatePackage();
  const { mutate: updatePkg, isPending: isUpdating } = useUpdatePackage();
  const { mutate: deletePkg } = useDeletePackage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [price, setPrice] = useState('');
  const [formError, setFormError] = useState('');

  const handleAddClick = () => {
    setSelectedPkg(null);
    setName('باقة جديدة');
    setDurationDays('30');
    setPrice('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleEditClick = (pkg: any) => {
    setSelectedPkg(pkg);
    setName(pkg.name || '');
    setDurationDays(pkg.duration_days ? String(pkg.duration_days) : '30');
    setPrice(pkg.price ? String(pkg.price) : '');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('اسم الباقة مطلوب');
      return;
    }
    if (!durationDays || isNaN(Number(durationDays))) {
      setFormError('يجب إدخال مدة صحيحة بالأيام');
      return;
    }
    if (!price || isNaN(Number(price))) {
      setFormError('يجب إدخال سعر صحيح');
      return;
    }

    const pkgData = {
      name: name.trim(),
      duration_days: Number(durationDays),
      price: Number(price),
    };

    if (selectedPkg) {
      updatePkg(
        { id: selectedPkg.id, ...pkgData },
        {
          onSuccess: () => setIsDialogOpen(false),
          onError: (err: any) => setFormError(err.message || 'فشل تحديث بيانات الباقة'),
        }
      );
    } else {
      createPkg(
        pkgData,
        {
          onSuccess: () => setIsDialogOpen(false),
          onError: (err: any) => setFormError(err.message || 'فشل إضافة الباقة الجديدة'),
        }
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">الباقات</h1>
          <p className="text-[hsl(var(--muted-foreground))]">إدارة باقات الاشتراك وتسعيرها في صالتك الرياضية.</p>
        </div>
        <Button className="w-full sm:w-auto btn-brand" onClick={handleAddClick}>
          <Plus className="ml-2 h-4 w-4" /> إضافة باقة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="table-scroll">
            <table className="w-full text-sm text-left text-right">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] uppercase bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-3 sm:px-6 py-4 font-medium text-right">اسم الباقة</th>
                  <th className="px-3 sm:px-6 py-4 font-medium text-right">المدة (بالأيام)</th>
                  <th className="px-3 sm:px-6 py-4 font-medium text-right">السعر</th>
                  <th className="px-3 sm:px-6 py-4 font-medium text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                      لا توجد باقات مضافة. أضف باقة جديدة للبدء.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg: any) => (
                    <tr key={pkg.id} className="hover:bg-[hsl(var(--accent))/50] transition-colors">
                      <td className="px-3 sm:px-6 py-4 text-right">
                        <p className="font-medium text-[hsl(var(--foreground))]">{pkg.name}</p>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right">
                        <p className="text-[hsl(var(--muted-foreground))]">{pkg.duration_days} يوماً</p>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right">
                        <p className="font-medium text-amber-500">{formatCurrency(pkg.price)}</p>
                      </td>
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
                              onClick={() => handleEditClick(pkg)}
                            >
                              <Edit className="h-4 w-4 ml-1" /> تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer text-rose-500 hover:bg-rose-500/10 rounded-sm w-full text-right justify-start"
                              onClick={() => {
                                if (confirm('هل أنت متأكد من رغبتك في حذف هذه الباقة؟')) {
                                  deletePkg(pkg.id);
                                }
                              }}
                            >
                              <Trash className="h-4 w-4 ml-1" /> حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-right">{selectedPkg ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</DialogTitle>
              <DialogDescription className="text-right">
                {selectedPkg ? 'تحديث بيانات وسعر الباقة.' : 'تسجيل باقة جديدة لاستخدامها في الاشتراكات.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-right">
              {formError && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-center">
                  {formError}
                </div>
              )}

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="name">اسم الباقة *</Label>
                <Input
                  id="name"
                  placeholder="مثال: اشتراك 3 شهور"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-right"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="durationDays">المدة بالأيام *</Label>
                <Input
                  id="durationDays"
                  type="number"
                  placeholder="مثال: 90"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="text-right"
                  required
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  تُستخدم المدة لحساب تاريخ انتهاء الاشتراك تلقائياً. (شهر = 30، 3 شهور = 90)
                </p>
              </div>

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="price">السعر *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="مثال: 300"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="text-right"
                  required
                />
              </div>
            </div>

            <DialogFooter className="flex-row-reverse sm:justify-start gap-2">
              <Button type="submit" disabled={isCreating || isUpdating} className="btn-brand">
                {selectedPkg ? (isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات') : (isCreating ? 'جاري الإضافة...' : 'إضافة الباقة')}
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
