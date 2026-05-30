import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@gymos/utils';

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function MobileDrawer({ open, onClose, title, children, className }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="إغلاق القائمة"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'القائمة'}
            className={cn(
              'fixed top-0 right-0 z-[60] flex h-[100dvh] w-[min(100vw-2.5rem,20rem)] flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl md:hidden',
              className
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[hsl(var(--border))] px-4">
              {title ? (
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">{title}</p>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-[hsl(var(--accent))] transition-colors"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-3">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
