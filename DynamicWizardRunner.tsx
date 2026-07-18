/**
 * DynamicWizardRunner.tsx
 * -------------------------
 * Herhangi bir WizardSchema'yı adım adım çalıştıran GENEL bileşen.
 * BusinessSetupWizard'ın görsel dilini birebir izler (rounded-3xl, mor-pembe
 * gradyan, sticky footer, chrome-white tipografi) böylece iki farklı
 * "wizard hissi" oluşmaz — kullanıcı için tutarlı.
 *
 * Kullanım 1 — Setup sihirbazına eklenen özel adımlar:
 *   <DynamicWizardRunner schema={extraSetupSchema} onComplete={(answers) => ...} />
 *
 * Kullanım 2 — Müşteriye gösterilen rezervasyon formu:
 *   <DynamicWizardRunner schema={bookingSchema} onComplete={(answers) => submitReservation(answers)} />
 *
 * Mobilde tam ekran, masaüstünde ortalanmış kart olarak render olur (aynı
 * BusinessSetupWizard'daki `fixed inset-0` + `max-w-7xl mx-auto` yaklaşımı).
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type WizardSchema,
  type WizardField,
  type WizardStep,
  isFieldVisible,
  validateStepAnswers,
} from '@/types/wizardSchema';

type AnswerMap = Record<string, string | number | boolean | string[]>;

interface DynamicWizardRunnerProps {
  schema: WizardSchema;
  /** Sadece önizleme amaçlı çalıştırılıyorsa true — kaydetmeye çalışmaz, "Önizleme" rozeti gösterir */
  previewMode?: boolean;
  initialAnswers?: AnswerMap;
  onComplete: (answers: AnswerMap) => Promise<void> | void;
  onClose: () => void;
}

