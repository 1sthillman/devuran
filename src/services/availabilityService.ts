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
    serviceId?: string; // 🆕 Masa rezervasyonu için service ID (tableId içerir)
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

    // 🍽️ RESTORAN MASA REZERVASYONU - ServiceId bazlı kontrol
    if (params.serviceId) {
      const slots = await this.getServiceAvailableSlots(
        params.businessId,
        params.serviceId,
        params.date,
        params.duration,
        workingHours
      );
      return slots;
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

    // 🔥 BUGÜN İÇİN ÖZEL KONTROL
    const now = new Date();
    const isToday = this.isSameDay(date, now);
    
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      // En az 30 dakika sonrası için slot göster
      const minStartTime = currentMinutes + 30;
      
      // 🔥 DÜZELTME: Eğer minStartTime çalışma saatinden büyükse onu kullan
      if (minStartTime > currentTime) {
        currentTime = Math.ceil(minStartTime / 15) * 15; // 15'in katına yuvarla
      }
    }

    // 🔥 KONTROL: currentTime endTime'dan büyükse boş array döndür
    if (currentTime >= endTime) {
      return [];
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

  // 🍽️ YENİ: Masa bazlı rezervasyon kontrolü
  private async getServiceAvailableSlots(
    businessId: string,
    serviceId: string,
    date: Date,
    duration: number,
    workingHours: { open: string; close: string }
  ): Promise<TimeSlot[]> {
    
    // O gün bu masa için olan rezervasyonları al
    const existingReservations = await this.getServiceReservations(businessId, serviceId, date);

    console.log(`🍽️ Masa ${serviceId} için ${existingReservations.length} rezervasyon bulundu`);

    const slots: TimeSlot[] = [];
    let currentTime = this.timeToMinutes(workingHours.open);
    const endTime = this.timeToMinutes(workingHours.close);

    // BUGÜN İÇİN ÖZEL KONTROL
    const now = new Date();
    const isToday = this.isSameDay(date, now);
    
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      // En az 30 dakika sonrası için slot göster
      const minStartTime = currentMinutes + 30;
      
      // DÜZELTME: Eğer minStartTime çalışma saatinden büyükse onu kullan
      if (minStartTime > currentTime) {
        currentTime = Math.ceil(minStartTime / 15) * 15; // 15'in katına yuvarla
      }
    }

    // KONTROL: currentTime endTime'dan büyükse boş array döndür
    if (currentTime >= endTime) {
      return [];
    }

    while (currentTime + duration <= endTime) {
      const slotEnd = currentTime + duration;

      // Çakışma kontrolü - sadece bu masa için
      const hasConflict = existingReservations.some(res => 
        this.timesOverlap(
          currentTime,
          slotEnd,
          this.timeToMinutes(res.startTime),
          this.timeToMinutes(res.endTime)
        )
      );

      slots.push({
        startTime: this.minutesToTime(currentTime),
        endTime: this.minutesToTime(slotEnd),
        available: !hasConflict
      });

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

    // ✅ CRITICAL FIX #5: Today slot generation with midnight overflow protection
    // Issue: Midnight overflow causing invalid slots (24:15, 25:00, etc.)
    // Date: 2026-07-03
    const now = new Date();
    const isToday = this.isSameDay(date, now);
    
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      // En az 30 dakika sonrası için slot göster
      const minStartTime = currentMinutes + 30;
      
      // ✅ CRITICAL: 24-hour boundary check (1440 minutes = 24:00)
      if (minStartTime >= 1440) {
        // Gece yarısını geçti - bugün için slot yok
        console.log(`⚠️ No slots today: min start time ${minStartTime} >= 1440 (midnight)`);
        return [];
      }
      
      // ✅ DÜZELTME: Eğer minStartTime çalışma saatinden büyükse onu kullan,
      // yoksa çalışma saatinden başla (gece yarısı sorunu için)
      if (minStartTime > currentTime) {
        currentTime = Math.ceil(minStartTime / 15) * 15; // 15'in katına yuvarla
      }
      // Eğer minStartTime çalışma saatinden küçükse (örn: gece 01:00 < 07:00)
      // currentTime zaten workingHours.open'dan başlıyor, değiştirme
    }

    // ✅ CRITICAL: Final check - tüm gün geçmişse boş array döndür
    if (currentTime >= endTime) {
      console.log(`⚠️ Bugün için tüm slotlar geçmiş (${this.minutesToTime(currentTime)} >= ${this.minutesToTime(endTime)})`);
      return [];
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

    console.log(`✅ ${slots.length} slot oluşturuldu (${slots[0]?.startTime || 'N/A'} - ${slots[slots.length - 1]?.endTime || 'N/A'})`);
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

  // 🍽️ YENİ: Masa bazlı rezervasyon getir
  private async getServiceReservations(
    businessId: string,
    serviceId: string,
    date: Date
  ): Promise<SlotReservation[]> {
    
    const dateStr = date.toISOString().split('T')[0];
    
    console.log('🔍 getServiceReservations çağrıldı:', {
      businessId,
      serviceId,
      dateStr
    });
    
    // 🔥 KRİTİK FIX: salonId yerine businessId field'ı kullan
    const q = query(
      collection(db, 'reservations'),
      where('type', '==', 'slot'),
      where('businessId', '==', businessId),
      where('date', '==', dateStr),
      where('status', 'in', ['confirmed', 'deposit_paid', 'fully_paid', 'in_progress'])
    );

    const snapshot = await getDocs(q);
    
    console.log(`📊 Toplam ${snapshot.size} rezervasyon bulundu (tüm masalar)`);
    
    // Sadece bu service (masa) için olan rezervasyonları filtrele
    const allReservations = snapshot.docs.map(doc => {
      const data = doc.data() as SlotReservation;
      console.log('📋 Rezervasyon:', {
        id: doc.id,
        services: data.services?.map(s => ({ id: s.id, name: s.name }))
      });
      return data;
    });
    
    const serviceReservations = allReservations.filter(res => {
      // services array'inde bu serviceId var mı kontrol et
      const hasThisService = res.services?.some(s => {
        const match = s.id === serviceId;
        if (match) {
          console.log(`✅ Service ${serviceId} rezervasyonda bulundu:`, s.name);
        }
        return match;
      });
      return hasThisService;
    });
    
    console.log(`🎯 Service ${serviceId} için ${serviceReservations.length}/${allReservations.length} rezervasyon bulundu`);
    
    return serviceReservations;
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
