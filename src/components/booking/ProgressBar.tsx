import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  steps: string[];
}

export function ProgressBar({ currentStep, steps }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = currentStep > stepNum;
        const isActive = currentStep === stepNum;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                  isCompleted
                    ? 'bg-[var(--success)]'
                    : isActive
                    ? 'bg-[var(--chrome-white)]'
                    : 'bg-transparent border border-[var(--obsidian-rim)]'
                )}
              >
                {isCompleted ? (
                  <Check size={16} className="text-white" />
                ) : (
                  <span
                    className={cn(
                      'font-mono text-sm font-medium',
                      isActive ? 'text-[var(--void)]' : 'text-[var(--muted-lead)]'
                    )}
                  >
                    {stepNum}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  'mt-2 font-heading text-xs',
                  isActive ? 'font-medium text-[var(--chrome-white)]' : 'text-[var(--muted-lead)]'
                )}
              >
                {step}
              </span>
            </div>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 -mt-5 rounded-full transition-all duration-300',
                  isCompleted ? 'bg-[var(--success)]' : 'bg-[var(--obsidian-rim)]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
