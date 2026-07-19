/**
 * WizardContainer - Responsive Container for Wizards
 * 
 * Features:
 * - Mobile-first responsive design
 * - Desktop max-width constraints
 * - Consistent spacing
 * - Header with branding
 */

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardContainerProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-lg',
  md: 'max-w-xl lg:max-w-3xl', // Desktop'ta daha geniş
  lg: 'max-w-2xl lg:max-w-5xl', // Desktop'ta çok daha geniş
  xl: 'max-w-3xl lg:max-w-6xl',
  '2xl': 'max-w-4xl lg:max-w-7xl'
};

export function WizardContainer({
  title,
  subtitle,
  badge = 'Rezervasyon',
  children,
  maxWidth = 'lg',
  className
}: WizardContainerProps) {
  return (
    <div 
      className={cn(
        "w-full mx-auto pb-24 px-4 sm:px-6 lg:px-8 py-6",
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {/* Header - Consistent branding */}
      <div className="mb-6 lg:mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">
            {badge}
          </span>
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm lg:text-base text-[var(--muted-lead)]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Content - Steps - Desktop'ta grid layout */}
      <div className="space-y-3 lg:space-y-4">
        {children}
      </div>
    </div>
  );
}
