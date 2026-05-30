import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import type {
  PlatformStats,
  AdminGymRow,
  SaasSettings,
  SaasPlanType,
  SaasSubscriptionStatus,
  SaasPaymentStatus,
} from '@gymos/types';

export function usePlatformStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin', 'platform-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_platform_stats');
      if (error) throw error;
      return data as PlatformStats;
    },
    enabled: !!user?.isSuperAdmin,
  });
}

export function useAdminGyms() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin', 'gyms'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_gyms');
      if (error) throw error;
      return (data ?? []) as AdminGymRow[];
    },
    enabled: !!user?.isSuperAdmin,
  });
}

export function useAdminSaasSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin', 'saas-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_saas_settings');
      if (error) throw error;
      return data as SaasSettings | null;
    },
    enabled: !!user?.isSuperAdmin,
  });
}

export function useUpdateGymSubscription() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      gymId: string;
      status?: SaasSubscriptionStatus;
      endDate?: string;
      planType?: SaasPlanType;
      paymentStatus?: SaasPaymentStatus;
      extendDays?: number;
    }) => {
      const { data, error } = await supabase.rpc('admin_update_gym_subscription', {
        p_gym_id: params.gymId,
        p_status: params.status ?? null,
        p_end_date: params.endDate ?? null,
        p_plan_type: params.planType ?? null,
        p_payment_status: params.paymentStatus ?? null,
        p_extend_days: params.extendDays ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useUpdateSaasSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (prices: {
      monthly: number;
      threeMonth: number;
      sixMonth: number;
      yearly: number;
      lifetime: number;
    }) => {
      const { data, error } = await supabase.rpc('admin_update_saas_settings', {
        p_monthly: prices.monthly,
        p_three_month: prices.threeMonth,
        p_six_month: prices.sixMonth,
        p_yearly: prices.yearly,
        p_lifetime: prices.lifetime,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'saas-settings'] });
    },
  });
}

export const PLAN_LABELS: Record<SaasPlanType, string> = {
  '1_month': 'شهري',
  '3_months': '3 أشهر',
  '6_months': '6 أشهر',
  yearly: 'سنوي',
  lifetime: 'مدى الحياة',
};

export const SUB_STATUS_LABELS: Record<SaasSubscriptionStatus, string> = {
  active: 'نشط',
  expired: 'منتهي',
  suspended: 'موقوف',
  cancelled: 'ملغي',
};

export const PAY_STATUS_LABELS: Record<SaasPaymentStatus, string> = {
  paid: 'مدفوع',
  pending: 'معلق',
  overdue: 'متأخر',
  refunded: 'مسترد',
};