export function DynamicWizardRunner({
  schema,
  previewMode = false,
  initialAnswers,
  onComplete,
  onClose,
}: DynamicWizardRunnerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers || {});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = schema.steps.length > 0 ? schema.steps : [];
  const currentStep: WizardStep | undefined = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const visibleFields = useMemo(
    () => (currentStep ? currentStep.fields.filter((f) => isFieldVisible(f, answers)) : []),
    [currentStep, answers]
  );

  const setAnswer = (fieldId: string, value: AnswerMap[string]) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setError(null);
  };

  const goNext = async () => {
    if (!currentStep) return;
    const { valid, missingLabels } = validateStepAnswers(currentStep, answers);
    if (!valid) {
      setError(`Devam etmeden önce doldurun: ${missingLabels.join(', ')}`);
      return;
    }
    if (isLastStep) {
      if (previewMode) {
        onClose();
        return;
      }
      setSubmitting(true);
      try {
        await onComplete(answers);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    setError(null);
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  if (steps.length === 0 || !currentStep) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-[var(--void)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative w-full h-screen flex flex-col max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="px-4 sm:px-8 py-3 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {previewMode && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Önizleme
                </span>
              )}
              <div>
                <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                  {currentStep.title}
                </h3>
                {currentStep.subtitle && (
                  <p className="text-xs text-[var(--muted-lead)]">{currentStep.subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-[var(--muted-lead)]" />
            </button>
          </div>

          <div className="flex items-center gap-1 mt-3">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  'flex-1 h-1 rounded-full transition-all duration-300',
                  i < stepIndex
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : i === stepIndex
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                    : 'bg-white/10'
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {visibleFields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={answers[field.id]}
                  onChange={(v) => setAnswer(field.id, v)}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5"
              >
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky footer */}
        <div
          className="sticky bottom-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 border-t border-white/[0.08] bg-[var(--void)] flex-shrink-0"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-heading font-semibold text-sm text-white flex items-center gap-2 active:scale-95"
            >
              <ChevronLeft size={18} />
              Geri
            </button>

            <span className="text-xs text-purple-300 font-bold">
              {stepIndex + 1} / {steps.length}
            </span>

            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className={cn(
                'px-6 py-3 rounded-xl font-heading font-bold text-sm text-white flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-60',
                isLastStep
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/30'
              )}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLastStep ? (
                <>
                  <Check size={18} /> Tamamla
                </>
              ) : (
                <>
                  İleri <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldRenderer — her alan tipini kendi input'una çevirir
// ---------------------------------------------------------------------------
function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: WizardField;
  value: AnswerMap[string] | undefined;
  onChange: (v: AnswerMap[string]) => void;
}) {
  const baseInputClass =
    'w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all';

  if (field.type === 'divider') {
    return <div className="h-px bg-white/[0.08] my-2" />;
  }

  if (field.type === 'info') {
    return (
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200/90">
        {field.infoText || field.label}
      </div>
    );
  }

  const Label = (
    <label className="block mb-2">
      <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
        {field.label}
        {field.required && <span className="text-pink-400 ml-1">*</span>}
      </span>
      {field.helpText && (
        <span className="text-xs text-[var(--muted-lead)] block mt-1">{field.helpText}</span>
      )}
    </label>
  );

  switch (field.type) {
    case 'text':
    case 'email':
      return (
        <div>
          {Label}
          <input
            type={field.type === 'email' ? 'email' : 'text'}
            value={(value as string) || ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        </div>
      );

    case 'phone':
      return (
        <div>
          {Label}
          <input
            type="tel"
            inputMode="numeric"
            value={(value as string) || ''}
            placeholder={field.placeholder || '5xx xxx xx xx'}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            className={baseInputClass}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          {Label}
          <input
            type="number"
            min={field.min}
            max={field.max}
            value={(value as number) ?? ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={cn(baseInputClass, 'text-center font-heading font-semibold')}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          {Label}
          <textarea
            rows={field.rows || 3}
            value={(value as string) || ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cn(baseInputClass, 'h-auto py-3 rounded-2xl resize-none')}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {Label}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(field.options || []).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={cn(
                  'px-3 py-3 rounded-2xl border text-sm font-heading font-semibold transition-all text-left',
                  value === opt.id
                    ? 'border-purple-500/60 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-[var(--chrome-white)]'
                    : 'border-white/[0.08] bg-white/[0.02] text-[var(--muted-lead)] hover:bg-white/[0.05]'
                )}
              >
                {opt.label}
                {opt.priceHint && (
                  <span className="block text-[10px] text-purple-300 mt-0.5">{opt.priceHint}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      );

    case 'multiselect': {
      const current = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div>
          {Label}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(field.options || []).map((opt) => {
              const active = current.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onChange(active ? current.filter((v) => v !== opt.id) : [...current, opt.id])
                  }
                  className={cn(
                    'px-3 py-3 rounded-2xl border text-sm font-heading font-semibold transition-all text-left',
                    active
                      ? 'border-cyan-500/60 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-[var(--chrome-white)]'
                      : 'border-white/[0.08] bg-white/[0.02] text-[var(--muted-lead)] hover:bg-white/[0.05]'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case 'toggle':
      return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
          <div>
            <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
              {field.label}
            </span>
            {field.helpText && (
              <p className="text-xs text-[var(--muted-lead)] mt-0.5">{field.helpText}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={cn(
              'relative w-14 h-7 rounded-full transition-all flex-shrink-0',
              value ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg transition-all',
                value ? 'translate-x-7' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      );

    case 'date':
      return (
        <div>
          {Label}
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        </div>
      );

    case 'time':
      return (
        <div>
          {Label}
          <input
            type="time"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        </div>
      );

    case 'rating':
      return (
        <div>
          {Label}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => onChange(n)}>
                <Star
                  size={28}
                  className={cn(
                    'transition-colors',
                    (value as number) >= n ? 'text-amber-400 fill-amber-400' : 'text-white/15'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      );

    case 'address_short':
      return (
        <div>
          {Label}
          <input
            type="text"
            value={(value as string) || ''}
            placeholder={field.placeholder || 'Mahalle, sokak, no...'}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        </div>
      );

    case 'image':
      // Projede zaten var olan ImageUploader bileşenine bağlayın:
      // <ImageUploader value={value as string} onChange={onChange} />
      return (
        <div>
          {Label}
          <div className="h-28 rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-[var(--muted-lead)] text-xs">
            <ImageIcon size={22} />
            Görsel yükleme alanı (ImageUploader bileşenine bağlanacak)
          </div>
        </div>
      );

    default:
      return null;
  }
}
