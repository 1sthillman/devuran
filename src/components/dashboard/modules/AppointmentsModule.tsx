import { Users } from 'lucide-react';
import { ReservationManager } from '@/components/dashboard/ReservationManager';
import { ModernQueueManager } from '@/components/dashboard/ModernQueueManager';
import type { Salon } from '@/types';

interface AppointmentsModuleProps {
  salon: Salon;
  reservations: any[];
  onRefresh: () => Promise<void>;
}

export function AppointmentsModule({
  salon,
  reservations,
  onRefresh
}: AppointmentsModuleProps) {
  return (
    <div className="space-y-6">
      {/* Reservation Manager */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
        <div className="relative">
          <ReservationManager
            reservations={reservations}
            onRefresh={onRefresh}
          />
        </div>
      </div>

      {/* Queue Manager */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Users size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[var(--chrome-white)]">
                Sıra Yönetimi
              </h2>
              <p className="text-sm text-[var(--muted-lead)]">
                Bekleyen müşterileri randevuya atayın
              </p>
            </div>
          </div>
          <ModernQueueManager
            salonId={salon.id}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
}
