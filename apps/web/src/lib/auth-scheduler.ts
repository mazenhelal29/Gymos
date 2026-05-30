/**
 * تأجيل عمليات Auth جانبية — مطلوب من Supabase لتجنب deadlock مع signInWithPassword.
 * @see https://supabase.com/docs/reference/javascript/auth-onauthstatechange
 */
export function deferAuthWork(work: () => void | Promise<void>): void {
  setTimeout(() => {
    void work();
  }, 0);
}

export function deferAuthWorkAsync<T>(work: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      work().then(resolve).catch(reject);
    }, 0);
  });
}
