// ============================================================
// GymOS SaaS - Mock Supabase Client
// For demo and local sandbox mode when real keys are placeholders
// ============================================================

import type { Session, User } from '@supabase/supabase-js';
import { isSuperAdminEmail } from './super-admin-config';

const MOCK_STORAGE_KEY = 'gymos_mock_db';
const MOCK_DB_BACKUP_KEY = 'gymos_mock_db_backup';
const MOCK_SESSION_KEY = 'gymos_mock_session';

const DB_TABLES = [
  'gyms',
  'users',
  'members',
  'subscriptions',
  'payments',
  'expenses',
  'gym_subscriptions',
  'saas_settings',
  'super_admins',
] as const;

/**
 * يضمن وجود جداول بدون مسح بيانات الصالات الموجودة.
 * تسجيل الخروج يمسح الجلسة فقط (MOCK_SESSION_KEY) وليس هذا المخزن.
 */
export type MockDb = Record<string, any[]>;

function ensureDbShape(db: Record<string, unknown>): MockDb {
  const out = { ...db } as MockDb;
  for (const table of DB_TABLES) {
    if (!Array.isArray(out[table])) {
      out[table] = [];
    }
  }
  return out;
}

const DEFAULT_GYM_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_USER_ID = '22222222-2222-2222-2222-222222222222';

