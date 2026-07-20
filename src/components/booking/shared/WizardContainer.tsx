import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface WizardContainerProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

export function WizardContainer({ children, currentStep, totalSteps }: WizardContainerProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[var(--void)] pb-20">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-[var(--void)]/95 backdrop-blur-sm border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--muted-lead)]">
              Adım {currentStep + 1} / {totalSteps}
            </span>
            <span className="text-xs font-medium text-[var(--chrome-white)]">
              %{Math.round(progress)}
            </span>
          </div>
          <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
