import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, Wand2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORY_PRESETS,
  getPresetById,
  type CategoryPreset,
  type BusinessCapabilities,
} from '@/types/businessCapabilities';
import { SmartBusinessProfiler } from './SmartBusinessProfiler';

export interface CategorySelectionValue {
  categoryId: string;
  categoryLabel: string;
  capabilities: BusinessCapabilities;
}

interface CategorySelectionProps {
  value: CategorySelectionValue;
  onChange: (value: CategorySelectionValue) => void;
}

const PresetCard = memo(
  ({ preset, isSelected, onClick }: { preset: CategoryPreset; isSelected: boolean; onClick: () => void }) => {
    const Icon = preset.icon;
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative overflow-hidden p-4 rounded-3xl border-2 transition-all w-full aspect-square',
          isSelected
            ? 'border-purple-500/60 bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-pink-500/15 shadow-lg shadow-purple-500/20'
            : preset.isCustom
            ? 'border-dashed border-white/20 bg-white/[0.01] hover:border-purple-400/40 hover:bg-white/[0.04]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
        )}
      >
        <div className="relative flex flex-col items-center justify-center gap-2 h-full">
          <div
            className={cn(
              'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all',
              isSelected ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' : 'bg-white/5'
            )}
          >
            <Icon
              size={24}
              className={cn('sm:size-7', isSelected ? 'text-white' : 'text-[var(--muted-lead)]')}
              strokeWidth={isSelected ? 2.5 : 2}
            />
          </div>
          <span
            className={cn(
              'font-heading font-semibold text-xs sm:text-sm text-center leading-tight line-clamp-2',
              isSelected ? 'text-[var(--chrome-white)]' : 'text-[var(--muted-lead)]'
            )}
          >
            {preset.name}
          </span>
        </div>

        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg"
          >
            <Check size={14} strokeWidth={3} className="text-white" />
          </motion.div>
        )}
      </motion.button>
    );
  }
);

export function CategorySelection({ value, onChange }: CategorySelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  // Eğer kategori yoksa (yeni kayıt), profiler'ı başlatma - kullanıcı seçsin
  const [profilerMode, setProfilerMode] = useState<false | 'custom' | 'refine'>(false);

  const filteredPresets = CATEGORY_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPreset = getPresetById(value.categoryId);
  const isCustomSelection = !selectedPreset || value.categoryId.startsWith('custom-');

  const handlePresetClick = (preset: CategoryPreset) => {
    if (preset.isCustom) {
      setProfilerMode('custom');
      return;
    }
    onChange({
      categoryId: preset.id,
      categoryLabel: preset.name,
      capabilities: preset.capabilities,
    });
  };

  const handleProfilerComplete = (result: {
    capabilities: BusinessCapabilities;
    categoryId: string;
    categoryLabel: string;
  }) => {
    onChange(result);
    setProfilerMode(false);
  };

  // ---- AKILLI PROFİL TAKEOVER ----
  if (profilerMode) {
    return (
      <div className="h-full">
        <SmartBusinessProfiler
          mode={profilerMode}
          initialCategoryLabel={profilerMode === 'refine' ? value.categoryLabel : undefined}
          initialCapabilities={profilerMode === 'refine' ? value.capabilities : undefined}
          onComplete={handleProfilerComplete}
          onCancel={() => {
            // İptal edilirse ve hiç kategori yoksa, grid'i göster
            if (!value.categoryId) {
              setProfilerMode(false);
            } else {
              setProfilerMode(false);
            }
          }}
          allowCancel={!!value.categoryId} // Sadece zaten bir profil varsa iptal edilebilir
        />
      </div>
    );
  }

  // Eğer zaten bir profil seçilmişse, düzenleme modunu göster
  return (
    <div className="flex flex-col max-h-full">
      {/* Profil Durumu Göstergesi */}
      {isCustomSelection && value.categoryLabel ? (
        <div className="flex-shrink-0 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Wand2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                {value.categoryLabel}
              </p>
              <p className="text-xs text-[var(--muted-lead)]">Akıllı profil ile yapılandırıldı</p>
            </div>
            <button
              onClick={() => setProfilerMode('refine')}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-xs font-semibold text-purple-300 transition-colors flex-shrink-0"
            >
              <SlidersHorizontal size={13} />
              Düzenle
            </button>
          </motion.div>
        </div>
      ) : null}

      {/* Hızlı Erişim: Akıllı Soru veya Preset Grid */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProfilerMode('custom')}
            className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border-2 border-purple-500/40 text-white font-heading font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            Akıllı Profil Oluştur
          </button>
          {selectedPreset && !selectedPreset.isCustom && (
            <button
              onClick={() => setProfilerMode('refine')}
              className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-heading font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <SlidersHorizontal size={14} />
              İnce Ayar
            </button>
          )}
        </div>
      </div>

      {/* Info Badge */}
      <div className="flex-shrink-0 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-3 mx-auto">
        <p className="text-xs text-[var(--silver-frost)] text-center font-medium">
          Ya da hızlı başlangıç için hazır kategori seçin
        </p>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-lead)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kategori ara..."
          className="w-full h-10 pl-11 pr-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
        />
      </div>

      {/* Grid - Sadece preset'ler göster, "Listede Yok" kaldırıldı */}
      <div className="min-h-0 overflow-y-auto pb-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3 auto-rows-min">
          {filteredPresets
            .filter(preset => !preset.isCustom) // "Listede Yok" kartını kaldır
            .map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isSelected={!isCustomSelection && value.categoryId === preset.id}
                onClick={() => handlePresetClick(preset)}
              />
            ))}
        </div>

        {filteredPresets.filter(p => !p.isCustom).length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[var(--muted-lead)]">Kategori bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}
