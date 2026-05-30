/** fetch مع مهلة — يمنع تعليق الطلبات عند بطء الشبكة أو مشروع Supabase المتوقف */
const DEFAULT_TIMEOUT_MS = 20_000;

export function createFetchWithTimeout(timeoutMs = DEFAULT_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const signals = [controller.signal];
    if (init?.signal) {
      if (init.signal.aborted) {
        clearTimeout(timer);
        throw new DOMException('Aborted', 'AbortError');
      }
      init.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(
          'انتهت مهلة الاتصال بـ Supabase. تحقق من الإنترنت أو أن المشروع غير متوقف (Paused) في لوحة Supabase.'
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };
}
