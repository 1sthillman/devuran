import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface WizardStepProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function WizardStep({ title, description, icon, children }: WizardStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        {icon && (
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.08] flex items-center justify-center mb-4">
            {icon}
          </div>
        )}
        <h2 className="font-heading font-bold text-2xl text-[var(--chrome-white)]">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-[var(--muted-lead)] max-w-md mx-auto">
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}