// ─── Initial Seed Data ──────────────────────────────────────
const getInitialDb = (): MockDb => {
  const now = new Date();
  
  // Helper to subtract months
  const subMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() - months);
    return d;
  };

  // Helper to add/sub days
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const gym = {
    id: DEFAULT_GYM_ID,
    name: 'Apex Fitness Center',
    phone: '+1 (555) 123-4567',
    address: '100 Muscle Boulevard, Suite A, Metropolis',
    created_at: subMonths(now, 6).toISOString(),
  };

  const user = {
    id: DEFAULT_USER_ID,
    gym_id: DEFAULT_GYM_ID,
    full_name: 'Jane Doe',
    email: 'jane@gymos.com',
    role: 'owner',
    created_at: subMonths(now, 6).toISOString(),
  };

  const members = [
    {
      id: 'm1-uuid',
      gym_id: DEFAULT_GYM_ID,
      full_name: 'Alex Rivera',
      phone: '+1 (555) 234-5678',
      email: 'alex.rivera@example.com',
      gender: 'male',
      age: 28,
      weight: '78.50',
      join_date: subMonths(now, 5).toISOString().split('T')[0],
      status: 'active',
      notes: 'Focus on strength training and hypertrophy.',
      created_at: subMonths(now, 5).toISOString(),
    },
    {
      id: 'm2-uuid',
      gym_id: DEFAULT_GYM_ID,
      full_name: 'Sarah Chen',
      phone: '+1 (555) 345-6789',
      email: 'sarah.chen@example.com',
      gender: 'female',
      age: 32,
      weight: '62.00',
      join_date: subMonths(now, 4).toISOString().split('T')[0],
      status: 'active',
      notes: 'Prefers cardio classes and yoga. Prefers early mornings.',
      created_at: subMonths(now, 4).toISOString(),
    },
    {
      id: 'm3-uuid',
      gym_id: DEFAULT_GYM_ID,
      full_name: 'Marcus Vance',
      phone: '+1 (555) 456-7890',
      email: 'marcus.vance@example.com',
      gender: 'male',
      age: 45,
      weight: '92.30',
      join_date: subMonths(now, 3).toISOString().split('T')[0],
      status: 'active',
      notes: 'Needs general fitness coaching. Recovering from minor knee injury.',
      created_at: subMonths(now, 3).toISOString(),
    },
    {
      id: 'm4-uuid',
      gym_id: DEFAULT_GYM_ID,
      full_name: 'Emily Watson',
      phone: '+1 (555) 567-8901',
      email: 'emily.watson@example.com',
      gender: 'female',
      age: 24,
      weight: '55.80',
      join_date: subMonths(now, 2).toISOString().split('T')[0],
      status: 'active',
      notes: 'Student membership. Focus on endurance.',
      created_at: subMonths(now, 2).toISOString(),
    },
    {
      id: 'm5-uuid',
      gym_id: DEFAULT_GYM_ID,
      full_name: 'David Kim',
      phone: '+1 (555) 678-9012',
      email: 'david.kim@example.com',
      gender: 'male',
      age: 35,
      weight: '84.00',
      join_date: subMonths(now, 1).toISOString().split('T')[0],
      status: 'active',
      notes: 'Enjoys boxing and HIIT classes.',
      created_at: subMonths(now, 1).toISOString(),
    },
    {
      id: 'm6-uuid',
      gym_id: DEFAULT_GYM_ID,
      full_name: 'Jessica Taylor',
      phone: '+1 (555) 789-0123',
      email: 'jessica.taylor@example.com',
      gender: 'female',
      age: 29,
      weight: '68.20',
      join_date: subMonths(now, 5).toISOString().split('T')[0],
      status: 'inactive',
      notes: 'Cancelled due to relocation. Might rejoin later.',
      created_at: subMonths(now, 5).toISOString(),
    },
    {
      id: 'm7-uuid',
      gym_id: DEFAULT_GYM_ID,
      full_name: 'Michael Brown',
      phone: '+1 (555) 890-1234',
      email: 'michael.brown@example.com',
      gender: 'male',
      age: 31,
      weight: '80.00',
      join_date: subMonths(now, 1).toISOString().split('T')[0],
      status: 'active',
      notes: 'Subscription expiring in a few days.',
      created_at: subMonths(now, 1).toISOString(),
    },
    {
      id: 'm8-uuid',
      gym_id: DEFAULT_GYM_ID,
      full_name: 'Lisa Ray',
      phone: '+1 (555) 901-2345',
      email: 'lisa.ray@example.com',
      gender: 'female',
      age: 38,
      weight: '59.00',
      join_date: subMonths(now, 6).toISOString().split('T')[0],
      status: 'active',
      notes: 'Old member, subscription has expired.',
      created_at: subMonths(now, 6).toISOString(),
    },
  ];

  const subscriptions = [
    {
      id: 'sub1',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'm1-uuid',
      plan_name: 'Premium Plan',
      price: '59.99',
      start_date: subMonths(now, 5).toISOString().split('T')[0],
      end_date: addDays(now, 25).toISOString().split('T')[0],
      payment_status: 'paid',
      created_at: subMonths(now, 5).toISOString(),
    },
    {
      id: 'sub2',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'm2-uuid',
      plan_name: 'Basic Plan',
      price: '29.99',
      start_date: subMonths(now, 4).toISOString().split('T')[0],
      end_date: addDays(now, 55).toISOString().split('T')[0],
      payment_status: 'paid',
      created_at: subMonths(now, 4).toISOString(),
    },
    {
      id: 'sub3',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'm3-uuid',
      plan_name: 'VIP Plan',
      price: '99.99',
      start_date: subMonths(now, 3).toISOString().split('T')[0],
      end_date: addDays(now, 85).toISOString().split('T')[0],
      payment_status: 'paid',
      created_at: subMonths(now, 3).toISOString(),
    },
    {
      id: 'sub4',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'm4-uuid',
      plan_name: 'Basic Plan',
      price: '29.99',
      start_date: subMonths(now, 2).toISOString().split('T')[0],
      end_date: addDays(now, 115).toISOString().split('T')[0],
      payment_status: 'paid',
      created_at: subMonths(now, 2).toISOString(),
    },
    {
      id: 'sub5',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'm5-uuid',
      plan_name: 'Premium Plan',
      price: '59.99',
      start_date: subMonths(now, 1).toISOString().split('T')[0],
      end_date: addDays(now, 145).toISOString().split('T')[0],
      payment_status: 'paid',
      created_at: subMonths(now, 1).toISOString(),
    },
    {
      id: 'sub6',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'm7-uuid',
      plan_name: 'Basic Plan',
      price: '29.99',
      start_date: subMonths(now, 1).toISOString().split('T')[0],
      end_date: addDays(now, 3).toISOString().split('T')[0], // expiring in 3 days
      payment_status: 'paid',
      created_at: subMonths(now, 1).toISOString(),
    },
    {
      id: 'sub7',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'm8-uuid',
      plan_name: 'VIP Plan',
      price: '99.99',
      start_date: subMonths(now, 6).toISOString().split('T')[0],
      end_date: addDays(now, -5).toISOString().split('T')[0], // expired 5 days ago
      payment_status: 'paid',
      created_at: subMonths(now, 6).toISOString(),
    },
  ];

  // Generate historical payments for last 6 months to populate revenue charts beautifully
  const payments: any[] = [];
  let payId = 1;

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    // Number of payments depends on number of active members at that time
    // We add some variability to make the charts look interesting
    const paymentMethods = ['card', 'cash', 'bank_transfer'];
    const activeMembersCount = 3 + (5 - i); // growing over time
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 5);

    for (let j = 0; j < activeMembersCount; j++) {
      const amount = j % 3 === 0 ? 99.99 : j % 3 === 1 ? 59.99 : 29.99;
      const method = paymentMethods[j % 3];
      const memberId = `m${(j % 5) + 1}-uuid`;

      payments.push({
        id: `pay-${payId++}`,
        gym_id: DEFAULT_GYM_ID,
        member_id: memberId,
        amount: String(amount),
        payment_method: method,
        paid_at: new Date(monthStart.getFullYear(), monthStart.getMonth(), 5 + j * 3).toISOString(),
      });
    }
  }

  const expenses = [
    {
      id: 'exp-1',
      gym_id: DEFAULT_GYM_ID,
      category: 'rent',
      title: 'إيجار الصالة',
      amount: '4500',
      description: 'إيجار شهري',
      spent_at: subMonths(now, 1).toISOString(),
      created_at: subMonths(now, 1).toISOString(),
    },
    {
      id: 'exp-2',
      gym_id: DEFAULT_GYM_ID,
      category: 'trainer_salary',
      title: 'مرتبات المدربين',
      amount: '2800',
      description: null,
      spent_at: now.toISOString(),
      created_at: now.toISOString(),
    },
    {
      id: 'exp-3',
      gym_id: DEFAULT_GYM_ID,
      category: 'utilities',
      title: 'فاتورة كهرباء',
      amount: '650',
      description: null,
      spent_at: now.toISOString(),
      created_at: now.toISOString(),
    },
  ];

  const gymSubscription = {
    id: 'saas-sub-default',
    gym_id: DEFAULT_GYM_ID,
    plan_type: '1_month',
    amount: '0',
    start_date: subMonths(now, 1).toISOString().split('T')[0],
    end_date: addDays(now, 30).toISOString().split('T')[0],
    payment_status: 'paid',
    payment_method: 'cash',
    status: 'active',
    paid_at: now.toISOString(),
    created_at: subMonths(now, 1).toISOString(),
  };

  const saas_settings = [
    {
      id: 'saas-settings-1',
      monthly_price: '1000',
      three_month_price: '2500',
      six_month_price: '4500',
      yearly_price: '8000',
      lifetime_price: '20000',
      updated_at: now.toISOString(),
    },
  ];

  return {
    gyms: [gym],
    users: [user],
    members,
    subscriptions,
    payments,
    expenses,
    gym_subscriptions: [gymSubscription],
    saas_settings,
    super_admins: [{ user_id: DEFAULT_USER_ID, email: 'jane@gymos.com', created_at: now.toISOString() }],
  } as MockDb;
};

