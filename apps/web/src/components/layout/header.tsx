import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { getInitials } from '@gymos/utils';
import {
  Dumbbell,
  Menu,
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Settings,
  LogOut,
  Sun,
  Moon,
  Shield,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@gymos/utils';

const navItems = [
  { label: 'الرئيسية', icon: LayoutDashboard, href: '/' },
  { label: 'الأعضاء', icon: Users, href: '/members' },
  { label: 'الاشتراكات', icon: CalendarCheck, href: '/subscriptions' },
  { label: 'الباقات', icon: CalendarCheck, href: '/packages' },
  { label: 'المالية', icon: CreditCard, href: '/payments' },
  { label: 'المصروفات', icon: Wallet, href: '/expenses' },
  { label: 'الإعدادات', icon: Settings, href: '/settings' },
];

export function Header() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 h-14 sm:h-16 px-3 sm:px-4 md:px-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-xl safe-top">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            className="md:hidden p-2.5 -mr-1 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors touch-manipulation"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="فتح القائمة"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="md:hidden flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg gradient-brand">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-gradient-brand truncate">جيم أو إس</span>
          </div>
        </div>

        <div className="hidden md:block flex-1" />

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] rounded-xl h-9 w-9 touch-manipulation"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <div className="hidden sm:block text-right max-w-[140px] md:max-w-none">
            <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{user?.fullName}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {user?.role === 'owner' ? 'مالك الصالة' : 'الموظف'}
            </p>
          </div>
          <Avatar className="h-9 w-9 ring-2 ring-red-500/25 shrink-0">
            <AvatarFallback className="gradient-brand text-white text-xs">
              {user?.fullName ? getInitials(user.fullName) : '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <MobileDrawer open={mobileMenuOpen} onClose={closeMenu} title="القائمة الرئيسية">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={closeMenu}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer touch-manipulation min-h-[44px]',
                    isActive
                      ? 'bg-red-600/20 text-red-400'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}

          {user?.isSuperAdmin && (
            <Link href="/admin">
              <div
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-amber-400 border border-amber-500/20 bg-amber-500/5 cursor-pointer touch-manipulation min-h-[44px] mt-2"
              >
                <Shield className="w-5 h-5 shrink-0" />
                سوبر أدمن
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              closeMenu();
              signOut();
            }}
            className="flex items-center gap-3 w-full px-3 py-3 mt-4 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer touch-manipulation min-h-[44px]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            تسجيل الخروج
          </button>
        </nav>
      </MobileDrawer>
    </>
  );
}
