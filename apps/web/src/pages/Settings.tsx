import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
import { PLAN_LABELS, SUB_STATUS_LABELS } from '@/hooks/use-super-admin';
import type { SaasPlanType, SaasSubscriptionStatus } from '@gymos/types';
import { CalendarClock, AlertTriangle, Eye, EyeOff, Save, ShieldCheck, User, Building2, Lock, Mail } from 'lucide-react';
import { cn } from '@gymos/utils';

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
  const queryClient = useQueryClient();
  const daysLeft = getSubscriptionDaysLeft(gymSubscription);
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const blocked = isGymAccessBlocked(gymSubscription);

  // Form states
  const [gymName, setGymName] = useState('');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ text: '', type: '' });

  // Fetch Gym Info
  const { data: gymData, isLoading: isLoadingGym } = useQuery({
    queryKey: ['gym', user?.gymId],
    queryFn: async () => {
      if (!user?.gymId) return null;
      const { data, error } = await supabase
        .from('gyms')
        .select('name')
        .eq('id', user.gymId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.gymId,
  });

  useEffect(() => {
    if (gymData?.name) {
      setGymName(gymData.name);
    }
  }, [gymData]);

  // Update Profile & Gym Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // Update User Full Name
      if (fullName !== user?.fullName) {
        const { error: userError } = await supabase
          .from('users')
          .update({ full_name: fullName })
          .eq('id', user?.id);
        if (userError) throw new Error('فشل تحديث الاسم الشخصي');
      }

      // Update Gym Name
      if (user?.gymId && gymName !== gymData?.name) {
        const { error: gymError } = await supabase
          .from('gyms')
          .update({ name: gymName })
          .eq('id', user.gymId);
        if (gymError) throw new Error('فشل تحديث اسم النظام (الجيم)');
      }

      // Update Password if entered
      if (password) {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw new Error('فشل تحديث كلمة السر. تأكد من أن كلمة السر قوية ولا تقل عن 6 أحرف.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', user?.gymId] });
      setUpdateMessage({ text: 'تم حفظ التغييرات بنجاح!', type: 'success' });
      setPassword(''); // clear password field
      setTimeout(() => setUpdateMessage({ text: '', type: '' }), 4000);
    },
    onError: (error: any) => {
      setUpdateMessage({ text: error.message || 'حدث خطأ أثناء الحفظ', type: 'error' });
    }
  });

  const handleSave = () => {
    setUpdateMessage({ text: '', type: '' });
    updateProfileMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto md:mx-0 text-right min-w-0 pb-12">
      <div>
        <h1 className="page-title text-2xl font-bold">الإعدادات</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
          إدارة الملف الشخصي، تعديل اسم النظام، واشتراك البرنامج.
        </p>
      </div>

      {/* Developer & Support Card */}
      <Card className="relative border-[hsl(var(--border))] shadow-md overflow-hidden bg-card text-card-foreground">
        {/* Top gold accent bar */}
        <div className="h-[4px] w-full bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#aa7c11]" />
        
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col sm:flex-row-reverse items-center justify-between gap-6">
            
            {/* Developer Info */}
            <div className="flex flex-col items-center sm:items-end gap-2 text-center sm:text-right">
              <span className="flex items-center gap-1 text-[11px] font-bold tracking-widest text-[#b8860b] dark:text-[#f3e5ab] uppercase bg-amber-500/10 px-2.5 py-1 rounded-full">
                <span>مطور النظام المعتمد</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              </span>
              
              <h2 
                className="font-extrabold tracking-wide drop-shadow-[0_2px_8px_rgba(250,204,21,0.25)] select-none text-transparent bg-clip-text bg-gradient-to-r from-[#c5a029] via-[#ffd700] to-[#e6c13e]"
                style={{
                  fontSize: '1.45rem',
                  fontFamily: '"Outfit", "Inter", "Segoe UI", sans-serif',
                  textShadow: '0 0 12px rgba(253,224,71,0.2)'
                }}
              >
                ENG: Mazen Helal
              </h2>
              
              <p className="text-[11px] text-muted-foreground font-medium">
                حقوق النظام محفوظة © {new Date().getFullYear()} GymOS
              </p>
            </div>

            {/* WhatsApp Support CTA */}
            <div className="w-full sm:w-auto flex flex-col items-center sm:items-start gap-2.5">
              <a
                href="https://wa.me/201221475856?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D8%A8%D8%AE%D8%B5%D9%8وز%20%D9%85%D8%A7%D8%B2%D9%86%20%D9%87%D9%84%D8%A7%D9%84%20%D8%A8%D8%AE%D8%B5%D9%85%D8%B5%20%D9%86%D8%B8%D8%A7%D9%85%20GymOS"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2.5 overflow-hidden rounded-xl text-white px-6 py-3.5 transition-all duration-300 hover:brightness-105 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                }}
              >
                {/* Shimmer effect */}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5.5 h-5.5 shrink-0 relative z-10">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>

                <span className="relative z-10 flex flex-col items-end text-right leading-tight">
                  <span className="text-sm font-bold">تجديد الاشتراك والدعم الفني</span>
                  <span className="text-[10px] text-white/90 mt-0.5">تواصل مباشرة بضغطة زر</span>
                </span>
              </a>

              {/* Display Phone Number */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border/80 shadow-sm"
                dir="ltr"
              >
                <span className="text-xs">📞</span>
                <span className="font-mono font-bold text-xs text-foreground tracking-wider">
                  01221475856
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Card */}
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
                  className={`flex items-start gap-3 rounded-lg p-3 text-sm ${blocked
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
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Settings Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">إعدادات النظام والملف الشخصي</CardTitle>
          <CardDescription className="text-right">إدارة بيانات الدخول واسم الصالة الرياضية الخاص بك.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {updateMessage.text && (
            <div
              className={cn(
                "p-3 rounded-lg text-sm font-medium border text-center",
                updateMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              )}
            >
              {updateMessage.text}
            </div>
          )}

          {/* Gym Name Field */}
          <div className="space-y-2">
            <Label className="text-right flex items-center gap-1.5 justify-end" htmlFor="gymName">
              <span>اسم النظام الظاهر (اسم الجيم)</span>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </Label>
            <Input
              id="gymName"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              className="text-right"
              disabled={isLoadingGym}
              placeholder="مثال: جيم الأبطال..."
            />
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label className="text-right flex items-center gap-1.5 justify-end" htmlFor="name">
              <span>الاسم الكامل للمدير</span>
              <User className="w-4 h-4 text-muted-foreground" />
            </Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="text-right"
              placeholder="الاسم الثلاثي..."
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label className="text-right flex items-center gap-1.5 justify-end" htmlFor="email">
              <span>البريد الإلكتروني (الحساب)</span>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </Label>
            <Input
              id="email"
              value={user?.email || ''}
              className="text-right bg-muted text-muted-foreground cursor-not-allowed"
              disabled
            />
            <p className="text-[10px] text-muted-foreground/80 text-right">
              لا يمكن تعديل البريد الإلكتروني لأنه الحساب الأساسي لتسجيل الدخول.
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label className="text-right flex items-center gap-1.5 justify-end" htmlFor="password">
              <span>كلمة المرور الجديدة</span>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="اتركه فارغاً إذا كنت لا ترغب بتغييرها..."
                className="text-right pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title={showPassword ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/80 text-right">
              أدخل كلمة مرور قوية مكونة من 6 أحرف على الأقل لحماية حسابك.
            </p>
          </div>

          <div className="flex justify-start pt-2">
            <Button
              className="btn-brand px-8 flex items-center gap-2"
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'جاري الحفظ...' : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
