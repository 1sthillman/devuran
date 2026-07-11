/**
 * SORU BİLEŞENİ - Tüm input tiplerini destekler
 */

import { useState } from 'react';
import type { BusinessSetupQuestion as QuestionType } from '@/types/businessSetup';
import { Check } from 'lucide-react';

interface Props {
  question: QuestionType;
  value: any;
  onChange: (value: any) => void;
}

export function BusinessSetupQuestion({ question, value, onChange }: Props) {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Boolean tipi
  if (question.type === 'boolean') {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-[var(--text)]">
          {question.text}
          {question.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {question.description && (
          <p className="text-sm text-[var(--muted-lead)]">{question.description}</p>
        )}
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleChange(true)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              value === true
                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {value === true && <Check className="w-5 h-5 text-[var(--primary)]" />}
              <span className="font-semibold">Evet</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleChange(false)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              value === false
                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {value === false && <Check className="w-5 h-5 text-[var(--primary)]" />}
              <span className="font-semibold">Hayır</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Select tipi
  if (question.type === 'select') {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-[var(--text)]">
          {question.text}
          {question.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {question.description && (
          <p className="text-sm text-[var(--muted-lead)]">{question.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.options?.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange(option.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                value === option.value
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                    value === option.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]'
                      : 'border-[var(--border-subtle)]'
                  }`}
                >
                  {value === option.value && (
                    <Check className="w-3 h-3 text-white m-0.5" strokeWidth={3} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text)]">{option.label}</p>
                  {option.description && (
                    <p className="text-sm text-[var(--muted-lead)] mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Multi-select tipi
  if (question.type === 'multi-select') {
    const selectedValues = Array.isArray(value) ? value : [];

    const toggleOption = (optionValue: string) => {
      if (selectedValues.includes(optionValue)) {
        handleChange(selectedValues.filter(v => v !== optionValue));
      } else {
        handleChange([...selectedValues, optionValue]);
      }
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-[var(--text)]">
          {question.text}
          {question.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {question.description && (
          <p className="text-sm text-[var(--muted-lead)]">{question.description}</p>
        )}

        <div className="grid grid-cols-1 gap-3">
          {question.options?.map(option => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]'
                        : 'border-[var(--border-subtle)]'
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-white m-0.5" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--text)]">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-[var(--muted-lead)] mt-1">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Text / Number tipi
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-[var(--text)]">
        {question.text}
        {question.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm text-[var(--muted-lead)]">{question.description}</p>
      )}

      <input
        type={question.type === 'number' ? 'number' : 'text'}
        value={localValue}
        onChange={(e) => {
          const newValue = question.type === 'number' ? Number(e.target.value) : e.target.value;
          handleChange(newValue);
        }}
        className="w-full px-4 py-3 border-2 border-[var(--border-subtle)] rounded-xl focus:border-[var(--primary)] focus:outline-none transition-all"
        placeholder={question.description || `${question.text} girin`}
        minLength={question.validation?.min}
        maxLength={question.validation?.max}
        min={question.type === 'number' ? question.validation?.min : undefined}
        max={question.type === 'number' ? question.validation?.max : undefined}
      />

      {question.validation && (
        <p className="text-xs text-[var(--muted-lead)]">
          {question.validation.min && question.validation.max
            ? `${question.validation.min} - ${question.validation.max} karakter`
            : question.validation.min
            ? `En az ${question.validation.min} karakter`
            : question.validation.max
            ? `En fazla ${question.validation.max} karakter`
            : ''}
        </p>
      )}
    </div>
  );
}
