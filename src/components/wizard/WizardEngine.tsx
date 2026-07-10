/**
 * Dynamic Wizard Engine
 * Config-driven, business-type agnostic wizard interpreter
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft } from 'lucide-react';
import type { VerticalConfig, WizardState, StepDefinition } from '@/types/wizard';
import type { Salon, Service, Staff } from '@/types';
import { cn } from '@/lib/utils';

// Step Primitives
import { ServiceSelectionPrimitive } from './primitives/ServiceSelectionPrimitive';
import { StaffSelectionPrimitive } from './primitives/StaffSelectionPrimitive';
import { CapacityPrimitive } from './primitives/CapacityPrimitive';

interface WizardEngineProps {
  config: VerticalConfig;
  salon: Salon;
  onComplete: (data: WizardState) => Promise<void>;
  onCancel?: () => void;
}

export function WizardEngine({ config, salon, onComplete, onCancel }: WizardEngineProps) {
  const [wizardState, setWizardState] = useState<WizardState>({
    configId: config.id,
    currentStepIndex: 0,
    completedSteps: [],
    stepData: {},
    validationErrors: {},
    totalPrice: 0,
    metadata: {
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      businessId: salon.id,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = config.steps[wizardState.currentStepIndex];
  const isLastStep = wizardState.currentStepIndex === config.steps.length - 1;
  const canGoBack = wizardState.currentStepIndex > 0;

  // Progress hesaplama
  const progress = ((wizardState.currentStepIndex + 1) / config.steps.length) * 100;

  // Step data güncelleme
  const updateStepData = (stepId: string, data: any) => {
    setWizardState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        [stepId]: data,
      },
      metadata: {
        ...prev.metadata,
        lastUpdatedAt: new Date().toISOString(),
      },
    }));
  };

  // Sonraki adım
  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setWizardState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1,
        completedSteps: [...new Set([...prev.completedSteps, prev.currentStepIndex])],
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Önceki adım
  const handleBack = () => {
    if (canGoBack) {
      setWizardState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex - 1,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Tamamlama
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(wizardState);
    } catch (error) {
      console.error('Wizard completion error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step renderer
  const renderStep = () => {
    if (!currentStep) return null;

    const stepProps = {
      stepConfig: currentStep,
      onNext: handleNext,
    };

    switch (currentStep.type) {
      case 'ServiceSelection': {
        const step = currentStep as any;
        return (
          <ServiceSelectionPrimitive
            {...stepProps}
            stepConfig={step}
            services={salon.services || []}
            selectedServiceIds={wizardState.stepData[step.id] || []}
            onSelectionChange={(ids) => updateStepData(step.id, ids)}
          />
        );
      }

      case 'StaffSelection': {
        const step = currentStep as any;
        const prevStepData = wizardState.stepData[config.steps[wizardState.currentStepIndex - 1]?.id];
        return (
          <StaffSelectionPrimitive
            {...stepProps}
            stepConfig={step}
            staff={salon.staff || []}
            selectedStaffId={wizardState.stepData[step.id] || null}
            selectedServiceIds={Array.isArray(prevStepData) ? prevStepData : []}
            onSelectionChange={(id) => updateStepData(step.id, id)}
          />
        );
      }

      case 'Capacity': {
        const step = currentStep as any;
        const defaultCapacity = step.config.showGuestTypes
          ? { adults: step.config.defaultGuests, children: 0, infants: 0 }
          : step.config.defaultGuests;
          
        return (
          <CapacityPrimitive
            {...stepProps}
            stepConfig={step}
            capacity={wizardState.stepData[step.id] || defaultCapacity}
            onCapacityChange={(capacity) => updateStepData(step.id, capacity)}
          />
        );
      }

      case 'DateTimeSlot':
        return <div className="text-center py-8">DateTimeSlot primitive (TODO)</div>;

      case 'DateRange':
        return <div className="text-center py-8">DateRange primitive (TODO)</div>;

      case 'FullDayBlock':
        return <div className="text-center py-8">FullDayBlock primitive (TODO)</div>;

      case 'PackageSelection':
        return <div className="text-center py-8">PackageSelection primitive (TODO)</div>;

      case 'AddOnSelection':
        return <div className="text-center py-8">AddOnSelection primitive (TODO)</div>;

      case 'CustomForm':
        return <div className="text-center py-8">CustomForm primitive (TODO)</div>;

      case 'Contract':
        return <div className="text-center py-8">Contract primitive (TODO)</div>;

      case 'Payment':
        return <div className="text-center py-8">Payment primitive (TODO)</div>;

      case 'ReviewConfirm':
        return <div className="text-center py-8">ReviewConfirm primitive (TODO)</div>;

      default:
        return <div className="text-center py-8 text-red-500">Unknown step type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-[var(--muted-lead)] hover:text-[var(--foreground)] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Geri</span>
              </button>
            )}
            
            <div className="ml-auto text-sm text-[var(--muted-lead)]">
              Adım {wizardState.currentStepIndex + 1} / {config.steps.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-[var(--accent)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={wizardState.currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Debug Info (Development Only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm">
          <div className="font-bold mb-2">Wizard State (DEV)</div>
          <div>Config: {config.name}</div>
          <div>Step: {currentStep?.type}</div>
          <div>Data Keys: {Object.keys(wizardState.stepData).join(', ') || 'none'}</div>
        </div>
      )}
    </div>
  );
}
