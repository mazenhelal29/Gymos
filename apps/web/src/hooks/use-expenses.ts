import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requireGymId } from '@/lib/gym-id';
import { gymQueryKey, canLoadGymData } from '@/lib/gym-query-keys';
import { useAuth } from './use-auth';
import type { ExpenseCategory, InsertExpense } from '@gymos/types';

export type ExpenseFormData = Omit<InsertExpense, 'gym_id'>;

export function useExpenses(params?: { page?: number; pageSize?: number; category?: string }) {
  const { user } = useAuth();
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 50;

  return useQuery({
    queryKey: gymQueryKey(user?.gymId, 'expenses', params),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);

      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('gym_id', gymId)
        .order('spent_at', { ascending: false });

      if (params?.category && params.category !== 'all') {
        query = query.eq('category', params.category);
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

export function useCreateExpense() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (expense: ExpenseFormData) => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          gym_id: gymId,
          amount: String(expense.amount),
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

export function useUpdateExpense() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...expense
    }: ExpenseFormData & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...expense,
          amount: String(expense.amount),
        })
        .eq('id', id)
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

export function useDeleteExpense() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user?.gymId) {
        const gymId = requireGymId(user.gymId);
        qc.invalidateQueries({ queryKey: ['gym', gymId] });
      }
    },
  });
}

export type { ExpenseCategory };
