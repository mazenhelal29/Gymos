import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export interface Package {
  id: string;
  gym_id: string;
  name: string;
  duration_days: number;
  price: number;
  created_at: string;
}

export function usePackages() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['packages', user?.gymId],
    queryFn: async () => {
      if (!user?.gymId) return [];

      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('gym_id', user.gymId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Package[];
    },
    enabled: !!user?.gymId,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pkg: Omit<Package, 'id' | 'created_at' | 'gym_id'>) => {
      const { data, error } = await supabase
        .from('packages')
        .insert([{ ...pkg, gym_id: user?.gymId }])
        .select()
        .single();

      if (error) throw error;
      return data as Package;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Package> & { id: string }) => {
      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Package;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}
