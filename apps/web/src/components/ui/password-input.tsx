import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@gymos/utils';

type PasswordInputProps = Omit<InputProps, 'type'> & {
  showLockIcon?: boolean;
};

export function PasswordInput({
  className,
  showLockIcon = true,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {showLockIcon && (
        <div className="pointer-events-none absolute right-3 top-2.5 text-[hsl(var(--muted-foreground))]">
          <Lock className="w-5 h-5" />
        </div>
      )}
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        className={cn(showLockIcon ? 'pr-10 pl-10' : 'pl-10', 'text-right', className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
        aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        aria-pressed={visible}
        aria-controls={id}
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}
