import { cn } from '@/lib/utils';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ChromaticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  fullWidth?: boolean;
}

export function ChromaticButton({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ChromaticButtonProps) {
  if (variant === 'ghost') {
    return (
      <button
        className={cn(
          'liquid-glass-pill flex items-center justify-center gap-2 px-6 py-3',
          'font-heading font-medium text-sm text-[var(--silver-frost)]',
          'transition-all duration-200 hover:border-[var(--liquid-chrome)] hover:text-[var(--chrome-white)]',
          'active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }

  return (
    <button
      className={cn(
        'chromatic-btn flex items-center justify-center gap-2',
        fullWidth && 'w-full',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-[var(--void)]/10 border-t-[var(--void)] rounded-full animate-spin" />
      ) : (
        <span>{children}</span>
      )}
    </button>
  );
}

