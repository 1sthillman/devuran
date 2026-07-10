/**
 * StaffSelection Step Primitive
 * Personel seçimi için yeniden kullanılabilir component
 */

import { useState } from 'react';
import { Check, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Staff } from '@/types';
import type { StaffSelectionStep } from '@/types/wizard';
import { cn } from '@/lib/utils';
import { getStaffAvatarUrl } from '@/utils/avatarHelpers';

interface StaffSelectionPrimitiveProps {
  stepConfig: StaffSelectionStep;
  staff: Staff[];
  selectedStaffId: string | null;
  selectedServiceIds?: string[]; // Hizmet filtrelemesi için
  onSelectionChange: (staffId: string | null) => void;
  onNext: () => void;
}

export function StaffSelectionPrimitive({
  stepConfig,
  staff,
  selectedStaffId,
  selectedServiceIds = [],
  onSelectionChange,
  onNext,
}: StaffSelectionPrimitiveProps) {
  const { config } = stepConfig;
  const [error, setError] = useState<string | null>(null);

  // Hizmete göre personel filtrele
  const filteredStaff = staff.filter(member => {
    if (!member.isActive) return false;
    
    if (config.filterByService && selectedServiceIds.length > 0) {
      // Seçilen hizmetlerden en az birini yapabilen personel
      return selectedServiceIds.some(serviceId => 
        member.specialties?.includes(serviceId) || true // TODO: Service matching logic
      );
    }
    
    return true;
  });

  const handleStaffSelect = (staffId: string | null) => {
    onSelectionChange(staffId);
    setError(null);
  };

  const handleNext = () => {
    if (config.isRequired && !selectedStaffId) {
      setError('Lütfen bir uzman seçin');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          {stepConfig.title}
        </h2>
        {stepConfig.description && (
          <p className="mt-2 text-[var(--muted-lead)]">{stepConfig.description}</p>
        )}
      </div>

      {/* "Farketmez" Option */}
      {config.allowAnyStaff && (
        <motion.button
          onClick={() => handleStaffSelect(null)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full p-4 rounded-xl border-2 text-left transition-all',
            selectedStaffId === null
              ? 'border-[var(--primary)] bg-[var(--primary)]/5'
              : 'border-[var(--border)] hover:border-[var(--primary)]/50'
          )}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--foreground)]">
                İlk Müsait Uzman
              </h4>
              <p className="text-sm text-[var(--muted-lead)] mt-1">
                Size en yakın saatte müsait olan uzmanımız ile randevunuz oluşturulacak
              </p>
            </div>

            {selectedStaffId === null && (
              <div className="w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </motion.button>
      )}

      {/* Staff Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredStaff.map((member) => {
          const isSelected = selectedStaffId === member.id;
          
          return (
            <motion.button
              key={member.id}
              onClick={() => handleStaffSelect(member.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/50'
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-center gap-3 pr-8">
                <img
                  src={getStaffAvatarUrl(member.photo, member.name)}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                
                <div>
                  <h4 className="font-semibold text-[var(--foreground)]">
                    {member.name}
                  </h4>
                  <p className="text-sm text-[var(--muted-lead)]">
                    {member.title}
                  </p>
                  
                  {member.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {member.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-[var(--muted-lead)]">
                        ({member.reviewCount})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {member.priceRange && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--muted-lead)]">
                    Fiyat aralığı: ₺{member.priceRange.min} - ₺{member.priceRange.max}
                  </p>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-[var(--muted-lead)] mx-auto mb-3" />
          <p className="text-[var(--muted-lead)]">
            {config.filterByService 
              ? 'Seçtiğiniz hizmet için müsait uzman bulunamadı'
              : 'Henüz eklenmiş personel bulunmuyor'
            }
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={config.isRequired && !selectedStaffId}
        className="w-full py-3 px-6 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        Devam Et
      </button>
    </div>
  );
}
