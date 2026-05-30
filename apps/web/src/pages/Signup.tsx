import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Dumbbell, Mail, User, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

export function Signup() {
  const [fullName, setFullName] = useState('');
  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp({ email, password, fullName, gymName });
      if (result.error) {
        setError(result.error);
      } else {
        setLocation('/');
      }
    } catch {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[hsl(var(--background))] relative overflow-hidden text-right">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand shadow-xl shadow-red-500/25 mb-6">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="page-title mb-2">إنشاء حساب جديد</h1>
          <p className="text-[hsl(var(--muted-foreground))]">ابدأ إدارة صالتك الرياضية مع جيم أو إس اليوم</p>
        </div>

        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg text-center">
                {error === 'User already registered' ? 'هذا البريد الإلكتروني مسجل بالفعل' : error}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right block" htmlFor="fullName">الاسم الكامل</Label>
                <div className="relative">
                  <div className="absolute right-3 top-2.5 text-[hsl(var(--muted-foreground))]">
                    <User className="w-5 h-5" />
                  </div>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="محمد أحمد"
                    className="pr-10 pl-3 text-right"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-right block" htmlFor="gymName">اسم الصالة</Label>
                <div className="relative">
                  <div className="absolute right-3 top-2.5 text-[hsl(var(--muted-foreground))]">
                    <Building className="w-5 h-5" />
                  </div>
                  <Input
                    id="gymName"
                    type="text"
                    placeholder="فتنس هاب"
                    className="pr-10 pl-3 text-right"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-right block" htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <div className="absolute right-3 top-2.5 text-[hsl(var(--muted-foreground))]">
                  <Mail className="w-5 h-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pr-10 pl-3 text-right"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-right block" htmlFor="password">كلمة المرور</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full btn-brand font-medium" disabled={isLoading}>
              {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-blue-500 font-medium hover:underline">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
