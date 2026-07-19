/**
 * WizardButton - Optimized Action Buttons for Wizards
 * 
 * Features:
 * - Primary/Secondary variants
 * - Loading states
 * - Disabled states
 * - Responsive sizing
 * - Smooth animations
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
}

export function WizardButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  fullWidth = false,
  className,
  disabled,
  ...props
}: WizardButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-2xl font-heading font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 hover:shadow-2xl hover:shadow-purple-500/40 text-white active:scale-[0.98]",
    secondary: "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white active:scale-[0.98]",
    ghost: "bg-transparent hover:bg-white/5 text-white active:scale-[0.98]"
  };
  
  const sizeStyles = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-base lg:h-14 lg:px-8 lg:text-lg", // Desktop'ta daha büyük
    lg: "h-14 px-8 text-lg lg:h-16 lg:px-10 lg:text-xl"
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>İşleniyor...</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
