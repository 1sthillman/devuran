import { useState } from 'react';
import { DollarSign, Sparkles } from 'lucide-react';
import type { Service } from '@/types';
import { AddOnManager } from './AddOnManager';

interface AdvancedPricingSectionProps {
  service: Partial<Service>;
  onChange: (updates: Partial<Service>) => void;
  categoryType: 'accommodation' | 'event' | 'catering' | 'other';
}

export function AdvancedPricingSection({ service, onChange, categoryType }: AdvancedPricingSectionProps) {
  const pricingRules = service.pricingRules || {
    basePrice: service.price || 0,
    perPerson: 0,
    perNight: 0,
    minGuests: 1,
    maxGuests: 10,
  };

  const addOns = service.addOns || [];

  const updatePricingRules = (updates: Partial<typeof pricingRules>) => {
    onChange({
      pricingRules: { ...pricingRules, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Dinamik Fiyatlandırma */}
      <div>
        <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-purple-400" />
          Dinamik Fiyatlandırma
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
              Temel Fiyat (₺) *
            </label>
            <input
              type="number"
              value={pricingRules.basePrice}
              onChange={(e) => updatePricingRules({ basePrice: parseFloat(e.target.value) || 0 })}
              className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
            />
          </div>

          <div>
            <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
              Kişi Başı Ek Ücret (₺)
            </label>
            <input
              type="number"
              value={pricingRules.perPerson || 0}
              onChange={(e) => updatePricingRules({ perPerson: parseFloat(e.target.value) || 0 })}
              placeholder="Örn: 50"
              className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
            />
            <p className="text-xs text-[var(--muted-lead)] mt-1">2. kişiden itibaren uygulanır</p>
          </div>

          {categoryType === 'accommodation' && (
            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Gece Başı Ek Ücret (₺)
              </label>
              <input
                type="number"
                value={pricingRules.perNight || 0}
                onChange={(e) => updatePricingRules({ perNight: parseFloat(e.target.value) || 0 })}
                placeholder="Örn: 100"
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
              <p className="text-xs text-[var(--muted-lead)] mt-1">2. geceden itibaren uygulanır</p>
            </div>
          )}

          <div>
            <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
              Min - Max Kişi Sayısı
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={pricingRules.minGuests || 1}
                onChange={(e) => updatePricingRules({ minGuests: parseInt(e.target.value) || 1 })}
                min="1"
                className="flex-1 h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
              <input
                type="number"
                value={pricingRules.maxGuests || 10}
                onChange={(e) => updatePricingRules({ maxGuests: parseInt(e.target.value) || 10 })}
                min="1"
                className="flex-1 h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ek Hizmetler */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] flex items-center gap-2">
            <Sparkles size={18} className="text-pink-400" />
            Ek Hizmetler
          </h4>
        </div>

        <AddOnManager
          addOns={addOns}
          onChange={(newAddOns) => onChange({ addOns: newAddOns })}
        />

        <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-300/80 leading-relaxed">
            💡 <strong>İpucu:</strong> Ek hizmetler müşterilerinize konaklama rezervasyonu sırasında sunulur. 
            Her ek hizmet için fiyatlandırma mantığını belirleyebilir, minimum/maksimum miktarları ayarlayabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
