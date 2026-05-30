import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { deferAuthWork, deferAuthWorkAsync } from '@/lib/auth-scheduler';
import { isValidUuid } from '@/lib/gym-id';
import { isGymAccessBlocked, shouldBlockGymAccess } from '@/lib/gym-subscription';
import { isSuperAdminEmail } from '@/lib/super-admin-config';
import { queryClient } from '@/lib/query-client';
import type { AuthUser, SignupData, LoginData, GymSubscription } from '@gymos/types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  gymSubscription: GymSubscription | null;
  signUp: (data: SignupData) => Promise<{ error: string | null }>;
  signIn: (data: LoginData) => Promise<{ error: string | null; redirectTo?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_FETCH_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function mapAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('انتهت مهلة الاتصال') || msg.includes('AbortError') || msg.includes('aborted')) {
    return 'تعذر الاتصال بـ Supabase. تحقق من الإنترنت، أو أن المشروع غير متوقف (Paused) في dashboard.supabase.com ثم أعد المحاولة.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'خطأ في الشبكة. تحقق من اتصال الإنترنت أو جدار الحماية.';
  }
  return msg || 'حدث خطأ غير متوقع';
}

async function resolveSuperAdmin(userId: string, email: string): Promise<boolean> {
  if (isSuperAdminEmail(email)) return true;
  try {
    const { data, error } = await withTimeout(
      Promise.resolve(supabase.rpc('is_super_admin')) as Promise<{
        data: boolean | null;
        error: { message: string } | null;
      }>,
      5000,
      'timeout'
    );
    if (!error && data === true) return true;
  } catch {
    /* RPC غير منشأ */
  }
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [gymSubscription, setGymSubscription] = useState<GymSubscription | null>(null);

  /** يمنع تحميل الملف مرتين عند SIGNED_IN (signIn يتولى التحميل) */
  const skipAuthHandlerProfileRef = useRef(false);
  const profileLoadGeneration = useRef(0);

  const fetchProfile = useCallback(
    async (
      userId: string,
      email: string
    ): Promise<{ ok: boolean; isSuperAdmin: boolean; hasGym: boolean; accessBlocked?: boolean }> => {
    const generation = ++profileLoadGeneration.current;

    try {
      const isSuperAdmin = await resolveSuperAdmin(userId, email);
      type ProfileRow = { gym_id: string; full_name: string; role: 'owner' | 'staff' };

      let profile: ProfileRow | null = null;

      try {
        const { data: rpcData, error: rpcError } = await withTimeout(
          Promise.resolve(supabase.rpc('get_my_gym_profile')) as Promise<{
            data: ProfileRow[] | ProfileRow | null;
            error: { message: string } | null;
          }>,
          PROFILE_FETCH_TIMEOUT_MS,
          'profile-timeout'
        );

        if (!rpcError && rpcData) {
          const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
          if (row && isValidUuid(row.gym_id)) profile = row;
        }
      } catch {
        /* جرّب الجدول مباشرة */
      }

      if (!profile) {
        try {
          const { data, error } = await withTimeout(
            Promise.resolve(
              supabase.from('users').select('gym_id, full_name, role').eq('id', userId).single()
            ) as Promise<{
              data: ProfileRow | null;
              error: { message: string } | null;
            }>,
            PROFILE_FETCH_TIMEOUT_MS,
            'profile-timeout'
          );

          if (!error && data && isValidUuid(data.gym_id)) {
            profile = data;
          }
        } catch {
          /* لا ملف */
        }
      }

      if (generation !== profileLoadGeneration.current) {
        return { ok: false, isSuperAdmin: false, hasGym: false };
      }

      if (!profile) {
        if (isSuperAdmin) {
          setUser({
            id: userId,
            email,
            gymId: '',
            fullName: 'مدير المنصة',
            role: 'owner',
            isSuperAdmin: true,
          });
          setGymSubscription(null);
          return { ok: true, isSuperAdmin: true, hasGym: false };
        }
        setGymSubscription(null);
        return { ok: false, isSuperAdmin: false, hasGym: false };
      }

      setUser({
        id: userId,
        email,
        gymId: profile.gym_id,
        fullName: profile.full_name,
        role: profile.role,
        isSuperAdmin,
      });

      try {
        const { data: sub } = await withTimeout(
          Promise.resolve(
            supabase.from('gym_subscriptions').select('*').eq('gym_id', profile.gym_id).single()
          ) as Promise<{
            data: GymSubscription | null;
            error: { message: string } | null;
          }>,
          PROFILE_FETCH_TIMEOUT_MS,
          'sub-timeout'
        );
        if (generation === profileLoadGeneration.current) {
          setGymSubscription(sub);
        }
        const accessBlocked = isSuperAdmin ? false : isGymAccessBlocked(sub);
        return { ok: true, isSuperAdmin, hasGym: true, accessBlocked };
      } catch {
        if (generation === profileLoadGeneration.current) {
          setGymSubscription(null);
        }
        return { ok: true, isSuperAdmin, hasGym: true, accessBlocked: false };
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (generation === profileLoadGeneration.current) {
        setGymSubscription(null);
      }
      return { ok: false, isSuperAdmin: false, hasGym: false };
    }
  },
  []);

  useEffect(() => {
    const failsafe = setTimeout(() => setLoading(false), 4000);

    deferAuthWork(async () => {
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        setSession(s);
        if (s?.user) {
          await fetchProfile(s.user.id, s.user.email ?? '');
        }
      } catch (err) {
        console.error('Error initializing session:', err);
      } finally {
        setLoading(false);
        clearTimeout(failsafe);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, s: Session | null) => {
      deferAuthWork(async () => {
        try {
          setSession(s);

          if (!s?.user) {
            setUser(null);
            setGymSubscription(null);
            return;
          }

          if (skipAuthHandlerProfileRef.current && event === 'SIGNED_IN') {
            return;
          }

          if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
            await fetchProfile(s.user.id, s.user.email ?? '');
          }
        } catch (err) {
          console.error('Error in onAuthStateChange:', err);
        } finally {
          setLoading(false);
        }
      });
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (!session?.user || isValidUuid(user?.gymId) || user?.isSuperAdmin) return;

    let cancelled = false;
    const retry = () => {
      if (!cancelled) {
        deferAuthWork(async () => {
          await fetchProfile(session.user.id, session.user.email ?? '');
        });
      }
    };

    const timer = setInterval(retry, 8000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session, user?.gymId, user?.isSuperAdmin, fetchProfile]);

  const signUp = async (data: SignupData): Promise<{ error: string | null }> => {
    try {
      const authResult = await supabase.auth.signUp({ email: data.email, password: data.password });

      if (authResult.error) return { error: authResult.error.message };
      if (!authResult.data.user) return { error: 'Failed to create user' };
      const authData = authResult.data;
      const gymId = crypto.randomUUID();

      const { error: gymError } = await supabase.from('gyms').insert({
        id: gymId,
        name: data.gymName,
      });

      if (gymError) return { error: gymError.message };

      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        gym_id: gymId,
        full_name: data.fullName,
        role: 'owner',
      });

      if (profileError) return { error: profileError.message };

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      await supabase.from('gym_subscriptions').insert({
        gym_id: gymId,
        plan_type: '1_month',
        amount: 0,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        payment_status: 'paid',
        payment_method: 'cash',
        status: 'active',
      });

      const { data: sub } = await supabase
        .from('gym_subscriptions')
        .select('*')
        .eq('gym_id', gymId)
        .single();

      if (authData.session) setSession(authData.session);
      setUser({
        id: authData.user.id,
        email: data.email,
        gymId,
        fullName: data.fullName,
        role: 'owner',
      });
      setGymSubscription(sub);

      return { error: null };
    } catch (err: unknown) {
      return { error: mapAuthError(err) };
    }
  };

  const signIn = async (
    data: LoginData
  ): Promise<{ error: string | null; redirectTo?: string }> => {
    skipAuthHandlerProfileRef.current = true;

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (error) {
        return {
          error:
            error.message === 'Invalid login credentials'
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
              : error.message === 'Email not confirmed'
                ? 'البريد الإلكتروني غير مؤكد. راجع صندوق البريد أو عطّل تأكيد البريد من Supabase Auth.'
                : error.message,
        };
      }

      const authUser = authData.user;
      if (!authUser) return { error: 'فشل تسجيل الدخول' };

      if (authData.session) setSession(authData.session);

      const profile = await deferAuthWorkAsync(() =>
        fetchProfile(authUser.id, authUser.email ?? data.email)
      );

      if (!profile.ok) {
        return {
          error:
            'تم تسجيل الدخول لكن ملف الصالة غير موجود. نفّذ fix-missing-user-profiles.sql في Supabase أو أنشئ حساباً جديداً.',
        };
      }

      const redirectTo = profile.isSuperAdmin
        ? '/admin'
        : profile.accessBlocked
          ? '/expired'
          : '/';
      return { error: null, redirectTo };
    } catch (err: unknown) {
      console.error('SignIn error:', err);
      return { error: mapAuthError(err) };
    } finally {
      skipAuthHandlerProfileRef.current = false;
    }
  };

  const signOut = async () => {
    profileLoadGeneration.current += 1;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setGymSubscription(null);
    // يمسح كاش الواجهة فقط — البيانات تبقى في Supabase أو localStorage (mock)
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, gymSubscription, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
