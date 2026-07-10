/**
 * ServiceSelection Step Primitive
 * Hizmet seçimi için yeniden kullanılabilir component
 */

import { useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Service } from '@/types';
import type { ServiceSelectionStep } from '@/types/wizard';
import { cn } from '@/lib/utils';

interface ServiceSelectionPrimitiveProps {
  stepConfig: ServiceSelectionStep;
  services: Service[];
  selectedServiceIds: string[];
  onSelectionChange: (serviceIds: string[]) => void;
  onNext: () => void;
}

export function ServiceSelectionPrimitive({
  stepConfig,
  services,
  selectedServiceIds,
  onSelectionChange,
  onNext,
}: ServiceSelectionPrimitiveProps) {
  const { config } = stepConfig;
  const [error, setError] = useState<string | null>(null);

  // Kategori filtresi
  const filteredServices = services.filter(service => {
    if (!config.categoryFilter || config.categoryFilter.length === 0) {
      return service.isActive;
    }
    return service.isActive && config.categoryFilter.includes(service.category);
  });

  // Kategori gruplandırma
  const servicesByCategory = config.groupByCategory
    ? filteredServices.reduce((acc, service) => {
        const cat = service.category || 'Diğer';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(service);
        return acc;
      }, {} as Record<string, Service[]>)
    : { 'Tüm Hizmetler': filteredServices };

  const handleServiceToggle = (serviceId: string) => {
    if (config.allowMultiple) {
      // Çoklu seçim
      const newSelection = selectedServiceIds.includes(serviceId)
        ? selectedServiceIds.filter(id => id !== serviceId)
        : [...selectedServiceIds, serviceId];
      onSelectionChange(newSelection);
      setError(null);
    } else {
      // Tekli seçim
      onSelectionChange([serviceId]);
      setError(null);
    }
  };

  const handleNext = () => {
    if (!stepConfig.isOptional && selectedServiceIds.length === 0) {
      setError('Lütfen en az bir hizmet seçin');
      return;
    }
    onNext();
  };

  const totalPrice = filteredServices
    .filter(s => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const totalDuration = filteredServices
    .filter(s => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.duration, 0);

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

      {/* Service Categories */}
      <div className="space-y-6">
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category}>
            {config.groupByCategory && (
              <h3 className="text-lg font-semibold mb-3 text-[var(--foreground)]">
                {category}
              </h3>
            )}
            
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryServices.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                
                return (
                  <motion.button
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
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

                    <div className="pr-8">
                      <h4 className="font-semibold text-[var(--foreground)]">
                        {service.name}
                      </h4>
                      
                      {service.description && (
                        <p className="text-sm text-[var(--muted-lead)] mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {config.showDuration && (
                          <span className="text-[var(--muted-lead)]">
                            ⏱️ {service.duration} dk
                          </span>
                        )}
                        {config.showPricing && (
                          <span className="font-semibold text-[var(--primary)]">
                            ₺{service.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {selectedServiceIds.length > 0 && (config.showPricing || config.showDuration) && (
        <div className="p-4 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-lead)]">
                {selectedServiceIds.length} hizmet seçildi
              </p>
              {config.showDuration && totalDuration > 0 && (
                <p className="text-sm text-[var(--muted-lead)] mt-1">
                  Toplam süre: {totalDuration} dakika
                </p>
              )}
            </div>
            {config.showPricing && (
              <div className="text-right">
                <p className="text-sm text-[var(--muted-lead)]">Toplam</p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  ₺{totalPrice}
                </p>
              </div>
            )}
          </div>
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
        disabled={!stepConfig.isOptional && selectedServiceIds.length === 0}
        className="w-full py-3 px-6 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        Devam Et
      </button>
    </div>
  );
}
