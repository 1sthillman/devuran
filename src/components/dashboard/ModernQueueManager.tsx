import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Phone, Calendar, ArrowRight, X, CheckCircle2, User as UserIcon, ChevronRight, Bell } from 'lucide-react';
import { appointmentsService, salonsService, staffService } from '@/services/firebaseService';
import { useUIStore } from '@/store/uiStore';
import { availabilityService } from '@/services/availabilityService';
import { RemoveFromQueueDialog } from './RemoveFromQueueDialog';
import type { QueueEntry, Salon, Staff } from '@/types';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale/tr';

interface ModernQueueManagerProps {
  salonId: string;
  staffId?: string;
  onRefresh?: () => void;
}

export function ModernQueueManager({ salonId, staffId, onRefresh }: ModernQueueManagerProps) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [entryToRemove, setEntryToRemove] = useState<{ id: string; name: string } | null>(null);
  const { addToast } = useUIStore();

  useEffect(() => {
    loadData();
  }, [salonId, staffId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [queueData, salonData, staffData] = await Promise.all([
        appointmentsService.getQueue(salonId, staffId),
        salonsService.getById(salonId),
        staffService.getBySalon(salonId)
      ]);
      setQueue(queueData);
      setSalon(salonData);
      setStaff(staffData.filter(s => s.isActive));
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      addToast('Veriler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromQueue = async (reason: string) => {
    if (!entryToRemove) return;
    
    try {
      await appointmentsService.removeFromQueue(entryToRemove.id);
      addToast(`Sıradan çıkarıldı: ${reason}`, 'success');
      loadData();
      onRefresh?.();
      setShowRemoveDialog(false);
      setEntryToRemove(null);
    } catch (error) {
      console.error('Sıradan çıkarma hatası:', error);
      addToast('Sıradan çıkarılamadı', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
          <Users size={36} className="text-purple-400" />
        </div>
        <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-2">
          Sırada Kimse Yok
        </h3>
        <p className="text-sm text-[var(--muted-lead)]">
          Müşteriler sıraya eklendikçe burada görünecekler
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="obsidian-card p-5 rounded-3xl hover:border-purple-500/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="font-bold text-white text-xl">
                  {entry.queuePosition}
                </span>
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-1">
                  {entry.customerName}
                </h4>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-lead)]">
                  <Phone size={12} />
                  <span>{entry.customerPhone}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setEntryToRemove({ id: entry.id, name: entry.customerName });
                setShowRemoveDialog(true);
              }}
              className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-200 flex items-center justify-center"
              title="Sıradan Çıkar"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {entry.services.map((service) => (
              <span
                key={service.id}
                className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300"
              >
                {service.name}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center gap-3 text-[var(--muted-lead)]">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{entry.totalDuration} dk</span>
              </div>
              {entry.preferredDate && entry.preferredTime && (
                <div className="flex items-center gap-1 text-cyan-400">
                  <Calendar size={14} />
                  <span>{entry.preferredTime}</span>
                </div>
              )}
            </div>
            <span className="font-bold text-lg text-emerald-400">
              {entry.totalPrice}₺
            </span>
          </div>

          {entry.notes && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-4">
              <p className="text-xs text-[var(--muted-lead)] italic">
                {entry.notes}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedEntry(entry);
              setShowAssignModal(true);
            }}
            className="w-full h-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-heading font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <ArrowRight size={16} strokeWidth={2.5} />
            Randevuya Ata
          </button>
        </motion.div>
      ))}

      {showAssignModal && selectedEntry && salon && (
        <AssignToSlotModal
          entry={selectedEntry}
          salon={salon}
          staff={staff}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedEntry(null);
          }}
          onSuccess={() => {
            loadData();
            onRefresh?.();
          }}
        />
      )}

      {showRemoveDialog && entryToRemove && (
        <RemoveFromQueueDialog
          isOpen={showRemoveDialog}
          onClose={() => {
            setShowRemoveDialog(false);
            setEntryToRemove(null);
          }}
          onConfirm={handleRemoveFromQueue}
          customerName={entryToRemove.name}
        />
      )}
    </div>
  );
}

