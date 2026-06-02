import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Settings,
  Dumbbell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Wallet,
} from 'lucide-react';
import { cn } from '@gymos/utils';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

const navItems = [
  { label: 'الرئيسية', icon: LayoutDashboard, href: '/' },
  { label: 'الأعضاء', icon: Users, href: '/members' },
  { label: 'الاشتراكات', icon: CalendarCheck, href: '/subscriptions' },
  { label: 'الباقات', icon: CalendarCheck, href: '/packages' },
  { label: 'المالية', icon: CreditCard, href: '/payments' },
  { label: 'المصروفات', icon: Wallet, href: '/expenses' },
  { label: 'الإعدادات', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const [location] = useLocation();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 border-l border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-brand shadow-lg shadow-red-500/25">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-bold text-gradient-brand font-sans"
          >
            جيم أو إس
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-gradient-to-r from-red-600/20 to-blue-600/20 text-red-400 shadow-sm'
                    : 'text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--sidebar-foreground))]'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--sidebar-foreground))]'
                  )}
                />
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {item.label}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute right-0 w-1 h-6 rounded-l-full bg-red-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {user?.isSuperAdmin && (
        <div className="px-3 pb-2">
          <Link href="/admin">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400/90 hover:bg-amber-500/10 cursor-pointer border border-amber-500/20">
              <Shield className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>سوبر أدمن</span>}
            </div>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 mb-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </motion.aside>
  );
}