// ─── LocalStorage Operations ───────────────────────────────
export function getMockDb(): MockDb {
  const raw = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!raw) {
    const fresh = getInitialDb();
    saveMockDb(fresh);
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const shaped = ensureDbShape(parsed);

    const hadGyms = Array.isArray(parsed.gyms) && (parsed.gyms as unknown[]).length > 0;
    if (!hadGyms && shaped.gyms.length === 0) {
      const seed = getInitialDb();
      saveMockDb(seed);
      return seed;
    }

    if (JSON.stringify(parsed) !== JSON.stringify(shaped)) {
      saveMockDb(shaped);
    }
    return shaped;
  } catch (e) {
    console.error('تعذر قراءة بيانات الصالات المحلية، استعادة النسخة الاحتياطية إن وُجدت', e);
    localStorage.setItem(`${MOCK_STORAGE_KEY}_corrupt_snapshot`, raw);

    const backupRaw = localStorage.getItem(MOCK_DB_BACKUP_KEY);
    if (backupRaw) {
      try {
        const fromBackup = ensureDbShape(JSON.parse(backupRaw));
        saveMockDb(fromBackup);
        return fromBackup;
      } catch {
        /* continue */
      }
    }

    const empty = ensureDbShape({});
    saveMockDb(empty);
    return empty;
  }
}

export function saveMockDb(db: MockDb) {
  const shaped = ensureDbShape(db);
  const json = JSON.stringify(shaped);
  localStorage.setItem(MOCK_STORAGE_KEY, json);
  localStorage.setItem(MOCK_DB_BACKUP_KEY, json);
}

