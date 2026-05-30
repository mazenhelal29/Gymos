import type { GymSubscription, SaasSubscriptionStatus } from '@gymos/types';
import { daysUntil } from '@gymos/utils';

export const SUPPORT_PHONE = '01221475856';
/** رقم واتساب بصيغة دولية (مصر +20) */
export const SUPPORT_WHATSAPP_NUMBER = '201221475856';
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent('مرحباً، أحتاج تجديد اشتراك GymOS')}`;

export type GymAccessBlockReason = 'suspended' | 'cancelled' | 'expired' | 'date_expired';

const BLOCKED_STATUSES: SaasSubscriptionStatus[] = ['expired', 'suspended', 'cancelled'];

export function isLifetimeActive(sub: GymSubscription | null | undefined): boolean {
  return sub?.plan_type === 'lifetime' && sub.status === 'active';
}

export function getGymAccessBlockReason(
  sub: GymSubscription | null | undefined
): GymAccessBlockReason | null {
  if (!sub) return null;
  if (isLifetimeActive(sub)) return null;

  if (sub.status === 'suspended') return 'suspended';
  if (sub.status === 'cancelled') return 'cancelled';
  if (sub.status === 'expired') return 'expired';

  if (sub.end_date && daysUntil(sub.end_date) < 0) {
    return 'date_expired';
  }

  return null;
}

export function isGymAccessBlocked(sub: GymSubscription | null | undefined): boolean {
  return getGymAccessBlockReason(sub) !== null;
}

/** السوبر أدمن لا يُحظر أبداً — حتى لو مرتبط بصالة موقوفة */
export function shouldBlockGymAccess(
  user: { isSuperAdmin?: boolean } | null | undefined,
  sub: GymSubscription | null | undefined
): boolean {
  if (user?.isSuperAdmin) return false;
  return isGymAccessBlocked(sub);
}

export function getSubscriptionDaysLeft(sub: GymSubscription | null | undefined): number | null {
  if (!sub?.end_date || isLifetimeActive(sub)) return null;
  return daysUntil(sub.end_date);
}

export function formatSubscriptionRemaining(sub: GymSubscription | null | undefined): string {
  if (!sub) return 'غير متاح';
  if (isLifetimeActive(sub)) return 'مدى الحياة — بدون تاريخ انتهاء';

  const days = getSubscriptionDaysLeft(sub);
  if (days === null) return '—';
  if (days < 0) return 'منتهي';
  if (days === 0) return 'ينتهي اليوم';
  if (days === 1) return 'يوم واحد متبقٍ';
  if (days === 2) return 'يومان متبقيان';
  if (days <= 10) return `${days} أيام متبقية`;
  return `${days} يوماً متبقياً`;
}

export function getBlockReasonMessage(reason: GymAccessBlockReason | null): {
  title: string;
  description: string;
} {
  switch (reason) {
    case 'suspended':
      return {
        title: 'تم إيقاف حساب صالتك',
        description:
          'تم إيقاف اشتراك صالتك من قبل الإدارة. يرجى التواصل مع الدعم الفني لتجديد الاشتراك واستعادة الوصول.',
      };
    case 'cancelled':
      return {
        title: 'اشتراك ملغي',
        description:
          'تم إلغاء اشتراك صالتك. تواصل مع الدعم الفني لتجديد الاشتراك وإعادة تفعيل الحساب.',
      };
    case 'expired':
    case 'date_expired':
    default:
      return {
        title: 'اشتراكك منتهي',
        description:
          'انتهت فترة اشتراكك في GymOS. تواصل مع الدعم الفني لتجديد الاشتراك واستعادة صلاحية الدخول.',
      };
  }
}
