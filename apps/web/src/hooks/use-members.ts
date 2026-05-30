import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requireGymId } from '@/lib/gym-id';
import { gymQueryKey, canLoadGymData } from '@/lib/gym-query-keys';
import { useAuth } from './use-auth';
import type { InsertMember } from '@gymos/types';

export type MemberFormData = Omit<InsertMember, 'gym_id'>;

export function useMembers(params?: { search?: string; status?: string; page?: number; pageSize?: number }) {
  const { user } = useAuth();
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;

  return useQuery({
    queryKey: gymQueryKey(user?.gymId, 'members', params),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);

      let query = supabase
        .from('members')
        .select('*', { count: 'exact' })
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });

      if (params?.search) {
        query = query.or(
          `full_name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%`
        );
      }

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

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

export function useMember(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: gymQueryKey(user?.gymId, 'member', id),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .eq('gym_id', gymId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: canLoadGymData(user?.gymId) && !!id,
  });
}

function invalidateGymData(qc: ReturnType<typeof useQueryClient>, gymId: string) {
  qc.invalidateQueries({ queryKey: ['gym', gymId] });
}

export function useCreateMember() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (member: MemberFormData) => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { data, error } = await supabase
        .from('members')
        .insert({
          ...member,
          gym_id: gymId,
          weight: member.weight ? String(member.weight) : null,
          email: member.email || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, _vars, _ctx) => {
      const gymId = requireGymId(user?.gymId);
      invalidateGymData(qc, gymId);
    },
  });
}

export function useUpdateMember() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...member }: MemberFormData & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { data, error } = await supabase
        .from('members')
        .update({
          ...member,
          weight: member.weight ? String(member.weight) : null,
          email: member.email || null,
        })
        .eq('id', id)
        .eq('gym_id', gymId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (user?.gymId) invalidateGymData(qc, requireGymId(user.gymId));
    },
  });
}

export function useDeleteMember() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)
        .eq('gym_id', gymId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user?.gymId) invalidateGymData(qc, requireGymId(user.gymId));
    },
  });
}
