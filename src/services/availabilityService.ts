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
  }): Promise<TimeSlot[]> {
    
    const salon = await this.getSalon(params.businessId);
    if (!salon) return [];

    // Çalışma saatlerini al
    const dayName = this.getDayName(params.date);
    const workingHours = salon.workingHours[dayName];
    
    if (!workingHours || workingHours.isOpen === false) {
      return []; // Kapalı gün
    }

    // Personel bazlı mı genel mi?
    if (params.staffId) {
      return this.getStaffAvailableSlots(
        params.staffId,
        params.date,
        params.duration,
        workingHours
      );
    } else {
      return this.getAnyStaffAvailableSlots(
        salon,
        params.date,
        params.duration,
        workingHours
      );
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
}

export const availabilityService = new AvailabilityService();
