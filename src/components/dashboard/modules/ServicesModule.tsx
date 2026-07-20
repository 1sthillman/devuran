import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Scissors, ChefHat } from 'lucide-react';
import { ServiceForm } from '@/components/dashboard/ServiceForm';
import { getDashboardModules } from '@/utils/bookingTypeResolver';
import { getSalonTerminology } from '@/utils/businessHelpers';
import { cn } from '@/lib/utils';
import type { Salon, Service } from '@/types';

interface ServicesModuleProps {
  salon: Salon;
  services: Service[];
  onSaveService: (data: Omit<Service, 'id'>) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
}

export function ServicesModule({
  salon,
  services,
  onSaveService,
  onDeleteService
}: ServicesModuleProps) {
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const dashboardModules = useMemo(() => {
    const anySalon = salon as any;
    return getDashboardModules(anySalon.capabilities);
  }, [salon]);

  const terminology = useMemo(() => getSalonTerminology(salon), [salon]);

  return (
    <div className="space-y-4">
      {/* Table-based info */}
      {dashboardModules?.showTables && (
        <div className="obsidian-card p-4 border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <div className="flex items-start gap-3">
            <ChefHat className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-heading font-bold text-[var(--chrome-white)] mb-2">
                🍽️ {terminology.capacityUnitLabel} Rezervasyon Sistemi
              </h4>
              <p className="text-sm text-[var(--muted-lead)]">
                {terminology.capacityUnitLabel}larınız otomatik olarak rezervasyon hizmeti olarak ekleniyor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedService(null);
          setShowServiceForm(true);
        }}
        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-heading font-bold text-sm shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2.5"
      >
        <Plus size={20} strokeWidth={2.5} />
        <span>Yeni {terminology.serviceUnitLabel} Ekle</span>
      </motion.button>

      {/* Empty State */}
      {services.length === 0 ? (
        <div className="obsidian-card p-8 text-center">
          <Scissors className="w-16 h-16 mx-auto mb-4 text-purple-500/50" />
          <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-2">
            Henüz {terminology.serviceUnitLabel} Yok
          </h3>
          <p className="text-[var(--muted-lead)]">
            İlk {terminology.serviceUnitLabel.toLowerCase()}inizi ekleyerek başlayın
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                "obsidian-card p-4 hover:border-[var(--liquid-chrome)] transition-colors cursor-pointer",
                service.tableId && "border-l-4 border-l-orange-500"
              )}
              onClick={() => {
                setSelectedService(service);
                setShowServiceForm(true);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)]">
                      {service.name}
                    </h4>
                    {service.tableId && (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-bold">
                        MASA
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-[var(--muted-lead)] mb-2">
                    {service.description || service.category}
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    {salon && ['kuafor', 'berber', 'guzellik', 'tirnak', 'fotograf', 'video-produksiyon', 'drone-cekim'].includes(salon.category) && (
                      <span className="font-mono text-[var(--silver-frost)]">
                        {service.duration} dk
                      </span>
                    )}
                    <span className="font-mono font-semibold text-[var(--chrome-white)]">
                      {service.price} TL
                    </span>
                  </div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    service.isActive ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      service.isActive ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Form Modal */}
      {showServiceForm && (
        <ServiceForm
          salonId={salon.id}
          category={salon.category}
          service={selectedService || undefined}
          onSave={async (data) => {
            await onSaveService(data);
            setShowServiceForm(false);
            setSelectedService(null);
          }}
          onDelete={selectedService ? async () => {
            await onDeleteService(selectedService.id);
            setShowServiceForm(false);
            setSelectedService(null);
          } : undefined}
          onClose={() => {
            setShowServiceForm(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
}