function getMockSession(): Session | null {
  const raw = localStorage.getItem(MOCK_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setMockSession(session: any) {
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  dispatchEvent(new CustomEvent('mock-auth-change', {
    detail: { event: 'SIGNED_IN', session }
  }));
}

function clearMockSession() {
  // الجلسة فقط — لا نمسح MOCK_STORAGE_KEY (أعضاء، مدفوعات، اشتراكات…)
  localStorage.removeItem(MOCK_SESSION_KEY);
  dispatchEvent(new CustomEvent('mock-auth-change', {
    detail: { event: 'SIGNED_OUT', session: null }
  }));
}

// ─── Query Builder & Client ─────────────────────────────────
export class MockSupabaseQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private rangeStart: number | null = null;
  private rangeEnd: number | null = null;
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  eq(column: string, value: any) {
    if (!column.includes('.')) {
      this.filters.push(item => item[column] === value);
    }
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push(item => item[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push(item => item[column] <= value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push(item => item[column] >= value);
    return this;
  }

  or(condition: string) {
    const parts = condition.split(',');
    this.filters.push(item => {
      return parts.some(part => {
        const [col, op, val] = part.split('.');
        if (op === 'ilike') {
          const cleanVal = val.replace(/%/g, '').toLowerCase();
          return String(item[col] ?? '').toLowerCase().includes(cleanVal);
        }
        return false;
      });
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderCol = column;
    this.orderAscending = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeStart = from;
    this.rangeEnd = to;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : result;
    } catch (error) {
      if (onrejected) return onrejected(error);
      throw error;
    }
  }

  private async execute() {
    await new Promise(r => setTimeout(r, 150));

    const db = getMockDb();
    let data = db[this.tableName] || [];

    // Filter
    for (const filter of this.filters) {
      data = data.filter(filter);
    }

    // Sort
    if (this.orderCol) {
      data = [...data].sort((a, b) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA < valB) return this.orderAscending ? -1 : 1;
        if (valA > valB) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }

    const count = data.length;

    // Range / Limit
    if (this.rangeStart !== null && this.rangeEnd !== null) {
      data = data.slice(this.rangeStart, this.rangeEnd + 1);
    } else if (this.limitCount !== null) {
      data = data.slice(0, this.limitCount);
    }

    // Single
    if (this.isSingle) {
      if (data.length === 0) {
        return { data: null, error: { message: 'Record not found' }, count: 0 };
      }
      const item = { ...data[0] };
      if (this.tableName === 'subscriptions' || this.tableName === 'payments') {
        const members = db['members'] || [];
        item.members = members.find((m: any) => m.id === item.member_id) || null;
      }
      return { data: item, error: null, count: 1 };
    }

    // Populate joins for lists
    if (this.tableName === 'subscriptions' || this.tableName === 'payments') {
      const members = db['members'] || [];
      data = data.map((item: any) => ({
        ...item,
        members: members.find((m: any) => m.id === item.member_id) || null,
      }));
    }

    return { data, error: null, count };
  }
}

class MockUpdateBuilder {
  private tableName: string;
  private payload: any;
  private filters: Record<string, any> = {};

  constructor(tableName: string, payload: any) {
    this.tableName = tableName;
    this.payload = payload;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  select() {
    return {
      single: async () => {
        await new Promise(r => setTimeout(r, 150));
        const db = getMockDb();
        let updatedItem: any = null;

        db[this.tableName] = (db[this.tableName] || []).map((item: any) => {
          const matches = Object.entries(this.filters).every(([col, val]) => item[col] === val);
          if (matches) {
            updatedItem = { ...item, ...this.payload };
            return updatedItem;
          }
          return item;
        });

        if (updatedItem) {
          saveMockDb(db);
          return { data: updatedItem, error: null };
        }
        return { data: null, error: { message: 'Item not found' } };
      }
    };
  }

  async then(resolve: any) {
    await new Promise(r => setTimeout(r, 150));
    const db = getMockDb();
    let count = 0;

    db[this.tableName] = (db[this.tableName] || []).map((item: any) => {
      const matches = Object.entries(this.filters).every(([col, val]) => item[col] === val);
      if (matches) {
        count++;
        return { ...item, ...this.payload };
      }
      return item;
    });

    if (count > 0) {
      saveMockDb(db);
    }
    resolve({ error: null });
  }
}

class MockDeleteBuilder {
  private tableName: string;
  private filters: Record<string, any> = {};

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : result;
    } catch (error) {
      if (onrejected) return onrejected(error);
      throw error;
    }
  }

  private async execute() {
    await new Promise(r => setTimeout(r, 150));
    const db = getMockDb();
    const lenBefore = (db[this.tableName] || []).length;

    db[this.tableName] = (db[this.tableName] || []).filter((item: any) => {
      const matches = Object.entries(this.filters).every(([col, val]) => item[col] === val);
      return !matches;
    });

    const lenAfter = db[this.tableName].length;
    if (lenBefore !== lenAfter) {
      saveMockDb(db);
    }
    return { error: null };
  }
}

export class MockSupabaseClient {
  from(table: string) {
    return {
      select: (columns?: string, options?: any) => {
        return new MockSupabaseQueryBuilder(table);
      },
      insert: (payload: any) => {
        const executeInsert = () => {
          const db = getMockDb();
          const items = Array.isArray(payload) ? payload : [payload];
          const created = items.map(item => ({
            id: item.id || crypto.randomUUID(),
            created_at: new Date().toISOString(),
            ...item,
          }));
          db[table] = [...(db[table] || []), ...created];
          saveMockDb(db);
          return { data: created, error: null };
        };

        return {
          select: () => ({
            single: async () => {
              await new Promise(r => setTimeout(r, 150));
              const { data } = executeInsert();
              return { data: data[0], error: null };
            },
            then: async (resolve: any) => {
              await new Promise(r => setTimeout(r, 150));
              resolve(executeInsert());
            }
          }),
          then: async (resolve: any) => {
            await new Promise(r => setTimeout(r, 150));
            resolve(executeInsert());
          }
        };
      },
      update: (payload: any) => {
        return new MockUpdateBuilder(table, payload);
      },
      delete: () => {
        return new MockDeleteBuilder(table);
      }
    };
  }

  auth = {
    getSession: async () => {
      await new Promise(r => setTimeout(r, 100));
      const session = getMockSession();
      return { data: { session }, error: null };
    },
    signUp: async ({ email, password, options }: any) => {
      await new Promise(r => setTimeout(r, 300));
      const id = crypto.randomUUID();
      const user = { id, email } as User;
      const session = { user, access_token: 'mock-token' } as unknown as Session;
      
      // Seed user profile
      const db = getMockDb();
      const newGymId = crypto.randomUUID();
      
      // Auto create a gym for them
      const gymName = options?.data?.gym_name || 'My Gym';
      const newGym = {
        id: newGymId,
        name: gymName,
        created_at: new Date().toISOString(),
      };
      db.gyms = [...(db.gyms || []), newGym];

      const profile = {
        id,
        gym_id: newGymId,
        full_name: options?.data?.full_name || 'New Owner',
        email,
        role: 'owner',
        created_at: new Date().toISOString(),
      };
      db.users = [...(db.users || []), profile];
      saveMockDb(db);

      setMockSession(session);
      return { data: { user, session }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
      await new Promise(r => setTimeout(r, 300));
      const db = getMockDb();
      const normalizedEmail = String(email ?? '').trim().toLowerCase();
      const userProfile = (db.users || []).find(
        (u: any) => String(u.email ?? '').trim().toLowerCase() === normalizedEmail
      );

      if (!userProfile) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        };
      }

      const user = { id: userProfile.id, email: normalizedEmail || userProfile.email } as User;
      const session = { user, access_token: 'mock-token' } as unknown as Session;

      setMockSession(session);
      return { data: { user, session }, error: null };
    },
    signOut: async () => {
      await new Promise(r => setTimeout(r, 100));
      clearMockSession();
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      const handler = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
          callback(customEvent.detail.event, customEvent.detail.session);
        }
      };
      window.addEventListener('mock-auth-change', handler);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              window.removeEventListener('mock-auth-change', handler);
            }
          }
        }
      };
    }
  };

  rpc = async (fn: string, params?: Record<string, unknown>) => {
    await new Promise((r) => setTimeout(r, 120));
    const db = getMockDb();
    const session = getMockSession();
    const uid = session?.user?.id;
    const email = session?.user?.email ?? '';

    const isAdmin =
      isSuperAdminEmail(email) ||
      (db.super_admins ?? []).some((a: { user_id: string }) => a.user_id === uid);

    if (fn === 'is_super_admin') {
      return { data: isAdmin, error: null };
    }

    if (!isAdmin) {
      return { data: null, error: { message: 'غير مصرح' } };
    }

    if (fn === 'get_my_gym_profile') {
      const u = (db.users ?? []).find((x: { id: string }) => x.id === uid);
      if (!u) return { data: null, error: null };
      return {
        data: [{ gym_id: u.gym_id, full_name: u.full_name, role: u.role }],
        error: null,
      };
    }

    if (fn === 'admin_get_platform_stats') {
      const subs = db.gym_subscriptions ?? [];
      return {
        data: {
          total_gyms: (db.gyms ?? []).length,
          active_subscriptions: subs.filter((s: { status: string }) => s.status === 'active').length,
          expired_subscriptions: subs.filter((s: { status: string }) => s.status === 'expired').length,
          suspended_subscriptions: subs.filter((s: { status: string }) => s.status === 'suspended').length,
          total_platform_revenue: subs.reduce(
            (sum: number, s: { amount: string }) => sum + Number(s.amount),
            0
          ),
          new_gyms_this_month: (db.gyms ?? []).length,
          pending_payments: subs.filter((s: { payment_status: string }) =>
            ['pending', 'overdue'].includes(s.payment_status)
          ).length,
        },
        error: null,
      };
    }

    if (fn === 'admin_list_gyms') {
      const rows = (db.gyms ?? []).map((g: { id: string; name: string; phone?: string; address?: string; created_at: string }) => {
        const owner = (db.users ?? []).find(
          (u: { gym_id: string; role: string }) => u.gym_id === g.id && u.role === 'owner'
        );
        const gs = [...(db.gym_subscriptions ?? [])]
          .filter((s: { gym_id: string }) => s.gym_id === g.id)
          .sort(
            (a: { created_at: string }, b: { created_at: string }) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
        return {
          gym_id: g.id,
          gym_name: g.name,
          phone: g.phone ?? null,
          address: g.address ?? null,
          gym_created_at: g.created_at,
          owner_user_id: owner?.id ?? null,
          owner_name: owner?.full_name ?? null,
          members_count: (db.members ?? []).filter((m: { gym_id: string }) => m.gym_id === g.id).length,
          subscription_id: gs?.id ?? null,
          plan_type: gs?.plan_type ?? null,
          subscription_status: gs?.status ?? null,
          end_date: gs?.end_date ?? null,
          payment_status: gs?.payment_status ?? null,
          amount: gs ? Number(gs.amount) : null,
          start_date: gs?.start_date ?? null,
        };
      });
      return { data: rows, error: null };
    }

    if (fn === 'admin_update_gym_subscription') {
      const gymId = params?.p_gym_id as string;
      const extendDays = params?.p_extend_days as number | null;
      const subs = db.gym_subscriptions ?? [];
      const idx = subs.findIndex((s: { gym_id: string }) => s.gym_id === gymId);
      if (idx < 0) return { data: null, error: { message: 'لا يوجد اشتراك' } };
      const sub = { ...subs[idx] };
      if (extendDays) {
        const base = sub.end_date ? new Date(sub.end_date) : new Date();
        base.setDate(base.getDate() + extendDays);
        sub.end_date = base.toISOString().split('T')[0];
        sub.status = 'active';
        sub.payment_status = 'paid';
      }
      if (params?.p_status) sub.status = params.p_status;
      if (params?.p_end_date) sub.end_date = params.p_end_date;
      if (params?.p_plan_type) sub.plan_type = params.p_plan_type;
      if (params?.p_payment_status) sub.payment_status = params.p_payment_status;
      subs[idx] = sub;
      db.gym_subscriptions = subs;
      saveMockDb(db);
      return { data: { success: true }, error: null };
    }

    if (fn === 'admin_get_saas_settings') {
      const s = (db.saas_settings ?? [])[0] ?? null;
      return { data: s, error: null };
    }

    if (fn === 'admin_update_saas_settings') {
      const row = {
        id: (db.saas_settings?.[0]?.id as string) ?? 'saas-settings-1',
        monthly_price: String(params?.p_monthly),
        three_month_price: String(params?.p_three_month),
        six_month_price: String(params?.p_six_month),
        yearly_price: String(params?.p_yearly),
        lifetime_price: String(params?.p_lifetime),
        updated_at: new Date().toISOString(),
      };
      db.saas_settings = [row];
      saveMockDb(db);
      return { data: { success: true }, error: null };
    }

    return { data: null, error: { message: `Unknown RPC: ${fn}` } };
  };
}
