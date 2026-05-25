import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, User, Phone, Users as UsersIcon, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CancelAppointmentDialog } from '@/components/booking/CancelAppointmentDialog';
import type { Appointment, Staff } from '@/types';
import { appointmentsService, staffService } from '@/services/firebaseService';
import { soundService } from '@/services/soundService';
import { useUIStore } from '@/store/uiStore';

interface AppointmentManagerProps {
  appointments: Appointment[];
  salonId: string;
  onRefresh: () => void;
}

export function AppointmentManager({ appointments, salonId, onRefresh }: AppointmentManagerProps) {
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [cancelDialogAppointment, setCancelDialogAppointment] = useState<Appointment | null>(null);
  const [completeEarlyAppointment, setCompleteEarlyAppointment] = useState<Appointment | null>(null);
  const { addToast } = useUIStore();

  useEffect(() => {
    loadStaff();
  }, [salonId]);

  const loadStaff = async () => {
    try {
      const staffData = await staffService.getBySalon(salonId);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  // Personel bazlı filtreleme
  const filteredAppointments = selectedStaffId
    ? appointments.filter(a => a.staffId === selectedStaffId)
    : appointments;

  const pendingAppointments = filteredAppointments.filter(a => a.status === 'pending');
  const confirmedAppointments = filteredAppointments.filter(a => a.status === 'confirmed' || a.status === 'upcoming');

  const handleApprove = async (appointmentId: string) => {
    setLoading(true);
    try {
      await appointmentsService.updateStatus(appointmentId, 'confirmed');
      
      // Play appointment received sound
      soundService.playAppointmentReceived();
      
      onRefresh();
    } catch (error) {
      console.error('Error approving appointment:', error);
    }
    setLoading(false);
  };

  const handleReject = async (reason: string) => {
    if (!cancelDialogAppointment) return;
    
    setLoading(true);
    try {
      await appointmentsService.cancel(cancelDialogAppointment.id, reason, 'salon');
      
      // Play cancel sound
      soundService.playAppointmentCancelled();
      
      addToast('Randevu iptal edildi', 'success');
      setCancelDialogAppointment(null);
      onRefresh();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      addToast('Randevu iptal edilemedi', 'error');
    }
    setLoading(false);
  };

  const handleCompleteEarly = async () => {
    if (!completeEarlyAppointment) return;
    
    setLoading(true);
    try {
      const now = new Date();
      const actualEndTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      await appointmentsService.completeEarly(completeEarlyAppointment.id, actualEndTime);
      
      addToast('Randevu erken tamamlandı', 'success');
      setCompleteEarlyAppointment(null);
      onRefresh();
    } catch (error) {
      console.error('Error completing appointment early:', error);
      addToast('Randevu tamamlanamadı', 'error');
    }
    setLoading(false);
  };

  const handleComplete = async (appointmentId: string) => {
    setLoading(true);
    try {
      await appointmentsService.updateStatus(appointmentId, 'completed');
      onRefresh();
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Personel Filtreleme */}
      <div className="obsidian-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <UsersIcon size={20} className="text-[var(--liquid-chrome)]" />
          <h3 className="font-heading font-semibold text-base text-[var(--chrome-white)]">
            Personel Bazlı Görüntüle
          </h3>
        </div>
        
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setSelectedStaffId(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-heading font-medium text-sm transition-all ${
              !selectedStaffId
                ? 'bg-[var(--liquid-chrome)] text-[var(--void)]'
                : 'bg-white/5 text-[var(--silver-frost)] hover:bg-white/10'
            }`}
          >
            Tüm Personel ({appointments.length})
          </button>
          
          {staff.map((member) => {
            const memberAppointments = appointments.filter(a => a.staffId === member.id);
            return (
              <button
                key={member.id}
                onClick={() => setSelectedStaffId(member.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-heading font-medium text-sm transition-all ${
                  selectedStaffId === member.id
                    ? 'bg-[var(--liquid-chrome)] text-[var(--void)]'
                    : 'bg-white/5 text-[var(--silver-frost)] hover:bg-white/10'
                }`}
              >
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                )}
                <span>{member.name}</span>
                <span className="opacity-60">({memberAppointments.length})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending Queue */}
      {pendingAppointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)]">
              Onay Bekleyenler
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--warning)]/20 text-[var(--warning)] text-xs font-mono">
                {pendingAppointments.length}
              </span>
            </h3>
          </div>

          <div className="space-y-3">
            {pendingAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="obsidian-card p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User size={16} className="text-[var(--muted-lead)]" />
                      <span className="font-heading font-semibold text-[var(--chrome-white)]">
                        {appointment.customerName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                      <Phone size={16} className="text-[var(--muted-lead)]" />
                      <span className="font-body text-sm text-[var(--silver-frost)]">
                        {appointment.customerPhone}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <Clock size={16} className="text-[var(--muted-lead)]" />
                      <span className="font-mono text-sm text-[var(--silver-frost)]">
                        {appointment.date} - {appointment.time}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {appointment.services.map((service) => (
                        <span
                          key={service.id}
                          className="px-3 py-1 rounded-full bg-white/5 font-body text-xs text-[var(--silver-frost)]"
                        >
                          {service.name} ({service.duration} dk)
                        </span>
                      ))}
                    </div>

                    {appointment.notes && (
                      <p className="mt-3 font-body text-sm text-[var(--muted-lead)] italic">
                        "{appointment.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(appointment.id)}
                      disabled={loading}
                      className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                      title="Onayla"
                    >
                      <Check size={20} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => setCancelDialogAppointment(appointment)}
                      disabled={loading}
                      className="p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:from-red-500/20 hover:to-pink-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-red-500/10"
                      title="Reddet"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)]">
            Onaylanmis Randevular
          </h3>
        </div>

        {confirmedAppointments.length === 0 ? (
          <div className="obsidian-card p-6 text-center">
            <p className="font-body text-[var(--muted-lead)]">Onaylanmis randevu yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="obsidian-card p-4 hover:border-[var(--liquid-chrome)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-heading font-semibold text-[var(--chrome-white)]">
                        {appointment.customerName}
                      </span>
                      <StatusBadge status={appointment.status} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-mono text-[var(--silver-frost)]">
                        {appointment.date} - {appointment.time}
                      </span>
                      <span className="font-body text-[var(--muted-lead)]">
                        {appointment.staffName}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {appointment.services.map((service) => (
                        <span
                          key={service.id}
                          className="px-2 py-0.5 rounded-full bg-white/5 font-body text-xs text-[var(--silver-frost)]"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCompleteEarlyAppointment(appointment)}
                      disabled={loading}
                      className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                      title="Erken Tamamla"
                    >
                      <CheckCircle2 size={20} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => setCancelDialogAppointment(appointment)}
                      disabled={loading}
                      className="p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:from-red-500/20 hover:to-pink-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-red-500/10"
                      title="İptal Et"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      {cancelDialogAppointment && (
        <CancelAppointmentDialog
          isOpen={true}
          onClose={() => setCancelDialogAppointment(null)}
          onConfirm={handleReject}
          appointmentId={cancelDialogAppointment.id}
          cancelledBy="salon"
        />
      )}

      {/* Complete Early Dialog */}
      {completeEarlyAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] rounded-2xl p-6 space-y-4">
            <h3 className="font-heading text-lg font-bold">Randevuyu Erken Tamamla</h3>
            
            <p className="font-body text-sm text-[var(--muted-lead)]">
              Bu randevuyu şimdi tamamlamak istediğinize emin misiniz? Kalan süre tekrar kullanıma açılacaktır.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setCompleteEarlyAppointment(null)}
                className="flex-1 px-4 py-2 rounded-full border border-[var(--border)]"
              >
                İptal
              </button>
              <button
                onClick={handleCompleteEarly}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-full bg-[var(--success)] text-white disabled:opacity-50"
              >
                Tamamla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
