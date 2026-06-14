import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FloatingSupport } from '@/components/support/FloatingSupport';
import { AnnouncementPopup } from '@/components/announcement/AnnouncementPopup';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { appointmentsService } from '@/services/firebaseService';
import { ChromaticButton } from '@/components/ui/ChromaticButton';

export function Dashboard() {
  const { isAuthenticated, isOwner, isLoading: authLoading } = useAuthStore();
  const { appointments } = useAppointmentsStore();
  const [loading, setLoading] = useState(false);

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-[var(--muted-lead)]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Redirect owners to their dashboard
  if (isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'upcoming' || a.status === 'pending'
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled'
  );

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Bu randevuyu iptal etmek istediginizden emin misiniz?')) return;
    
    setLoading(true);
    try {
      await appointmentsService.cancel(appointmentId, 'Müşteri tarafından iptal edildi', 'customer');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-2">
          Randevularim
        </h1>
        <p className="font-body text-[var(--muted-lead)]">
          Tum randevularinizi buradan gorebilir ve yonetebilirsiniz
        </p>
      </div>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
          Yaklaşan Randevular
        </h2>

        {upcomingAppointments.length === 0 ? (
          <div className="obsidian-card p-8 text-center">
            <CalendarIcon size={48} className="mx-auto mb-4 text-[var(--muted-lead)]" />
            <p className="font-body text-[var(--muted-lead)] mb-4">
              Henuz yaklaşan randevunuz yok
            </p>
            <ChromaticButton onClick={() => window.location.href = '/'}>
              Randevu Al
            </ChromaticButton>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment, i) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="obsidian-card p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--slate-elevated)] flex-shrink-0">
                    <img
                      src={appointment.salonCover}
                      loading="lazy"
                      alt={appointment.salonName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-heading font-semibold text-[var(--chrome-white)] mb-1">
                          {appointment.salonName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-[var(--muted-lead)]">
                          <MapPin size={14} />
                          <span className="font-body truncate">{appointment.salonAddress}</span>
                        </div>
                      </div>
                      <StatusBadge status={appointment.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon size={16} className="text-[var(--muted-lead)]" />
                        <span className="font-mono text-[var(--silver-frost)]">
                          {appointment.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-[var(--muted-lead)]" />
                        <span className="font-mono text-[var(--silver-frost)]">
                          {appointment.time} ({appointment.totalDuration} dk)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-[var(--muted-lead)]" />
                        <span className="font-body text-[var(--silver-frost)]">
                          {appointment.staffName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-[var(--muted-lead)]" />
                        <span className="font-mono text-[var(--silver-frost)]">
                          {appointment.whatsappNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {appointment.services.map((service) => (
                        <span
                          key={service.id}
                          className="px-3 py-1 rounded-full bg-white/5 font-body text-xs text-[var(--silver-frost)]"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--obsidian-rim)]">
                      <span className="font-mono font-semibold text-lg text-[var(--chrome-white)]">
                        {appointment.totalPrice} TL
                      </span>
                      {appointment.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(appointment.id)}
                          disabled={loading}
                          className="px-4 py-2 rounded-3xl text-sm font-heading font-medium text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                        >
                          Iptal Et
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
            Gecmis Randevular
          </h2>

          <div className="space-y-3">
            {pastAppointments.slice(0, 5).map((appointment) => (
              <div
                key={appointment.id}
                className="obsidian-card p-4 opacity-60 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-heading font-semibold text-[var(--chrome-white)]">
                        {appointment.salonName}
                      </span>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--muted-lead)]">
                      <span className="font-mono">{appointment.date}</span>
                      <span className="font-body">{appointment.staffName}</span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-[var(--silver-frost)]">
                    {appointment.totalPrice} TL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Support & Feedback */}
      <FloatingSupport userType="customer" />
      
      {/* Announcement Popup */}
      <AnnouncementPopup userType="customer" />
    </div>
  );
}

