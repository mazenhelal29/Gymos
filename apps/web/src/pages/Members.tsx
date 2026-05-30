import { useState } from 'react';
import { useMembers, useDeleteMember, useCreateMember, useUpdateMember } from '@/hooks/use-members';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreVertical, Edit, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, getStatusColor } from '@gymos/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Members() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useMembers({ search, page, pageSize });
  const { mutate: deleteMember } = useDeleteMember();
  const { user } = useAuth();
  const { mutate: createMember, isPending: isCreating } = useCreateMember();
  const { mutate: updateMember, isPending: isUpdating } = useUpdateMember();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'none'>('none');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'frozen'>('active');
  const [joinDate, setJoinDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const handleAddClick = () => {
    setSelectedMember(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setGender('none');
    setAge('');
    setWeight('');
    setStatus('active');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleEditClick = (member: any) => {
    setSelectedMember(member);
    setFullName(member.full_name || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setGender(member.gender || 'none');
    setAge(member.age ? String(member.age) : '');
    setWeight(member.weight ? String(member.weight) : '');
    setStatus(member.status || 'active');
    setJoinDate(member.join_date ? new Date(member.join_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setNotes(member.notes || '');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('الاسم الكامل مطلوب');
      return;
    }

    const memberData = {
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      gender: gender === 'none' ? null : gender,
      age: age ? Number(age) : null,
      weight: weight ? String(weight) : null,
      status,
      join_date: joinDate,
      notes: notes.trim() || null,
    };

    if (selectedMember) {
      updateMember(
        { id: selectedMember.id, ...memberData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
          },
          onError: (err: any) => {
            setFormError(err.message || 'فشل تحديث بيانات العضو');
          },
        }
      );
    } else {
      createMember(
        memberData,
        {
          onSuccess: () => {
            setIsDialogOpen(false);
          },
          onError: (err: any) => {
            setFormError(err.message || 'فشل إضافة العضو الجديد');
          },
        }
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">الأعضاء</h1>
          <p className="text-[hsl(var(--muted-foreground))]">إدارة وتنظيم أعضاء الصالة الرياضية.</p>
        </div>
        <Button className="w-full sm:w-auto btn-brand" onClick={handleAddClick}>
          <Plus className="ml-2 h-4 w-4" /> إضافة عضو جديد
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="البحث عن الأعضاء..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset page on search
              }}
              className="pr-9 pl-3"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-scroll rounded-lg border border-[hsl(var(--border))]">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] uppercase bg-[hsl(var(--muted))]">
                <tr>
                  <th className="px-3 sm:px-6 py-3 font-medium">الاسم</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">بيانات الاتصال</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">الحالة</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">تاريخ الانضمام</th>
                  <th className="px-3 sm:px-6 py-3 font-medium text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      لم يتم العثور على أعضاء.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((member: any) => (
                    <tr key={member.id} className="hover:bg-[hsl(var(--accent))/50] transition-colors">
                      <td className="px-3 sm:px-6 py-4 font-medium text-[hsl(var(--foreground))]">
                        {member.full_name}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex flex-col">
                          <span>{member.phone || '-'}</span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <Badge variant="outline" className={getStatusColor(member.status)}>
                          {member.status === 'active' ? 'نشط' : member.status === 'inactive' ? 'غير نشط' : 'مجمد'}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-[hsl(var(--muted-foreground))]">
                        {formatDate(member.join_date)}
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
                              onClick={() => handleEditClick(member)}
                            >
                              <Edit className="h-4 w-4 ml-1" /> تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer text-rose-500 hover:bg-rose-500/10 rounded-sm w-full text-right justify-start"
                              onClick={() => {
                                if (confirm('هل أنت متأكد من رغبتك في حذف هذا العضو؟')) {
                                  deleteMember(member.id);
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

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-sm text-[hsl(var(--muted-foreground))]">
              <div>
                عرض {(page - 1) * pageSize + 1} إلى {Math.min(page * pageSize, data.count)} من أصل {data.count} أعضاء
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-right">{selectedMember ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}</DialogTitle>
              <DialogDescription className="text-right">
                {selectedMember ? 'تحديث وتعديل تفاصيل ملف بيانات العضو.' : 'أدخل البيانات لتسجيل عضو جديد بالصالة الرياضية.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-right">
              {formError && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-center">
                  {formError}
                </div>
              )}

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="fullName">الاسم الكامل *</Label>
                <Input
                  id="fullName"
                  placeholder="مثال: محمد أحمد"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-right"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    placeholder="+966 50 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="gender">الجنس</Label>
                  <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                    <SelectTrigger id="gender" className="text-right justify-between flex-row-reverse">
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-right justify-end pr-2">فضل عدم الإفصاح</SelectItem>
                      <SelectItem value="male" className="text-right justify-end pr-2">ذكر</SelectItem>
                      <SelectItem value="female" className="text-right justify-end pr-2">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="age">العمر</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="weight">الوزن (كجم)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="75"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="status">الحالة</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger id="status" className="text-right justify-between flex-row-reverse">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="text-right justify-end pr-2">نشط</SelectItem>
                      <SelectItem value="inactive" className="text-right justify-end pr-2">غير نشط</SelectItem>
                      <SelectItem value="frozen" className="text-right justify-end pr-2">مجمد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-right" htmlFor="joinDate">تاريخ الانضمام</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-right" htmlFor="notes">ملاحظات إضافية</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right"
                  placeholder="أي ملاحظات صحية أو أهداف رياضية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="flex-row-reverse sm:justify-start gap-2">
              <Button type="submit" disabled={isCreating || isUpdating} className="btn-brand">
                {selectedMember ? (isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات') : (isCreating ? 'جاري الإضافة...' : 'إضافة العضو')}
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
