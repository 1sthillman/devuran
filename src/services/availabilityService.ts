import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Salon, Staff, SlotReservation } from '@/types';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  staffId?: string;
  staffName?: string;
  available: boolean;
  price?: number;
}

export interface AvailableDate {
  date: Date;
  available: boolean;
  price: number;
  remainingCapacity?: number;
}

class AvailabilityService {
  
  async getAvailableSlots(params: {
    businessId: string;
    date: Date;
    duration: number;
    staffId?: string;
    workingHours?: Record<string, { open: string; close: string; isOpen?: boolean }>;
    staff?: Staff[];
  }): Promise<TimeSlot[]> {
    
    // Çalışma saatlerini al
    const dayName = this.getDayName(params.date);
    const workingHours = params.workingHours?.[dayName];
    
    // Çalışma saatleri kontrolü
    if (!workingHours) {
      return [];
    }
    
    if (workingHours.isOpen === false) {
      return [];
    }

    // Personel bazlı mı genel mi?
    if (params.staffId) {
      // Belirli bir personel seçilmiş
      const slots = await this.getStaffAvailableSlots(
        params.staffId,
        params.date,
        params.duration,
        workingHours
      );
      return slots;
    } else if (params.staff && params.staff.length > 0) {
      // Personel listesi var, aktif personellerin slotlarını al
      const activeStaff = params.staff.filter(s => s.isActive);
      if (activeStaff.length > 0) {
        const slots = await this.getAnyStaffAvailableSlotsFromList(
          activeStaff,
          params.date,
          params.duration,
          workingHours
        );
        return slots;
      } else {
        // Aktif personel yok, generic slotlar döndür
        const slots = this.generateGenericSlots(workingHours, params.duration, params.date);
        return slots;
      }
    } else {
      // Personel bilgisi yoksa generic slotlar döndür
      const slots = this.generateGenericSlots(workingHours, params.duration, params.date);
      return slots;
    }
  }

  private async getStaffAvailableSlots(
    staffId: string,
    date: Date,
    duration: number,
    workingHours: { open: string; close: string }
  ): Promise<TimeSlot[]> {
    
    // O gün personelin randevularını al
    const existingReservations = await this.getStaffReservations(staffId, date);

    const slots: TimeSlot[] = [];
    let currentTime = this.timeToMinutes(workingHours.open);
    const endTime = this.timeToMinutes(workingHours.close);

    // Bugünse ve şu anki saatten önceyse, şu anki saatten başla
    const now = new Date();
    const isToday = this.isSameDay(date, now);
    
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      // En az 30 dakika sonrası için slot göster
      const minStartTime = currentMinutes + 30;
      if (currentTime < minStartTime) {
        currentTime = Math.ceil(minStartTime / 15) * 15; // 15'in katına yuvarla
      }
    }

    while (currentTime + duration <= endTime) {
      const slotEnd = currentTime + duration;

      // Çakışma kontrolü
      const hasConflict = existingReservations.some(res => 
        this.timesOverlap(
          currentTime,
          slotEnd,
          this.timeToMinutes(res.startTime),
          this.timeToMinutes(res.endTime)
        )
      );

      if (!hasConflict) {
        slots.push({
          startTime: this.minutesToTime(currentTime),
          endTime: this.minutesToTime(slotEnd),
          staffId: staffId,
          available: true
        });
      }

      currentTime += 15; // 15 dakika aralıklarla
    }

