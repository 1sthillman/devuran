import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Phone, Calendar, ArrowRight, X, CheckCircle2, User as UserIcon, ChevronRight, Bell, ChevronUp, ChevronDown, ArrowUpDown, Trash2, CheckCheck, TrendingUp } from 'lucide-react';
import { appointmentsService, salonsService, staffService } from '@/services/firebaseService';
import { useUIStore } from '@/store/uiStore';
import { availabilityService } from '@/services/availabilityService';
import { RemoveFromQueueDialog } from './RemoveFromQueueDialog';
import type { QueueEntry, Salon, Staff } from '@/types';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale/tr';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);
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

  const handleMoveUp = async (entry: QueueEntry) => {
    if (entry.queuePosition <= 1) return;
    
    try {
      const prevEntry = queue.find(q => q.queuePosition === entry.queuePosition - 1);
      if (!prevEntry) return;

      // Pozisyonları değiştir
      await updateDoc(doc(db, 'queue', entry.id), { queuePosition: entry.queuePosition - 1 });
      await updateDoc(doc(db, 'queue', prevEntry.id), { queuePosition: entry.queuePosition });
      
      addToast('Sıra yukarı taşındı', 'success');
      loadData();
    } catch (error) {
      console.error('Sıra taşıma hatası:', error);
      addToast('Sıra taşınamadı', 'error');
    }
  };

  const handleMoveDown = async (entry: QueueEntry) => {
    if (entry.queuePosition >= queue.length) return;
    
    try {
      const nextEntry = queue.find(q => q.queuePosition === entry.queuePosition + 1);
      if (!nextEntry) return;

      // Pozisyonları değiştir
      await updateDoc(doc(db, 'queue', entry.id), { queuePosition: entry.queuePosition + 1 });
      await updateDoc(doc(db, 'queue', nextEntry.id), { queuePosition: entry.queuePosition });
      
      addToast('Sıra aşağı taşındı', 'success');
      loadData();
    } catch (error) {
      console.error('Sıra taşıma hatası:', error);
      addToast('Sıra taşınamadı', 'error');
    }
  };

  const handleBulkAssign = async () => {
    if (selectedEntries.size === 0) {
      addToast('Lütfen en az bir kişi seçin', 'warning');
      return;
    }

    const confirmed = window.confirm(
      `${selectedEntries.size} kişi için toplu randevu oluşturmak istiyor musunuz?\n\n` +
      `• Her kişi için uygun saat aranacak\n` +
      `• Müşterilere bildirim gönderilecek`
    );

    if (!confirmed) return;

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const entryId of selectedEntries) {
        const entry = queue.find(q => q.id === entryId);
        if (!entry) continue;

        try {
          // İlk uygun saati bul
          const tomorrow = addDays(new Date(), 1);
          const slots = await availabilityService.getAvailableSlots({
            businessId: salon!.id,
            date: tomorrow,
            duration: entry.totalDuration,
            staffId: entry.staffId,
            workingHours: salon!.workingHours,
          });

          if (slots.length > 0) {
            await appointmentsService.assignQueueToSlot(
              entry.id,
              format(tomorrow, 'yyyy-MM-dd'),
              slots[0].startTime,
              entry.staffId
            );
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Atama hatası (${entry.id}):`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        addToast(`✅ ${successCount} kişi randevuya atandı`, 'success');
      }
      if (failCount > 0) {
        addToast(`⚠️ ${failCount} kişi atanamadı (uygun saat yok)`, 'warning');
      }

      setSelectedEntries(new Set());
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Toplu atama hatası:', error);
      addToast('Toplu atama başarısız', 'error');
    }
    setLoading(false);
  };

  const handleBulkRemove = async () => {
    if (selectedEntries.size === 0) {
      addToast('Lütfen en az bir kişi seçin', 'warning');
      return;
    }

    const confirmed = window.confirm(
      `${selectedEntries.size} kişiyi sıradan çıkarmak istediğinizden emin misiniz?`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      for (const entryId of selectedEntries) {
        await appointmentsService.removeFromQueue(entryId);
      }
      addToast(`${selectedEntries.size} kişi sıradan çıkarıldı`, 'success');
      setSelectedEntries(new Set());
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      addToast('Toplu silme başarısız', 'error');
    }
    setLoading(false);
  };

  const toggleSelection = (entryId: string) => {
    const newSelection = new Set(selectedEntries);
    if (newSelection.has(entryId)) {
      newSelection.delete(entryId);
    } else {
      newSelection.add(entryId);
    }
    setSelectedEntries(newSelection);
  };

  const selectAll = () => {
    if (selectedEntries.size === queue.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(queue.map(q => q.id)));
    }
  };

  const calculateEstimatedWaitTime = (position: number): string => {
    // Her kişi için ortalama 45 dakika hesapla
    const avgTimePerPerson = 45;
    const waitTimeMinutes = (position - 1) * avgTimePerPerson;
    
    if (waitTimeMinutes < 60) {
      return `~${waitTimeMinutes} dk`;
    } else {
      const hours = Math.floor(waitTimeMinutes / 60);
      const minutes = waitTimeMinutes % 60;
      return minutes > 0 ? `~${hours}s ${minutes}dk` : `~${hours} saat`;
    }
  };

  const stats = {
    totalInQueue: queue.length,
    totalRevenue: queue.reduce((sum, q) => sum + q.totalPrice, 0),
    avgDuration: queue.length > 0 ? Math.round(queue.reduce((sum, q) => sum + q.totalDuration, 0) / queue.length) : 0,
    withPreferredTime: queue.filter(q => q.preferredTime).length,
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
    <div className="space-y-4">
      {/* Stats Dashboard */}
      <div className="obsidian-card p-5 rounded-3xl">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
            <h3 className="font-heading font-bold text-base text-[var(--chrome-white)]">
              Sıra İstatistikleri
            </h3>
          </div>
          <ChevronDown className={cn("w-5 h-5 text-[var(--muted-lead)] transition-transform", showStats && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden"
            >
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-xs text-[var(--muted-lead)] mb-1">Toplam Kişi</div>
                <div className="text-2xl font-heading font-bold text-[var(--chrome-white)]">{stats.totalInQueue}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-xs text-[var(--muted-lead)] mb-1">Ort. Süre</div>
                <div className="text-2xl font-heading font-bold text-cyan-400">{stats.avgDuration} dk</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-xs text-[var(--muted-lead)] mb-1">Tercihli Saat</div>
                <div className="text-2xl font-heading font-bold text-amber-400">{stats.withPreferredTime}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-xs text-[var(--muted-lead)] mb-1">Toplam Tutar</div>
                <div className="text-2xl font-heading font-bold text-emerald-400">{stats.totalRevenue}₺</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="obsidian-card p-4 rounded-2xl border-purple-500/30"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-purple-400" />
              <span className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                {selectedEntries.size} kişi seçildi
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkAssign}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCheck size={16} />
                Toplu Ata
              </button>
              <button
                onClick={handleBulkRemove}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Toplu Sil
              </button>
              <button
                onClick={() => setSelectedEntries(new Set())}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--muted-lead)] text-sm font-semibold transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Select All */}
      <button
        onClick={selectAll}
        className="w-full px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--muted-lead)] text-sm font-semibold transition-all flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={16} />
        {selectedEntries.size === queue.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
      </button>

      {/* Queue List */}
      <div className="space-y-3">
      {queue.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "obsidian-card p-5 rounded-3xl hover:border-purple-500/30 transition-all duration-300",
            selectedEntries.has(entry.id) && "border-purple-500/50 bg-purple-500/5"
          )}
        >
          {/* Checkbox */}
          <div className="flex items-start gap-3 mb-4">
            <button
              onClick={() => toggleSelection(entry.id)}
              className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all mt-4",
                selectedEntries.has(entry.id)
                  ? "bg-purple-500 border-purple-500"
                  : "border-white/20 hover:border-white/40"
              )}
            >
              {selectedEntries.has(entry.id) && <CheckCircle2 size={16} className="text-white" />}
            </button>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
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

                {/* Position Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(entry)}
                    disabled={entry.queuePosition === 1 || loading}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--muted-lead)] hover:text-cyan-400 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Yukarı Taşı"
                  >
                    <ChevronUp size={16} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(entry)}
                    disabled={entry.queuePosition === queue.length || loading}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--muted-lead)] hover:text-cyan-400 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Aşağı Taşı"
                  >
                    <ChevronDown size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Wait Time Indicator */}
              <div className="mb-3 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-2 text-xs text-cyan-300">
                  <Clock size={12} />
                  <span className="font-semibold">Tahmini Bekleme: {calculateEstimatedWaitTime(entry.queuePosition)}</span>
                </div>
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
                    <div className="flex items-center gap-1 text-amber-400 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Calendar size={14} />
                      <span className="font-semibold">{entry.preferredTime}</span>
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

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 h-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-heading font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <ArrowRight size={16} strokeWidth={2.5} />
                  Randevuya Ata
                </button>
                <button
                  onClick={() => {
                    setEntryToRemove({ id: entry.id, name: entry.customerName });
                    setShowRemoveDialog(true);
                  }}
                  className="w-11 h-11 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-200 flex items-center justify-center"
                  title="Sıradan Çıkar"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      </div>

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
