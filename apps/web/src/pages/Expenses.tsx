import { useState } from 'react';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  type ExpenseCategory,
} from '@/hooks/use-expenses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Expense } from '@gymos/types';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORIES } from '@/lib/expense-labels';
import { formatCurrency, formatDate } from '@gymos/utils';
import { Plus, MoreVertical, Edit, Trash, Wallet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

const categoryBadgeClass: Record<ExpenseCategory, string> = {
  trainer_salary: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  rent: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  utilities: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  equipment: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  other: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

export function Expenses() {
  const { data, isLoading } = useExpenses();
  const { mutate: createExpense, isPending: isCreating } = useCreateExpense();
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense();
  const { mutate: deleteExpense } = useDeleteExpense();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setCategory('other');
    setTitle('');
    setAmount('');
    setDescription('');
    setSpentAt(new Date().toISOString().split('T')[0]);
    setFormError('');
  };

  const handleAddClick = () => {
    setSelected(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditClick = (row: Expense) => {
    setSelected(row);
    setCategory(row.category);
    setTitle(row.title ?? '');
    setAmount(String(row.amount ?? ''));
    setDescription(row.description ?? '');
    setSpentAt(row.spent_at ? new Date(row.spent_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('عنوان المصروف مطلوب');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setFormError('أدخل مبلغاً صحيحاً أكبر من 0');
      return;
    }

    const payload = {
      category,
      title: title.trim(),
      amount: Number(amount),
      description: description.trim() || null,
      spent_at: new Date(spentAt).toISOString(),
    };

    if (selected) {
      updateExpense(
        { id: selected.id, ...payload },
        {
          onSuccess: () => setIsDialogOpen(false),
          onError: (err: { message?: string }) => setFormError(err.message ?? 'فشل التحديث'),
        }
      );
    } else {
      createExpense(payload, {
        onSuccess: () => setIsDialogOpen(false),
        onError: (err: { message?: string }) => setFormError(err.message ?? 'فشل الإضافة'),
      });
    }
  };

  const totalListed = (data?.data ?? []).reduce((s: number, e: Expense) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">المصروفات</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            سجّل مرتبات المدربين، الإيجار، والمصروفات الأخرى لصالتك.
          </p>
        </div>
        <Button className="w-full sm:w-auto btn-brand" onClick={handleAddClick}>
          <Plus className="ml-2 h-4 w-4" /> إضافة مصروف
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-right flex items-center gap-2 justify-end">
            <Wallet className="w-5 h-5 text-amber-500" />
            ملخص الصفحة
          </CardTitle>
          <CardDescription className="text-right">
            إجمالي المصروفات المعروضة: {formatCurrency(totalListed)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-scroll">
            <table className="w-full text-sm text-right">
              <thead className="text-xs uppercase bg-[hsl(var(--muted))] border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="px-3 sm:px-6 py-3 font-medium">التاريخ</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">التصنيف</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">العنوان</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">المبلغ</th>
                  <th className="px-3 sm:px-6 py-3 font-medium text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                      لا توجد مصروفات مسجّلة. أضف أول مصروف.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((row: Expense) => (
                    <tr key={row.id} className="hover:bg-[hsl(var(--accent))/40]">
                      <td className="px-3 sm:px-6 py-4 text-[hsl(var(--muted-foreground))]">
                        {formatDate(row.spent_at)}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <Badge variant="outline" className={categoryBadgeClass[row.category as ExpenseCategory]}>
                          {EXPENSE_CATEGORY_LABELS[row.category as ExpenseCategory]}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-6 py-4 font-medium">
                        <div>{row.title}</div>
                        {row.description && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1">
                            {row.description}
                          </p>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 font-semibold text-amber-600">
                        {formatCurrency(Number(row.amount))}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => handleEditClick(row)}
                            >
                              <Edit className="h-4 w-4" /> تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-rose-500 cursor-pointer"
                              onClick={() => deleteExpense(row.id)}
                            >
                              <Trash className="h-4 w-4" /> حذف
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
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-right">
                {selected ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
              </DialogTitle>
              <DialogDescription className="text-right">
                اختر نوع المصروف وأدخل التفاصيل والمبلغ.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-right">
              {formError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">
                  {formError}
                </div>
              )}

              <div className="grid gap-2">
                <Label>نوع المصروف</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                  <SelectTrigger className="text-right flex-row-reverse">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-right justify-end pr-2">
                        {EXPENSE_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="exp-title">العنوان *</Label>
                <Input
                  id="exp-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: إيجار شهر مايو"
                  className="text-right"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="exp-amount">المبلغ *</Label>
                  <Input
                    id="exp-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-right"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exp-date">التاريخ</Label>
                  <Input
                    id="exp-date"
                    type="date"
                    value={spentAt}
                    onChange={(e) => setSpentAt(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="exp-desc">ملاحظات (اختياري)</Label>
                <Input
                  id="exp-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تفاصيل إضافية..."
                  className="text-right"
                />
              </div>
            </div>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="submit" className="btn-brand" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'جاري الحفظ...' : selected ? 'حفظ التعديلات' : 'إضافة المصروف'}
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
