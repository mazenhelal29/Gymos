import { Link, useLocation } from 'wouter';
import { cn } from '@gymos/utils';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Tags,
  Dumbbell,
  ArrowRight,
  Shield,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isValidUuid } from '@/lib/gym-id';
import { MobileDrawer } from '@/components/layout/mobile-drawer';

const adminNav = [
  { label: 'نظرة عامة', href: '/admin', icon: LayoutDashboard },
  { label: 'الصالات', href: '/admin/gyms', icon: Building2 },
  { label: 'التسعير', href: '/admin/pricing', icon: Tags },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenu = () => setMobileMenuOpen(false);

  const navLink = (item: (typeof adminNav)[0], onNavigate?: () => void) => {
    const isActive =
      location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
    return (
      <Link key={item.href} href={item.href}>
        <div
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors',
            isActive
              ? 'bg-red-600/20 text-red-400'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-white/5 hover:text-white'
          )}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          {item.label}
        </div>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen min-w-0 bg-[hsl(var(--background))]">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(222_47%_6%)]">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-blue-600">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">سوبر أدمن</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">جيم أو إس</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">{adminNav.map((item) => navLink(item))}</nav>

        <div className="p-3 border-t border-[hsl(var(--border))] space-y-2">
          {user && isValidUuid(user.gymId) && (
            <Link href="/">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-400 hover:bg-blue-500/10 cursor-pointer">
                <Dumbbell className="w-4 h-4" />
                لوحة الصالة
              </div>
            </Link>
          )}
          <Link href="/">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:bg-white/5 cursor-pointer">
              <ArrowRight className="w-4 h-4" />
              العودة للتطبيق
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-40 h-14 sm:h-16 border-b border-[hsl(var(--border))] flex items-center justify-between gap-2 px-3 sm:px-4 md:px-6 bg-[hsl(var(--card))]/95 backdrop-blur-xl safe-top">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="md:hidden p-2.5 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors touch-manipulation"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="فتح قائمة السوبر أدمن"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-sm font-bold truncate">سوبر أدمن</span>
            </div>
          </div>

          <p className="hidden md:block text-sm text-[hsl(var(--muted-foreground))] truncate">
            مرحباً،{' '}
            <span className="text-[hsl(var(--foreground))] font-medium">{user?.fullName}</span>
          </p>

          <span className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
            مدير المنصة
          </span>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto min-w-0 safe-bottom">
          {children}
        </main>
      </div>

      <MobileDrawer
        open={mobileMenuOpen}
        onClose={closeMenu}
        title="لوحة السوبر أدمن"
        className="bg-[hsl(222_47%_8%)]"
      >
        <nav className="space-y-1">
          {adminNav.map((item) =>
            navLink(item, closeMenu)
          )}
        </nav>
        <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] space-y-1">
          {user && isValidUuid(user.gymId) && (
            <Link href="/">
              <div
                onClick={closeMenu}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-blue-400 hover:bg-blue-500/10 cursor-pointer min-h-[44px]"
              >
                <Dumbbell className="w-4 h-4" />
                لوحة الصالة
              </div>
            </Link>
          )}
          <Link href="/">
            <div
              onClick={closeMenu}
              className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-[hsl(var(--muted-foreground))] hover:bg-white/5 cursor-pointer min-h-[44px]"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للتطبيق
            </div>
          </Link>
        </div>
      </MobileDrawer>
    </div>
  );
}
