import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requireGymId } from '@/lib/gym-id';
import {
  computeFinanceAnalytics,
  type FinanceAnalytics,
} from '@/lib/finance-analytics';
import { gymQueryKey, canLoadGymData } from '@/lib/gym-query-keys';
import { useAuth } from './use-auth';
import type { InsertPayment } from '@gymos/types';

export type PaymentFormData = Omit<InsertPayment, 'gym_id'>;

export function usePayments(params?: {
  startDate?: string;
  endDate?: string;
  method?: string;
  page?: number;
  pageSize?: number;
}) {
  const { user } = useAuth();
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 50;

  return useQuery({
    queryKey: gymQueryKey(user?.gymId, 'payments', params),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);

      let query = supabase
        .from('payments')
        .select('*, members!inner(full_name)', { count: 'exact' })
        .eq('gym_id', gymId)
        .order('paid_at', { ascending: false });

      if (params?.startDate) query = query.gte('paid_at', params.startDate);
      if (params?.endDate) query = query.lte('paid_at', params.endDate);
      if (params?.method && params.method !== 'all') {
        query = query.eq('payment_method', params.method);
      }

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: data ?? [],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: canLoadGymData(user?.gymId),
  });
}

export function useFinanceAnalytics(months = 6) {
  const { user } = useAuth();

  return useQuery({
    queryKey: gymQueryKey(user?.gymId, 'finance-analytics', months),
    queryFn: async (): Promise<FinanceAnalytics> => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_gym_finance_analytics', {
        p_months: months,
      });

      if (!rpcError && rpcData) {
        return rpcData as FinanceAnalytics;
      }

      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_method, paid_at')
        .eq('gym_id', gymId)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      return computeFinanceAnalytics(payments ?? [], months);
    },
    enabled: canLoadGymData(user?.gymId),
  });
}

export function useCreatePayment() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payment: PaymentFormData) => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...payment,
          gym_id: gymId,
          amount: String(payment.amount),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (user?.gymId) {
        const gymId = requireGymId(user.gymId);
        qc.invalidateQueries({ queryKey: ['gym', gymId] });
      }
    },
  });
}
