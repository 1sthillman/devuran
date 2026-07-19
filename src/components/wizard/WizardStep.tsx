/**
 * WizardStep - Optimized Step Container
 * 
 * Features:
 * - Auto-scroll to active step (mobile & desktop)
 * - Smooth animations
 * - Focus management
 * - Responsive sizing
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepProps {
  id: number;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  isActive: boolean;
  isCompleted: boolean;
  canAccess: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function WizardStep({
  id,
  title,
  subtitle,
  icon: Icon,
  gradient,
  isActive,
  isCompleted,
  canAccess,
  onClick,
  children
}: WizardStepProps) {
  const stepRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ✅ Auto-scroll to active step (smooth, user-friendly)
  useEffect(() => {
    if (isActive && stepRef.current) {
      // Wait for animation to start
      setTimeout(() => {
        stepRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center', // Center in viewport (best for mobile)
          inline: 'nearest'
        });
      }, 100);
    }
  }, [isActive]);

  // ✅ Focus management for accessibility
  useEffect(() => {
    if (isActive && contentRef.current) {
      // Focus first interactive element in step content
      const firstInput = contentRef.current.querySelector<HTMLElement>(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
      }
    }
  }, [isActive]);

  return (
    <div ref={stepRef} className="scroll-mt-4 lg:scroll-mt-6">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300",
          isActive 
            ? "border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent shadow-2xl shadow-purple-500/20 lg:shadow-purple-500/30"
            : isCompleted 
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent" 
            : "border-white/[0.08] bg-white/[0.02]",
          !canAccess && "opacity-40 pointer-events-none"
        )}
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Shimmer effect for active step */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        )}
        
        {/* Step Header - Desktop'ta daha büyük */}
        <button
          onClick={onClick}
          disabled={!canAccess}
          className="w-full text-left relative z-10"
          aria-expanded={isActive}
          aria-label={`${title} step${isCompleted ? ' - completed' : ''}${isActive ? ' - active' : ''}`}
        >
          <div className="relative flex items-center justify-between p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
              <div
                className={cn(
                  "w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
                  isCompleted 
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30" 
                    : isActive
                    ? `bg-gradient-to-br ${gradient} shadow-lg shadow-purple-500/30`
                    : "bg-white/5"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 size={24} className="text-[var(--chrome-white)] lg:w-8 lg:h-8" />
                ) : (
                  <Icon size={24} className={cn(
                    "lg:w-8 lg:h-8",
                    isActive ? "text-white" : "text-white/40"
                  )} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    "font-heading font-bold text-base lg:text-xl transition-colors duration-200 truncate",
                    isActive ? "text-white" : isCompleted ? "text-emerald-300" : "text-[var(--muted-lead)]"
                  )}
                >
                  {title}
                </h3>
                {subtitle && (isCompleted || isActive) && (
                  <p className={cn(
                    "text-xs lg:text-sm mt-0.5 lg:mt-1 flex items-center gap-1 truncate",
                    isCompleted && !isActive ? "text-emerald-400/80" : "text-purple-300/80"
                  )}>
                    {isCompleted && !isActive && <CheckCircle2 size={12} className="lg:w-4 lg:h-4" />}
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown 
              size={20} 
              className={cn(
                "lg:w-6 lg:h-6 transition-all duration-300 flex-shrink-0 ml-2",
                isActive ? "rotate-180 text-purple-300" : "text-[var(--muted-lead)]"
              )} 
            />
          </div>
        </button>

        {/* Step Content - Desktop'ta daha geniş padding */}
        <AnimatePresence mode="wait">
          {isActive && (
            <motion.div
              ref={contentRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1]
              }}
              className="overflow-hidden relative z-20"
              style={{
                transform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden'
              }}
            >
              <div className="px-4 lg:px-6 pb-4 lg:pb-6 space-y-3 lg:space-y-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
