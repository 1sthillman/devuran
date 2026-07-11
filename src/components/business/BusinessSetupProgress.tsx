/**
 * ============================================================================
 * İŞLETME SETUP İLERLEME GÖSTERGESI
 * ============================================================================
 * 
 * Kullanıcı dostu progress bar ve step navigasyonu
 */

import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import type { BusinessSetupStep } from '@/types/businessSetup';
import { cn } from '@/lib/utils';

interface Props {
  steps: BusinessSetupStep[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepId: number) => void;
}

export function BusinessSetupProgress({ 
  steps, 
  currentStep, 
  completedSteps,
  onStepClick 
}: Props) {
  return (
    <div className="w-full">
      {/* Mobile: Compact Progress Bar */}
      <div className="lg:hidden mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">
            Adım {currentStep} / {steps.length}
          </span>
          <span className="text-sm text-white/80">
            {Math.round((completedSteps.length / steps.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(completedSteps.length / steps.length) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Desktop: Full Step Navigation */}
      <div className="hidden lg:flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id === 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "relative group transition-all",
                  isClickable && "cursor-pointer hover:scale-105"
                )}
              >
                <div
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                    isCompleted && "bg-white border-white",
                    isCurrent && "bg-[var(--primary)] border-white scale-110 shadow-lg shadow-[var(--primary)]/50",
                    !isCompleted && !isCurrent && "bg-transparent border-white/30"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-[var(--primary)]" strokeWidth={3} />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        isCurrent ? "text-white" : "text-white/50"
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Step Label - Hover Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white text-[var(--primary)] px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap text-sm font-semibold">
                    {step.title}
                  </div>
                </div>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative overflow-hidden bg-white/20">
                  <motion.div
                    className="absolute inset-0 bg-white origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ 
                      scaleX: completedSteps.includes(step.id) ? 1 : 0 
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Info */}
      <div className="text-center mb-6">
        <motion.h2
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl lg:text-3xl font-bold text-white mb-2"
        >
          {steps[currentStep - 1]?.title}
        </motion.h2>
        <motion.p
          key={`desc-${currentStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-white/80 text-sm lg:text-base"
        >
          {steps[currentStep - 1]?.description}
        </motion.p>
      </div>
    </div>
  );
}
