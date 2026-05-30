import { isValidUuid } from '@/lib/gym-id';

/** مفتاح استعلام مربوط بالصالة — يمنع خلط الكاش بين صالات مختلفة */
export function gymQueryKey(gymId: string | undefined, ...parts: unknown[]) {
  return ['gym', gymId ?? 'none', ...parts] as const;
}

export function canLoadGymData(gymId: string | undefined): gymId is string {
  return isValidUuid(gymId);
}
