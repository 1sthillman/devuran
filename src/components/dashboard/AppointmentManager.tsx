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
    <div className="space-y-4">
      {/* Personel Filtreleme - Compact */}
      {staff.length > 0 && (
        <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3">
            <UsersIcon size={16} className="text-slate-400" />
            <h3 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
              Personel Filtrele
            </h3>
          </div>
          
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedStaffId(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-2xl font-heading font-medium text-xs transition-all ${
                !selectedStaffId
                  ? 'bg-slate-500/20 border border-slate-400/50 text-[var(--chrome-white)]'
                  : 'bg-white/[0.03] border border-white/[0.08] text-[var(--muted-lead)] hover:bg-white/[0.05]'
              }`}
            >
              Tümü ({appointments.length})
            </button>
            
            {staff.map((member) => {
              const memberAppointments = appointments.filter(a => a.staffId === member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedStaffId(member.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl font-heading font-medium text-xs transition-all ${
                    selectedStaffId === member.id
                      ? 'bg-slate-500/20 border border-slate-400/50 text-[var(--chrome-white)]'
                      : 'bg-white/[0.03] border border-white/[0.08] text-[var(--muted-lead)] hover:bg-white/[0.05]'
                  }`}
                >
                  {member.photo && (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  {member.name} ({memberAppointments.length})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Appointments */}
      {pendingAppointments.length > 0 && (
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
              <Clock size={18} className="text-orange-400" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                Onay Bekleyen Randevular
              </h3>
              <p className="text-[10px] text-[var(--muted-lead)] mt-0.5">
                {pendingAppointments.length} randevu onay bekliyor
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent backdrop-blur-xl"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-50" />
                
                <div className="relative p-5">
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
                      <User size={24} className="text-white" strokeWidth={2.5} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-2">
                        {appointment.customerName}
                      </h4>
                      
                      {/* Phone */}
                      <div className="flex items-center gap-2 mb-2">
                        <Phone size={14} className="text-orange-400" />
                        <span className="font-mono text-xs text-[var(--silver-frost)]">
                          {appointment.customerPhone}
                        </span>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={14} className="text-orange-400" />
                        <span className="font-mono text-xs text-[var(--silver-frost)]">
                          {appointment.date} • {appointment.time}
                        </span>
                      </div>

                      {/* Services */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {appointment.services.map((service) => (
                          <span
                            key={service.id}
                            className="px-2.5 py-1 rounded-xl bg-white/[0.08] border border-white/10 font-body text-[10px] text-[var(--chrome-white)]"
                          >
                            {service.name} • {service.duration}dk
                          </span>
                        ))}
                      </div>

                      {/* Price */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                        <span className="font-mono font-bold text-sm text-orange-300">
                          {appointment.totalPrice}₺
                        </span>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <p className="mt-3 font-body text-xs text-[var(--muted-lead)] italic px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                          "{appointment.notes}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApprove(appointment.id)}
                        disabled={loading}
                        className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                        title="Onayla"
                      >
                        <Check size={20} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setCancelDialogAppointment(appointment)}
                        disabled={loading}
                        className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40"
                        title="Reddet"
                      >
                        <X size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-emerald-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
              Onaylanmış Randevular
            </h3>
            <p className="text-[10px] text-[var(--muted-lead)] mt-0.5">
              {confirmedAppointments.length} aktif randevu
            </p>
          </div>
        </div>

        {confirmedAppointments.length === 0 ? (
          <div className="text-center py-6">
            <p className="font-body text-xs text-[var(--muted-lead)]">Onaylanmış randevu yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent backdrop-blur-xl hover:border-emerald-500/50 transition-all"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-50" />
                
                <div className="relative p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                        <User size={24} className="text-white" strokeWidth={2.5} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name & Status */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-heading font-bold text-base text-[var(--chrome-white)]">
                            {appointment.customerName}
                          </h4>
                          <StatusBadge status={appointment.status} />
                        </div>
                        
                        {/* Date & Time & Staff */}
                        <div className="flex items-center gap-3 mb-3 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-emerald-400" />
                            <span className="font-mono text-[var(--silver-frost)]">
                              {appointment.date} • {appointment.time}
                            </span>
                          </div>
                          {appointment.staffName && (
                            <span className="font-body text-[var(--muted-lead)]">
                              • {appointment.staffName}
                            </span>
                          )}
                        </div>

                        {/* Services */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {appointment.services.map((service) => (
                            <span
                              key={service.id}
                              className="px-2.5 py-1 rounded-xl bg-white/[0.08] border border-white/10 font-body text-[10px] text-[var(--chrome-white)]"
                            >
                              {service.name}
                            </span>
                          ))}
                        </div>

                        {/* Price */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                          <span className="font-mono font-bold text-sm text-emerald-300">
                            {appointment.totalPrice}₺
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCompleteEarlyAppointment(appointment)}
                        disabled={loading}
                        className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                        title="Erken Tamamla"
                      >
                        <CheckCircle2 size={20} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setCancelDialogAppointment(appointment)}
                        disabled={loading}
                        className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40"
                        title="İptal Et"
                      >
                        <X size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
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
