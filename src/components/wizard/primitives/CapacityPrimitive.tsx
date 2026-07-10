/**
 * Capacity Step Primitive
 * Kişi sayısı seçimi için yeniden kullanılabilir component
 */

import { useState } from 'react';
import { Users, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CapacityStep } from '@/types/wizard';
import { cn } from '@/lib/utils';

interface GuestCapacity {
  adults: number;
  children: number;
  infants: number;
}

interface CapacityPrimitiveProps {
  stepConfig: CapacityStep;
  capacity: GuestCapacity | number;
  onCapacityChange: (capacity: GuestCapacity | number) => void;
  onNext: () => void;
}

export function CapacityPrimitive({
  stepConfig,
  capacity,
  onCapacityChange,
  onNext,
}: CapacityPrimitiveProps) {
  const { config } = stepConfig;
  const [error, setError] = useState<string | null>(null);

  const isDetailedCapacity = typeof capacity === 'object';
  const totalGuests = isDetailedCapacity
    ? capacity.adults + capacity.children + capacity.infants
    : capacity;

  const handleSimpleChange = (delta: number) => {
    if (typeof capacity === 'number') {
      const newValue = Math.max(
        config.minGuests,
        Math.min(config.maxGuests, capacity + delta)
      );
      onCapacityChange(newValue);
      setError(null);
    }
  };

  const handleDetailedChange = (type: keyof GuestCapacity, delta: number) => {
    if (typeof capacity === 'object') {
      const guestConfig = config.guestTypeConfig?.[type];
      if (!guestConfig) return;

      const newValue = Math.max(
        guestConfig.min,
        Math.min(guestConfig.max, capacity[type] + delta)
      );

      const newCapacity = { ...capacity, [type]: newValue };
      const newTotal = newCapacity.adults + newCapacity.children + newCapacity.infants;

      if (newTotal > config.maxGuests) {
        setError(`Maksimum ${config.maxGuests} kişi seçebilirsiniz`);
        return;
      }

      onCapacityChange(newCapacity);
      setError(null);
    }
  };

  const handleNext = () => {
    if (totalGuests < config.minGuests) {
      setError(`En az ${config.minGuests} kişi seçmelisiniz`);
      return;
    }
    if (totalGuests > config.maxGuests) {
      setError(`En fazla ${config.maxGuests} kişi seçebilirsiniz`);
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          {stepConfig.title}
        </h2>
        {stepConfig.description && (
          <p className="mt-2 text-[var(--muted-lead)]">{stepConfig.description}</p>
        )}
      </div>

      {/* Capacity Selector */}
      <div className="max-w-md mx-auto space-y-4">
        {config.showGuestTypes && typeof capacity === 'object' ? (
          <>
            {/* Yetişkin */}
            {config.guestTypeConfig?.adults && (
              <div className="flex items-center justify-between p-4 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
                <div>
                  <h4 className="font-semibold text-[var(--foreground)]">Yetişkin</h4>
                  <p className="text-sm text-[var(--muted-lead)]">13 yaş ve üzeri</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDetailedChange('adults', -1)}
                    disabled={capacity.adults <= config.guestTypeConfig.adults.min}
                    className="w-10 h-10 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-5 h-5 mx-auto text-[var(--foreground)]" />
                  </button>
                  <span className="text-xl font-bold text-[var(--foreground)] w-12 text-center">
                    {capacity.adults}
                  </span>
                  <button
                    onClick={() => handleDetailedChange('adults', 1)}
                    disabled={capacity.adults >= config.guestTypeConfig.adults.max}
                    className="w-10 h-10 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5 mx-auto text-[var(--foreground)]" />
                  </button>
                </div>
              </div>
            )}

            {/* Çocuk */}
            {config.guestTypeConfig?.children && (
              <div className="flex items-center justify-between p-4 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
                <div>
                  <h4 className="font-semibold text-[var(--foreground)]">Çocuk</h4>
                  <p className="text-sm text-[var(--muted-lead)]">
                    {config.guestTypeConfig.children.ageRange || '2-12 yaş'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDetailedChange('children', -1)}
                    disabled={capacity.children <= config.guestTypeConfig.children.min}
                    className="w-10 h-10 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-5 h-5 mx-auto text-[var(--foreground)]" />
                  </button>
                  <span className="text-xl font-bold text-[var(--foreground)] w-12 text-center">
                    {capacity.children}
                  </span>
                  <button
                    onClick={() => handleDetailedChange('children', 1)}
                    disabled={capacity.children >= config.guestTypeConfig.children.max}
                    className="w-10 h-10 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5 mx-auto text-[var(--foreground)]" />
                  </button>
                </div>
              </div>
            )}

            {/* Bebek */}
            {config.guestTypeConfig?.infants && (
              <div className="flex items-center justify-between p-4 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
                <div>
                  <h4 className="font-semibold text-[var(--foreground)]">Bebek</h4>
                  <p className="text-sm text-[var(--muted-lead)]">
                    {config.guestTypeConfig.infants.ageRange || '0-2 yaş'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDetailedChange('infants', -1)}
                    disabled={capacity.infants <= config.guestTypeConfig.infants.min}
                    className="w-10 h-10 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-5 h-5 mx-auto text-[var(--foreground)]" />
                  </button>
                  <span className="text-xl font-bold text-[var(--foreground)] w-12 text-center">
                    {capacity.infants}
                  </span>
                  <button
                    onClick={() => handleDetailedChange('infants', 1)}
                    disabled={capacity.infants >= config.guestTypeConfig.infants.max}
                    className="w-10 h-10 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5 mx-auto text-[var(--foreground)]" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Simple Counter */
          <div className="flex items-center justify-center gap-6 p-6 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
            <button
              onClick={() => handleSimpleChange(-1)}
              disabled={typeof capacity === 'number' && capacity <= config.minGuests}
              className="w-12 h-12 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-6 h-6 mx-auto text-[var(--foreground)]" />
            </button>
            
            <div className="text-center min-w-[100px]">
              <div className="text-4xl font-bold text-[var(--primary)]">
                {typeof capacity === 'number' ? capacity : totalGuests}
              </div>
              <div className="text-sm text-[var(--muted-lead)] mt-1">Kişi</div>
            </div>

            <button
              onClick={() => handleSimpleChange(1)}
              disabled={typeof capacity === 'number' && capacity >= config.maxGuests}
              className="w-12 h-12 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-6 h-6 mx-auto text-[var(--foreground)]" />
            </button>
          </div>
        )}

        {/* Info */}
        <div className="text-center text-sm text-[var(--muted-lead)]">
          Min: {config.minGuests} kişi • Max: {config.maxGuests} kişi
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={totalGuests < config.minGuests || totalGuests > config.maxGuests}
        className="w-full py-3 px-6 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        Devam Et ({totalGuests} Kişi)
      </button>
    </div>
  );
}
