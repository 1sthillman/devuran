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
                className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-white/[0.02] to-orange-500/5 p-5 hover:border-amber-500/30 transition-all duration-300 group"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative space-y-3.5">
                  {/* Header - Müşteri Bilgisi */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                      <User size={20} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] truncate">
                        {appointment.customerName}
                      </h4>
                      <p className="font-mono text-xs text-[var(--muted-lead)]">
                        {appointment.customerPhone}
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wide">
                      Randevu
                    </span>
                  </div>

                  {/* Date & Time - Kompakt */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <Clock size={16} className="text-cyan-400" strokeWidth={2.5} />
                      </div>
                      <span className="font-mono text-[var(--chrome-white)] font-semibold">
                        {appointment.date} • {appointment.time}
                      </span>
                    </div>
                  </div>

                  {/* Services - Eğer varsa */}
                  {appointment.services && appointment.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {appointment.services.slice(0, 3).map((service) => (
                        <span
                          key={service.id}
                          className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 font-heading font-semibold text-xs text-purple-300">
                          {service.name}
                        </span>
                      ))}
                      {appointment.services.length > 3 && (
                        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-heading font-semibold text-xs text-[var(--muted-lead)]">
                          +{appointment.services.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes - Eğer varsa */}
                  {appointment.notes && (
                    <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                      <p className="font-body text-xs text-blue-300 italic line-clamp-2">
                        💬 {appointment.notes}
                      </p>
                    </div>
                  )}

                  {/* Price + Actions Row */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-base font-bold text-emerald-400">₺</span>
                        </div>
                        <span className="font-mono font-bold text-lg text-emerald-400">
                          {appointment.totalPrice}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Modern Inline */}
                    <button
                      onClick={() => handleApprove(appointment.id)}
                      disabled={loading}
                      className="h-12 px-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-heading font-semibold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Check size={16} strokeWidth={2.5} />
                      Onayla
                    </button>
                    <button
                      onClick={() => setCancelDialogAppointment(appointment)}
                      disabled={loading}
                      className="w-12 h-12 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-heading font-semibold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center active:scale-[0.98]"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
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
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <p className="font-heading font-semibold text-[var(--chrome-white)] mb-1">
              Onaylanmış randevu yok
            </p>
            <p className="font-body text-sm text-[var(--muted-lead)]">
              Bekleyen randevuları onaylayın
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white/[0.02] to-teal-500/5 p-5 hover:border-emerald-500/30 transition-all duration-300 group cursor-pointer"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative space-y-3.5">
                  {/* Header - Müşteri ve Status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 size={20} className="text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] truncate">
                          {appointment.customerName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={appointment.status} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Kompakt */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setCompleteEarlyAppointment(appointment)}
                        disabled={loading}
                        className="w-9 h-9 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center transition-all duration-200"
                        title="Erken Tamamla"
                      >
                        <CheckCircle2 size={16} className="text-emerald-400" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setCancelDialogAppointment(appointment)}
                        disabled={loading}
                        className="w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-all duration-200"
                        title="İptal Et"
                      >
                        <X size={16} className="text-red-400" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Info Grid - Kompakt */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Date & Time */}
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                          <Clock size={16} className="text-cyan-400" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <span className="font-mono text-[var(--chrome-white)] font-semibold">
                            {appointment.date} • {appointment.time}
                          </span>
                          {appointment.staffName && (
                            <span className="text-[var(--muted-lead)] ml-1.5">
                              • {appointment.staffName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Services */}
                    {appointment.services && appointment.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {appointment.services.slice(0, 3).map((service) => (
                          <span
                            key={service.id}
                            className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 font-heading font-semibold text-xs text-purple-300">
                            {service.name}
                          </span>
                        ))}
                        {appointment.services.length > 3 && (
                          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-heading font-semibold text-xs text-[var(--muted-lead)]">
                            +{appointment.services.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-base font-bold text-emerald-400">₺</span>
                        </div>
                        <span className="font-mono font-bold text-lg text-emerald-400">
                          {appointment.totalPrice}
                        </span>
                      </div>
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