function AssignToSlotModal({
  entry,
  salon,
  staff,
  onClose,
  onSuccess,
}: {
  entry: QueueEntry;
  salon: Salon;
  staff: Staff[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const { addToast } = useUIStore();

  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'dd MMM', { locale: tr }),
      day: format(date, 'EEEE', { locale: tr }),
      isToday: i === 0,
    };
  });

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    if (selectedDate && selectedStaffId) {
      loadAvailableSlots();
    } else if (selectedDate) {
      // Tarih seçildi ama personel seçilmedi, tüm saatleri göster
      generateAllTimeSlots();
    }
  }, [selectedDate, selectedStaffId]);

  const generateAllTimeSlots = () => {
    const slots: string[] = [];
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const isToday = selectedDateObj.toDateString() === now.toDateString();
    
    // 09:00'dan 21:00'a kadar 30 dakika aralıklarla
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Eğer bugünse, geçmiş saatleri gösterme
        if (isToday) {
          const [h, m] = timeStr.split(':').map(Number);
          const slotTime = new Date(now);
          slotTime.setHours(h, m, 0, 0);
          
          if (slotTime <= now) {
            continue; // Geçmiş saat, atla
          }
        }
        
        slots.push(timeStr);
      }
    }
    
    setAvailableSlots(slots);
  };

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const date = new Date(selectedDate);
      const slots = await availabilityService.getAvailableSlots({
        businessId: salon.id,
        date,
        duration: entry.totalDuration,
        staffId: selectedStaffId,
        workingHours: salon.workingHours,
      });
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      // Müsait saatleri filtrele (bugünse geçmiş saatleri çıkar)
      let filteredSlots = slots.map(s => s.startTime);
      
      if (isToday) {
        filteredSlots = filteredSlots.filter(time => {
          const [h, m] = time.split(':').map(Number);
          const slotTime = new Date(now);
          slotTime.setHours(h, m, 0, 0);
          return slotTime > now;
        });
      }
      
      // Eğer müsait saat yoksa, tüm saatleri göster
      if (filteredSlots.length === 0) {
        generateAllTimeSlots();
      } else {
        setAvailableSlots(filteredSlots);
      }
    } catch (error) {
      console.error('Slot yükleme hatası:', error);
      // Hata durumunda tüm saatleri göster
      generateAllTimeSlots();
    }
    setLoadingSlots(false);
  };

  const handleAssign = async () => {
    if (!selectedDate || !selectedTime || !selectedStaffId) {
      addToast('Lütfen tüm bilgileri doldurun', 'warning');
      return;
    }

    // Çakışma kontrolü
    const hasConflict = !availableSlots.includes(selectedTime);
    
    if (hasConflict) {
      const confirmed = window.confirm(
        `⚠️ UYARI: ${selectedTime} saatinde başka bir randevu var!\n\n` +
        `Bu saate yine de randevu oluşturmak istediğinizden emin misiniz?\n\n` +
        `• Mevcut randevu iptal EDİLMEYECEK\n` +
        `• İki randevu aynı anda olacak\n` +
        `• Personel çakışması yaşanabilir`
      );
      
      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await appointmentsService.assignQueueToSlot(
        entry.id,
        selectedDate,
        selectedTime,
        selectedStaffId
      );
      
      if (sendNotification) {
        addToast('Randevu oluşturuldu ve müşteriye bildirim gönderildi', 'success');
      } else {
        addToast('Randevu oluşturuldu', 'success');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Atama hatası:', error);
      addToast(error.message || 'Randevuya atanamadı', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStaff = staff.find(s => s.id === selectedStaffId);
  const selectedDateObj = dates.find(d => d.value === selectedDate);
  const canSubmit = selectedStaffId && selectedDate && selectedTime;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl sm:my-auto h-[90vh] sm:h-auto sm:max-h-[90vh] bg-[var(--void)] rounded-t-3xl sm:rounded-3xl border-t border-white/[0.08] sm:border shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Calendar size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] truncate">
                    Randevu Oluştur
                  </h3>
                  <p className="text-xs text-[var(--muted-lead)]">
                    {entry.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-[var(--muted-lead)]" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    background: currentStep >= step
                      ? 'linear-gradient(to right, #10b981, #14b8a6)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Step 1: Staff */}
            <motion.div
              initial={false}
              animate={{ opacity: currentStep === 1 ? 1 : 0.5 }}
              className="obsidian-card p-5 rounded-3xl"
            >
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    selectedStaffId ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "bg-white/10 text-[var(--muted-lead)]"
                  )}>
                    {selectedStaffId ? <CheckCircle2 size={16} /> : "1"}
                  </div>
                  <div className="text-left">
                    <p className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                      Personel
                    </p>
                    {selectedStaff && (
                      <p className="text-xs text-emerald-400">{selectedStaff.name}</p>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-[var(--muted-lead)]" />
              </button>

              <AnimatePresence>
                {currentStep === 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {staff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStaffId(s.id);
                          setCurrentStep(2);
                        }}
                        className={cn(
                          "w-full p-4 rounded-2xl border text-left transition-all hover:scale-[1.01]",
                          selectedStaffId === s.id
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-white/[0.08] bg-white/[0.02]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <UserIcon size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="font-heading font-bold text-sm text-[var(--chrome-white)]">{s.name}</p>
                            <p className="text-xs text-[var(--muted-lead)]">{s.title}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Step 2: Date */}
            <motion.div
              initial={false}
              animate={{ opacity: currentStep === 2 ? 1 : 0.5 }}
              className="obsidian-card p-5 rounded-3xl"
            >
              <button
                onClick={() => selectedStaffId && setCurrentStep(2)}
                disabled={!selectedStaffId}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    selectedDate ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "bg-white/10 text-[var(--muted-lead)]"
                  )}>
                    {selectedDate ? <CheckCircle2 size={16} /> : "2"}
                  </div>
                  <div className="text-left">
                    <p className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                      Tarih
                    </p>
                    {selectedDateObj && (
                      <p className="text-xs text-emerald-400">{selectedDateObj.label}</p>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-[var(--muted-lead)]" />
              </button>

              <AnimatePresence>
                {currentStep === 2 && selectedStaffId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid grid-cols-2 gap-2 overflow-hidden"
                  >
                    {dates.map((date) => (
                      <button
                        key={date.value}
                        onClick={() => {
                          setSelectedDate(date.value);
                          setCurrentStep(3);
                        }}
                        className={cn(
                          "p-3 rounded-2xl border text-center transition-all hover:scale-[1.02]",
                          selectedDate === date.value
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-white/[0.08] bg-white/[0.02]"
                        )}
                      >
                        {date.isToday && (
                          <span className="text-xs font-bold text-emerald-400 block mb-1">Bugün</span>
                        )}
                        <p className="font-heading font-bold text-sm text-[var(--chrome-white)]">{date.label}</p>
                        <p className="text-xs text-[var(--muted-lead)]">{date.day}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Step 3: Time */}
            <motion.div
              initial={false}
              animate={{ opacity: currentStep === 3 ? 1 : 0.5 }}
              className="obsidian-card p-5 rounded-3xl"
            >
              <button
                onClick={() => selectedDate && setCurrentStep(3)}
                disabled={!selectedDate}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    selectedTime ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "bg-white/10 text-[var(--muted-lead)]"
                  )}>
                    {selectedTime ? <CheckCircle2 size={16} /> : "3"}
                  </div>
                  <div className="text-left">
                    <p className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                      Saat
                    </p>
                    {selectedTime && (
                      <p className="text-xs text-emerald-400">{selectedTime}</p>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-[var(--muted-lead)]" />
              </button>

              <AnimatePresence>
                {currentStep === 3 && selectedDate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {loadingSlots ? (
                      <div className="text-center py-8">
                        <div className="w-10 h-10 border-3 border-white/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-[var(--muted-lead)]">Yükleniyor...</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {availableSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => {
                              setSelectedTime(time);
                            }}
                            className={cn(
                              "h-11 rounded-full font-bold text-sm transition-all hover:scale-[1.05]",
                              selectedTime === time
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                                : "bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)]"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-[var(--muted-lead)]">Saat yüklenemedi</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Notification Toggle */}
            {canSubmit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="obsidian-card p-4 rounded-2xl"
              >
                <button
                  onClick={() => setSendNotification(!sendNotification)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      sendNotification ? "bg-blue-500/20" : "bg-white/5"
                    )}>
                      <Bell size={18} className={sendNotification ? "text-blue-400" : "text-[var(--muted-lead)]"} />
                    </div>
                    <div className="text-left">
                      <p className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                        Müşteriye Bildirim Gönder
                      </p>
                      <p className="text-xs text-[var(--muted-lead)]">
                        SMS ile randevu detayları iletilecek
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "w-12 h-7 rounded-full transition-all",
                    sendNotification ? "bg-blue-500" : "bg-white/10"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white shadow-lg transition-all mt-1",
                      sendNotification ? "ml-6" : "ml-1"
                    )} />
                  </div>
                </button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/[0.08]">
            <button
              onClick={handleAssign}
              disabled={isSubmitting || !canSubmit}
              className="w-full h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-2xl hover:shadow-emerald-500/40 text-white font-heading font-bold text-sm transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                  <span>Randevu Oluştur</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
