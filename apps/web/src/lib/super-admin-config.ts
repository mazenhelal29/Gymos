/** بريدات السوبر أدمن من .env (للتطوير أو قبل إضافة الجدول في Supabase) */
export function getSuperAdminEmails(): string[] {
  const raw = import.meta.env.VITE_SUPER_ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}
