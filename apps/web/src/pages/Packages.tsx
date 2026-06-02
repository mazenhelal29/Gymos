import { useState } from 'react';
import { usePackages, useCreatePackage, useUpdatePackage, useDeletePackage } from '@/hooks/use-packages';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@gymos/utils';
import { Plus, MoreVertical, Edit, Trash, Clock, Tag } from 'lucide-react';
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

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-[hsl(var(--muted-foreground))]">جاري التحميل...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--accent))/30]">
          <Tag className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-[hsl(var(--foreground))]">لا توجد باقات مضافة</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 mb-4">أضف باقة جديدة للبدء في تسجيل المشتركين.</p>
          <Button className="btn-brand" onClick={handleAddClick}>
            <Plus className="ml-2 h-4 w-4" /> أضف باقتك الأولى
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {packages.map((pkg: any) => (
            <Card key={pkg.id} className="relative overflow-hidden group hover:border-red-500/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-red-500/10 bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--accent))/10]">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-red-500 to-rose-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <CardContent className="p-5 flex flex-col gap-5">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-lg text-[hsl(var(--foreground))] truncate" title={pkg.name}>{pkg.name}</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-sm font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--accent))] w-fit px-2.5 py-1 rounded-md border border-[hsl(var(--border))]">
                      <Clock className="h-4 w-4 text-red-400" />
                      <span>{pkg.duration_days} يوماً</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] rounded-full shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 z-50 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-md shadow-md p-1">
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
                </div>
                
                <div className="pt-2 border-t border-[hsl(var(--border))] border-dashed flex items-end justify-between">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] mb-1 font-medium">سعر الاشتراك</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">
                       {formatCurrency(pkg.price)}
                     </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