    return slots;
  }

  private async getAnyStaffAvailableSlots(
    salon: Salon,
    date: Date,
    duration: number,
    workingHours: { open: string; close: string }
  ): Promise<TimeSlot[]> {
    
    // Personel yoksa veya hiç aktif personel yoksa, genel slotlar oluştur
    if (!salon.staff || salon.staff.length === 0 || !salon.staff.some(s => s.isActive)) {
      return this.generateGenericSlots(workingHours, duration, date);
    }

    const allSlots: TimeSlot[] = [];

    // Tüm personeller için slotları hesapla
    for (const staff of salon.staff) {
      if (!staff.isActive) continue;

      const staffSlots = await this.getStaffAvailableSlots(
        staff.id,
        date,
        duration,
        workingHours
      );

      staffSlots.forEach(slot => {
        slot.staffName = staff.name;
        allSlots.push(slot);
      });
    }

    // Saate göre grupla ve en erken müsait personeli göster
    const uniqueSlots = new Map<string, TimeSlot>();
    
    allSlots.forEach(slot => {
      const key = slot.startTime;
      if (!uniqueSlots.has(key)) {
        uniqueSlots.set(key, slot);
      }
    });

    return Array.from(uniqueSlots.values()).sort((a, b) => 
      this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
    );
  }

  private async getAnyStaffAvailableSlotsFromList(
    staff: Staff[],
    date: Date,
    duration: number,
    workingHours: { open: string; close: string }
  ): Promise<TimeSlot[]> {
    
    // Aktif personel kontrolü
    const activeStaff = staff.filter(s => s.isActive);
    
    if (!activeStaff || activeStaff.length === 0) {
      return this.generateGenericSlots(workingHours, duration, date);
    }

    const allSlots: TimeSlot[] = [];

    // Tüm aktif personeller için slotları hesapla
    for (const staffMember of activeStaff) {
      try {
        const staffSlots = await this.getStaffAvailableSlots(
          staffMember.id,
          date,
          duration,
          workingHours
        );

        staffSlots.forEach(slot => {
          slot.staffName = staffMember.name;
          allSlots.push(slot);
        });
      } catch (error) {
        console.error(`Personel ${staffMember.id} için slot hatası:`, error);
      }
    }

    // Eğer hiç slot bulunamadıysa, generic slotlar döndür
    if (allSlots.length === 0) {
      return this.generateGenericSlots(workingHours, duration, date);
    }

    // Saate göre grupla ve en erken müsait personeli göster
    const uniqueSlots = new Map<string, TimeSlot>();
    
    allSlots.forEach(slot => {
      const key = slot.startTime;
      if (!uniqueSlots.has(key)) {
        uniqueSlots.set(key, slot);
      }
    });

    const result = Array.from(uniqueSlots.values()).sort((a, b) => 
      this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
    );
    
    return result;
  }

  private generateGenericSlots(
    workingHours: { open: string; close: string },
    duration: number,
    date: Date
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // Duration kontrolü
    if (!duration || duration <= 0) {
      duration = 30; // Varsayılan 30 dakika
    }
    
    let currentTime = this.timeToMinutes(workingHours.open);
    const endTime = this.timeToMinutes(workingHours.close);

    // Bugünse ve şu anki saatten önceyse, şu anki saatten başla
    const now = new Date();
    const isToday = this.isSameDay(date, now);
    
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      // En az 30 dakika sonrası için slot göster
      const minStartTime = currentMinutes + 30;
      if (currentTime < minStartTime) {
        currentTime = Math.ceil(minStartTime / 15) * 15; // 15'in katına yuvarla
      }
    }

    while (currentTime + duration <= endTime) {
      const slotEnd = currentTime + duration;
      slots.push({
        startTime: this.minutesToTime(currentTime),
        endTime: this.minutesToTime(slotEnd),
        available: true
      });
      currentTime += 15; // 15 dakika aralıklarla
    }

    return slots;
  }

  private async getStaffReservations(
    staffId: string,
    date: Date
  ): Promise<SlotReservation[]> {
    
    const dateStr = date.toISOString().split('T')[0];
    
    const q = query(
      collection(db, 'reservations'),
      where('type', '==', 'slot'),
      where('staffId', '==', staffId),
      where('date', '==', dateStr),
      where('status', 'in', ['confirmed', 'deposit_paid', 'fully_paid', 'in_progress'])
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SlotReservation);
  }

  private async getSalon(salonId: string): Promise<Salon | null> {
    const q = query(
      collection(db, 'salons'),
      where('id', '==', salonId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    return snapshot.docs[0].data() as Salon;
  }

  private getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private timesOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

export const availabilityService = new AvailabilityService();
