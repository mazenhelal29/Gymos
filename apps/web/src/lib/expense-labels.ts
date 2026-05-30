import type { ExpenseCategory } from '@gymos/types';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  trainer_salary: 'مرتبات مدربين',
  rent: 'إيجار',
  utilities: 'مرافق (كهرباء / ماء)',
  equipment: 'معدات وصيانة',
  other: 'أخرى',
};

export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];
