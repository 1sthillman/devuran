import { useState } from 'react';
import { Plus, X, DollarSign, Users, Moon, Sparkles } from 'lucide-react';
import type { Service, ServiceAddOn } from '@/types';
import { COMMON_ADDONS } from '@/utils/pricingHelpers';

interface AdvancedPricingSectionProps {
  service: Partial<Service>;
  onChange: (updates: Partial<Service>) => void;
  categoryType: 'accommodation' | 'event' | 'catering' | 'other';
}

export function AdvancedPricingSection({ service, onChange, categoryType }: AdvancedPricingSectionProps) {
  const [showAddOnForm, setShowAddOnForm] = useState(false);
  const [newAddOn, setNewAddOn] = useState<Partial<ServiceAddOn>>({
    name: '',
    price: 0,
    priceType: 'fixed',
    isActive: true,
  });

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

  const addNewAddOn = () => {
    if (!newAddOn.name || !newAddOn.price) return;
    
    const addon: ServiceAddOn = {
      id: Date.now().toString(),
      name: newAddOn.name,
      description: newAddOn.description,
      price: newAddOn.price,
      priceType: newAddOn.priceType || 'fixed',
      icon: newAddOn.icon,
      isActive: true,
    };

    onChange({
      addOns: [...addOns, addon],
    });

    setNewAddOn({ name: '', price: 0, priceType: 'fixed', isActive: true });
    setShowAddOnForm(false);
  };

  const removeAddOn = (id: string) => {
    onChange({
      addOns: addOns.filter(a => a.id !== id),
    });
  };

  const toggleAddOn = (id: string) => {
    onChange({
      addOns: addOns.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a),
    });
  };

  const addTemplateAddOns = () => {
    const templates = COMMON_ADDONS[categoryType] || [];
    onChange({
      addOns: [...addOns, ...templates.map(t => ({ ...t, id: Date.now().toString() + Math.random() }))],
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
          <div className="flex gap-2">
            {COMMON_ADDONS[categoryType] && addOns.length === 0 && (
              <button
                type="button"
                onClick={addTemplateAddOns}
                className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-heading font-medium hover:bg-purple-500/20 transition-all"
              >
                Şablonları Ekle
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddOnForm(!showAddOnForm)}
              className="px-3 py-1.5 rounded-full bg-[var(--liquid-chrome)]/10 border border-[var(--liquid-chrome)]/30 text-[var(--liquid-chrome)] text-xs font-heading font-medium hover:bg-[var(--liquid-chrome)]/20 transition-all flex items-center gap-1"
            >
              <Plus size={14} />
              Yeni Ekle
            </button>
          </div>
        </div>

        {/* Ek Hizmet Ekleme Formu */}
        {showAddOnForm && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newAddOn.name || ''}
                onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                placeholder="Hizmet adı (örn: Kahvaltı)"
                className="h-10 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] text-sm outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
              <input
                type="number"
                value={newAddOn.price || 0}
                onChange={(e) => setNewAddOn({ ...newAddOn, price: parseFloat(e.target.value) || 0 })}
                placeholder="Fiyat"
                className="h-10 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] text-sm font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={newAddOn.priceType || 'fixed'}
                onChange={(e) => setNewAddOn({ ...newAddOn, priceType: e.target.value as any })}
                className="flex-1 h-10 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] text-sm outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              >
                <option value="fixed">Sabit Fiyat</option>
                <option value="per-person">Kişi Başı</option>
                <option value="per-night">Gece Başı</option>
              </select>
              <button
                type="button"
                onClick={addNewAddOn}
                className="px-6 h-10 rounded-full bg-[var(--liquid-chrome)] text-white text-sm font-heading font-semibold hover:shadow-lg transition-all"
              >
                Ekle
              </button>
            </div>
          </div>
        )}

        {/* Ek Hizmetler Listesi */}
        <div className="space-y-2">
          {addOns.map((addon) => (
            <div
              key={addon.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] transition-all"
            >
              <button
                type="button"
                onClick={() => toggleAddOn(addon.id)}
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  addon.isActive ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    addon.isActive ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-[var(--chrome-white)] truncate">
                  {addon.name}
                </p>
                <p className="text-xs text-[var(--muted-lead)]">
                  {addon.price}₺ {addon.priceType === 'per-person' ? '/ kişi' : addon.priceType === 'per-night' ? '/ gece' : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeAddOn(addon.id)}
                className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-red-400" />
              </button>
            </div>
          ))}

          {addOns.length === 0 && !showAddOnForm && (
            <p className="text-center text-sm text-[var(--muted-lead)] py-4">
              Henüz ek hizmet eklenmemiş
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
