import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requireGymId } from '@/lib/gym-id';
import { gymQueryKey, canLoadGymData } from '@/lib/gym-query-keys';
import { useAuth } from './use-auth';
import type { DashboardStats, RevenueDataPoint, GrowthDataPoint, ExpiringSubscription } from '@gymos/types';

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery<DashboardStats>({
    queryKey: gymQueryKey(user?.gymId, 'dashboard', 'stats'),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      const { count: totalMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact' })
        .eq('gym_id', gymId);

      const { count: activeMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact' })
        .eq('gym_id', gymId)
        .eq('status', 'active');

      const { count: expiredSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact' })
        .eq('gym_id', gymId)
        .lt('end_date', today);

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('gym_id', gymId)
        .gte('paid_at', startOfMonth);

      const monthlyRevenue = (payments ?? []).reduce(
        (sum: number, p: { amount: string | number }) => sum + Number(p.amount),
        0
      );

      return {
        totalMembers: totalMembers ?? 0,
        activeMembers: activeMembers ?? 0,
        expiredSubscriptions: expiredSubscriptions ?? 0,
        monthlyRevenue,
      };
    },
    enabled: canLoadGymData(user?.gymId),
  });
}

export function useRevenueChart() {
  const { user } = useAuth();

  return useQuery<RevenueDataPoint[]>({
    queryKey: gymQueryKey(user?.gymId, 'dashboard', 'revenue-chart'),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);

      const months: RevenueDataPoint[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = d.toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data } = await supabase
          .from('payments')
          .select('amount')
          .eq('gym_id', gymId)
          .gte('paid_at', start)
          .lte('paid_at', end);

        const total = (data ?? []).reduce(
          (sum: number, p: { amount: string | number }) => sum + Number(p.amount),
          0
        );
        months.push({
          month: d.toLocaleString('default', { month: 'short' }),
          revenue: total,
        });
      }

      return months;
    },
    enabled: canLoadGymData(user?.gymId),
  });
}

export function useGrowthChart() {
  const { user } = useAuth();

  return useQuery<GrowthDataPoint[]>({
    queryKey: gymQueryKey(user?.gymId, 'dashboard', 'growth-chart'),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);

      const months: GrowthDataPoint[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const endDate = d.toISOString().split('T')[0];

        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact' })
          .eq('gym_id', gymId)
          .lte('join_date', endDate);

        months.push({
          month: new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleString('default', {
            month: 'short',
          }),
          members: count ?? 0,
        });
      }

      return months;
    },
    enabled: canLoadGymData(user?.gymId),
  });
}

export function useExpiringSubscriptions() {
  const { user } = useAuth();

  return useQuery<ExpiringSubscription[]>({
    queryKey: gymQueryKey(user?.gymId, 'dashboard', 'expiring'),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const gymId = requireGymId(user.gymId);

      const today = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, plan_name, end_date, members!inner(full_name)')
        .eq('gym_id', gymId)
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', sevenDaysLater.toISOString().split('T')[0])
        .order('end_date', { ascending: true })
        .limit(10);

      if (error) throw error;

      return (data ?? []).map((sub: {
        id: string;
        plan_name: string;
        end_date: string;
        members?: { full_name?: string };
      }) => {
        const endDate = new Date(sub.end_date);
        const diffTime = endDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: sub.id,
          memberName: sub.members?.full_name ?? 'Unknown',
          planName: sub.plan_name,
          endDate: sub.end_date,
          daysLeft,
        };
      });
    },
    enabled: canLoadGymData(user?.gymId),
  });
}
