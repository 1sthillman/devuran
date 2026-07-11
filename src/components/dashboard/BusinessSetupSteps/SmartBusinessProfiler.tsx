/**
 * AKILLI İŞLETME PROFİLİ S İHİRBAZI
 * 
 * Kullanıcıya birbirine bağlı sorular sorarak işletmenin tam özelliklerini
 * (capabilities) öğrenir ve sistemi ona göre yapılandırır.
 * 
 * - 'custom' modu: Sıfırdan başlar, en son kategori ismi sorar
 * - 'refine' modu: Var olan preset'ten başlar, ince ayar yapılır
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Sparkles, PartyPopper, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slugify } from '@/utils/slugify';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import { describeCapabilities } from '@/types/businessCapabilities';
import {
  QUESTION_FLOW,
  getVisibleQuestions,
  applyAnswer,
  findClosestPreset,
  createEmptyCapabilities,
  type AnswerMap,
  type QuestionDef,
} from '@/config/businessQuestionFlow';

interface HistoryFrame {
  questionId: string;
  answersBefore: AnswerMap;
  capBefore: BusinessCapabilities;
  selected: string[];
}

interface SmartBusinessProfilerProps {
  mode: 'custom' | 'refine';
  initialCategoryLabel?: string;
  initialCapabilities?: BusinessCapabilities;
  onComplete: (result: {
    capabilities: BusinessCapabilities;
    categoryId: string;
    categoryLabel: string;
  }) => void;
  onCancel: () => void;
  allowCancel?: boolean; // Yeni: İptal edilebilir mi?
}

export function SmartBusinessProfiler({
  mode,
  initialCategoryLabel,
  initialCapabilities,
  onComplete,
  onCancel,
  allowCancel = true, // Varsayılan: iptal edilebilir
}: SmartBusinessProfilerProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [cap, setCap] = useState<BusinessCapabilities>(
    initialCapabilities ?? createEmptyCapabilities()
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryFrame[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState(initialCategoryLabel ?? '');

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers, cap), [answers, cap]);
  const currentQuestion: QuestionDef | undefined = visibleQuestions[stepIndex];
  const closestPreset = useMemo(() => (showSummary ? findClosestPreset(cap) : null), [showSummary, cap]);

  const toggleOption = (optionId: string) => {
    if (!currentQuestion) return;
    
    if (currentQuestion.multiSelect) {
      // Özel durum: Q1'de "none" seçilirse diğerlerini temizle
      if (currentQuestion.id === 'q1_model' && optionId === 'none') {
        setSelected(['none']);
        return;
      }
      
      // Özel durum: Q1'de başka bir şey seçilirse "none"'ı temizle
      if (currentQuestion.id === 'q1_model' && selected.includes('none')) {
        setSelected([optionId]);
        return;
      }
      
      // Normal multi-select davranışı
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      // Single select
      setSelected([optionId]);
    }
  };

  const goNext = () => {
    if (!currentQuestion || selected.length === 0) return;

    const frame: HistoryFrame = {
      questionId: currentQuestion.id,
      answersBefore: answers,
      capBefore: cap,
      selected,
    };

    const nextAnswers = { ...answers, [currentQuestion.id]: selected };
    const nextCap = applyAnswer(cap, currentQuestion, selected);
    const nextVisible = getVisibleQuestions(nextAnswers, nextCap);

    setHistory((h) => [...h, frame]);
    setAnswers(nextAnswers);
    setCap(nextCap);
    setSelected([]); // Clear selection for next question

    // Move to next question or show summary
    if (stepIndex + 1 < nextVisible.length) {
      setStepIndex(stepIndex + 1);
    } else {
      // No more questions, show summary
      setShowSummary(true);
    }
  };

  const goBack = () => {
    if (showSummary) {
      setShowSummary(false);
      // Go back to last visible question
      const lastVisible = getVisibleQuestions(answers, cap);
      if (lastVisible.length > 0) {
        setStepIndex(lastVisible.length - 1);
        const lastQ = lastVisible[lastVisible.length - 1];
        setSelected(answers[lastQ.id] ?? []);
      }
      return;
    }
    
    const last = history[history.length - 1];
    if (!last) {
      // No history, cancel if allowed
      if (allowCancel) {
        onCancel();
      }
      return;
    }
    
    // Restore previous state
    setHistory((h) => h.slice(0, -1));
    setAnswers(last.answersBefore);
    setCap(last.capBefore);
    setSelected(last.selected);
    
    // Find the correct step index in the restored visible questions
    const restoredVisible = getVisibleQuestions(last.answersBefore, last.capBefore);
    const idx = restoredVisible.findIndex((q) => q.id === last.questionId);
    setStepIndex(Math.max(0, idx));
  };

  const handleConfirm = () => {
    const finalLabel = categoryLabel.trim() || closestPreset?.name || 'Özel İşletme';
    const categoryId = `custom-${slugify(finalLabel)}`;
    onComplete({ capabilities: cap, categoryId, categoryLabel: finalLabel });
  };

  // ---- ÖZET EKRANI ----
  if (showSummary) {
    const bullets = describeCapabilities(cap);
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="text-center py-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <PartyPopper size={28} className="text-white" />
            </motion.div>
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
              İşletme Profiliniz Hazır
            </h3>
            <p className="text-sm text-[var(--muted-lead)] mt-1">
              Cevaplarınıza göre sistemi sizin için ayarladık
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-emerald-400" strokeWidth={3} />
                </div>
                <span className="text-sm text-[var(--silver-frost)]">{b}</span>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
              <Pencil size={14} className="text-purple-400" />
              İşletme türünüzü ne isim altında göstermek istersiniz?
            </label>
            <input
              type="text"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
              placeholder={closestPreset ? closestPreset.name : 'Örn: Yat Charter, Escape Room, Drone Pisti...'}
              className="w-full h-12 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            />
            {closestPreset && (
              <p className="text-xs text-[var(--muted-lead)] mt-2 ml-1">
                Cevaplarınız en çok <span className="text-purple-300 font-semibold">{closestPreset.name}</span> profiline benziyor. Dilerseniz bunu kullanabilir ya da yukarıya kendi ismini yazabilirsiniz.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 flex-shrink-0">
          {allowCancel && (
            <button
              onClick={goBack}
              className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} strokeWidth={2.5} />
            Onayla ve Devam Et
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progressTotal = Math.max(visibleQuestions.length, stepIndex + 1);

  // ---- SORU EKRANI ----
  return (
    <div className="flex flex-col h-full">
      {/* İlerleme */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-1.5 mb-3">
          {Array.from({ length: progressTotal }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i < stepIndex ? 'bg-emerald-400' : i === stepIndex ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-white/10'
              )}
            />
          ))}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">Akıllı İşletme Profili</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-1.5">
              {currentQuestion.title}
            </h3>
            {currentQuestion.subtitle && (
              <p className="text-sm text-[var(--muted-lead)] mb-4">{currentQuestion.subtitle}</p>
            )}

            <div className="space-y-2.5 mt-4">
              {currentQuestion.options.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-3xl border-2 transition-all flex items-start gap-3',
                      isSelected
                        ? 'border-purple-500/60 bg-gradient-to-br from-purple-500/15 to-pink-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all',
                        isSelected ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent' : 'border-white/20'
                      )}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} className="text-white" />}
                    </div>
                    <div>
                      <p
                        className={cn(
                          'font-heading font-semibold text-sm',
                          isSelected ? 'text-[var(--chrome-white)]' : 'text-[var(--silver-frost)]'
                        )}
                      >
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="text-xs text-[var(--muted-lead)] mt-0.5">{option.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 pt-4 flex-shrink-0">
        {allowCancel && (
          <button
            onClick={goBack}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}
        <button
          onClick={goNext}
          disabled={selected.length === 0}
          className={cn(
            'flex-1 h-12 rounded-2xl font-heading font-bold text-sm transition-all flex items-center justify-center gap-2',
            selected.length === 0
              ? 'bg-white/5 text-[var(--muted-lead)] cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30'
          )}
        >
          Devam Et
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
