import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requireGymId } from '@/lib/gym-id';
import { gymQueryKey, canLoadGymData } from '@/lib/gym-query-keys';
import { useAuth } from './use-auth';
import type { InsertSubscription } from '@gymos/types';

export function useSubscriptions(params?: { tab?: string; expiryRange?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: gymQueryKey(user?.gymId, 'subscriptions', params),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);

      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('subscriptions')
        .select('*, members!inner(full_name, phone)')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });

      if (params?.tab === 'active') {
        query = query.gte('end_date', today);
      } else if (params?.tab === 'expired') {
        query = query.lt('end_date', today);
      } else if (params?.tab === 'expiring') {
        const futureDate = new Date();
        if (params?.expiryRange === 'today') {
          query = query.eq('end_date', today);
        } else if (params?.expiryRange === '3days') {
          futureDate.setDate(futureDate.getDate() + 3);
          query = query.gte('end_date', today).lte('end_date', futureDate.toISOString().split('T')[0]);
        } else {
          // default: 7 days
          futureDate.setDate(futureDate.getDate() + 7);
          query = query.gte('end_date', today).lte('end_date', futureDate.toISOString().split('T')[0]);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: canLoadGymData(user?.gymId),
  });
}

function invalidateGymQueries(qc: ReturnType<typeof useQueryClient>, gymId: string) {
  qc.invalidateQueries({ queryKey: ['gym', gymId] });
}

export function useCreateSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (sub: InsertSubscription) => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...sub,
          gym_id: gymId,
          price: String(sub.price),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (user?.gymId) invalidateGymQueries(qc, requireGymId(user.gymId));
    },
  });
}

export function useUpdateSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...sub }: InsertSubscription & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ...sub,
          price: String(sub.price),
        })
        .eq('id', id)
        .eq('gym_id', gymId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (user?.gymId) invalidateGymQueries(qc, requireGymId(user.gymId));
    },
  });
}

export function useDeleteSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .eq('gym_id', gymId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user?.gymId) invalidateGymQueries(qc, requireGymId(user.gymId));
    },
  });
}
