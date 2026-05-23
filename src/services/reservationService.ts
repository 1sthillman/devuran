import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { sanitizeObject, sanitizeInput, containsXSS } from '@/utils/sanitize';
import { notificationService } from './notificationService';
import type { 
  Reservation, 
  SlotReservation,
  PaymentInfo,
  CancellationPolicy 
} from '@/types';

class ReservationService {
  private collectionName = 'reservations';

  async createReservation(data: Partial<Reservation>): Promise<Reservation> {
    // Security: Sanitize all user inputs
    const sanitizedData = sanitizeObject(data);
    
    // Security: Check for XSS attempts
    if (sanitizedData.notes && containsXSS(sanitizedData.notes)) {
      throw new Error('Geçersiz karakter tespit edildi');
    }
    
    if (sanitizedData.userName && containsXSS(sanitizedData.userName)) {
      throw new Error('Geçersiz isim formatı');
    }
    
    // Müsaitlik kontrolü
    const isAvailable = await this.checkAvailability(sanitizedData);
    if (!isAvailable) {
      throw new Error('Seçilen tarih/saat müsait değil');
    }

    // Fiyat hesapla
    const pricing = this.calculatePricing(sanitizedData);

    // İptal politikası
    const cancellationPolicy = this.getCancellationPolicy(sanitizedData);

    // Rezervasyon oluştur
    const reservationId = doc(collection(db, this.collectionName)).id;
    const reservation: Reservation = {
      ...sanitizedData,
      id: reservationId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pricing,
      cancellationPolicy
    } as Reservation;

    // Transaction ile kaydet
    await runTransaction(db, async (transaction) => {
      const ref = doc(db, this.collectionName, reservationId);
      transaction.set(ref, reservation);
    });

    // Send notification
    try {
      const dateStr = this.getEventDate(reservation) || '';
      const timeStr = reservation.type === 'slot' ? (reservation as SlotReservation).startTime : undefined;
      
      await notificationService.sendReservationCreated({
        userId: reservation.userId,
        userName: reservation.userName,
        userEmail: reservation.userEmail,
        userPhone: reservation.userPhone,
        businessName: reservation.businessName,
        reservationId: reservation.id,
        date: dateStr,
        time: timeStr,
        totalAmount: reservation.pricing.totalAmount,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't fail the reservation if notification fails
    }

    return reservation;
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Reservation;
    }
    return null;
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const reservations = snapshot.docs.map(doc => doc.data() as Reservation);
    
    // Client-side sorting
    return reservations.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  async getBusinessReservations(businessId: string, date?: string): Promise<Reservation[]> {
    let q = query(
      collection(db, this.collectionName),
      where('businessId', '==', businessId)
    );

    if (date) {
      q = query(q, where('date', '==', date));
    }

    const snapshot = await getDocs(q);
    const reservations = snapshot.docs.map(doc => doc.data() as Reservation);
    
    // Client-side sorting by createdAt
    return reservations.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  async confirmReservation(reservationId: string): Promise<void> {
    const reservation = await this.getReservation(reservationId);
    if (!reservation) {
      throw new Error('Rezervasyon bulunamadı');
    }

    const ref = doc(db, this.collectionName, reservationId);
    await setDoc(ref, {
      status: 'confirmed',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Send notification
    try {
      const dateStr = this.getEventDate(reservation) || '';
      const timeStr = reservation.type === 'slot' ? (reservation as SlotReservation).startTime : undefined;
      
      await notificationService.sendReservationConfirmed({
        userId: reservation.userId,
        userName: reservation.userName,
        userEmail: reservation.userEmail,
        userPhone: reservation.userPhone,
        businessName: reservation.businessName,
        reservationId: reservation.id,
        date: dateStr,
        time: timeStr,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async cancelReservation(
    reservationId: string,
    cancelledBy: 'user' | 'business',
    reason?: string
  ): Promise<number> {
    const reservation = await this.getReservation(reservationId);
    if (!reservation) {
      throw new Error('Rezervasyon bulunamadı');
    }

    // İşletme her zaman iptal edebilir
    if (cancelledBy === 'business') {
      const ref = doc(db, this.collectionName, reservationId);
      await setDoc(ref, {
        status: 'cancelled_by_business',
        updatedAt: new Date().toISOString(),
        cancellationReason: reason
      }, { merge: true });
      return 0;
    }

    // Kullanıcı için iptal kontrolü
    if (!reservation.cancellationPolicy.allowed) {
      throw new Error('Bu rezervasyon iptal edilemez');
    }

    const now = new Date();
    const deadline = new Date(reservation.cancellationPolicy.deadline);
    if (now > deadline) {
      throw new Error('İptal süresi geçmiş');
    }

    // İade miktarını hesapla
    const refundAmount = this.calculateRefund(reservation);

    // Durumu güncelle
    const ref = doc(db, this.collectionName, reservationId);
    await setDoc(ref, {
      status: 'cancelled_by_user',
      updatedAt: new Date().toISOString(),
      'pricing.refundAmount': refundAmount,
      'pricing.refundedAt': new Date().toISOString(),
      'pricing.refundReason': reason,
      cancellationReason: reason
    }, { merge: true });

    return refundAmount;
  }

  private async checkAvailability(data: Partial<Reservation>): Promise<boolean> {
    // Slot bazlı rezervasyon kontrolü
    if (data.type === 'slot') {
      const slotData = data as Partial<SlotReservation>;
      const existingReservations = await this.getBusinessReservations(
        data.businessId!,
        slotData.date
      );

      // Aynı personel, aynı saat kontrolü
      const hasConflict = existingReservations.some(res => {
        if (res.type !== 'slot') return false;
        const slotRes = res as SlotReservation;
        
        return (
          slotRes.staffId === slotData.staffId &&
          this.timesOverlap(
            slotData.startTime!,
            slotData.endTime!,
            slotRes.startTime,
            slotRes.endTime
          )
        );
      });

      return !hasConflict;
    }

    return true;
  }

  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculatePricing(data: Partial<Reservation>): PaymentInfo {
    let basePrice = 0;
    let extrasTotal = 0;

    // Tip bazlı fiyat hesaplama
    if (data.type === 'slot') {
      const slotData = data as Partial<SlotReservation>;
      basePrice = slotData.services?.reduce((sum, s) => sum + s.price, 0) || 0;
    } else if (data.type === 'nightly') {
      // Nightly için totalPrice direkt kullan
      const nightlyData = data as any;
      basePrice = nightlyData.totalPrice || 0;
      extrasTotal = nightlyData.extrasTotal || 0;
    } else if (data.type === 'daily') {
      // Daily için paket fiyatı + ekstralar
      const dailyData = data as any;
      basePrice = dailyData.totalPrice || dailyData.package?.price || 0;
      extrasTotal = dailyData.extrasTotal || 0;
    } else if (data.type === 'project') {
      // Project için paket fiyatı
      const projectData = data as any;
      basePrice = projectData.totalPrice || projectData.package?.price || 0;
    } else if (data.type === 'order') {
      // Order için items toplamı
      const orderData = data as any;
      basePrice = orderData.totalPrice || 0;
    }

    // Eğer hala 0 ise, genel totalPrice'ı kullan
    if (basePrice === 0 && (data as any).totalPrice) {
      basePrice = (data as any).totalPrice;
    }

    // Fiyatlar stabil - dinamik fiyatlandırma yok
    const tax = 0; // KDV dahil fiyat
    const total = basePrice;

    // Depozit hesapla
    const depositInfo = this.calculateDeposit(data, total);

    return {
      basePrice,
      extrasTotal,
      discountAmount: 0,
      taxAmount: tax,
      totalAmount: total,
      depositRequired: depositInfo.required,
      depositAmount: depositInfo.amount,
      depositPercentage: depositInfo.percentage,
      finalAmount: total - depositInfo.amount,
      currency: 'TRY'
    };
  }

  private calculateDeposit(data: Partial<Reservation>, totalAmount: number) {
    let depositPercentage = 0;
    let required = false;

    switch (data.type) {
      case 'slot':
        depositPercentage = 0;
        required = false;
        break;
      case 'daily':
        depositPercentage = 50;
        required = true;
        break;
      case 'nightly':
        depositPercentage = 30;
        required = true;
        break;
      case 'project':
        depositPercentage = 40;
        required = true;
        break;
      case 'order':
        depositPercentage = 30;
        required = true;
        break;
    }

    return {
      required,
      percentage: depositPercentage,
      amount: Math.round(totalAmount * (depositPercentage / 100))
    };
  }

  private getCancellationPolicy(data: Partial<Reservation>): CancellationPolicy {
    const eventDate = this.getEventDate(data);
    const deadline = new Date(eventDate!);

    let rules: { daysBeforeEvent: number; refundPercentage: number }[] = [];

    switch (data.type) {
      case 'slot':
        deadline.setHours(deadline.getHours() - 2);
        rules = [
          { daysBeforeEvent: 0, refundPercentage: 100 }
        ];
        break;
      case 'daily':
        deadline.setDate(deadline.getDate() - 7);
        rules = [
          { daysBeforeEvent: 14, refundPercentage: 100 },
          { daysBeforeEvent: 7, refundPercentage: 50 },
          { daysBeforeEvent: 0, refundPercentage: 0 }
        ];
        break;
      case 'project':
        deadline.setDate(deadline.getDate() - 30);
        rules = [
          { daysBeforeEvent: 90, refundPercentage: 90 },
          { daysBeforeEvent: 60, refundPercentage: 70 },
          { daysBeforeEvent: 30, refundPercentage: 50 },
          { daysBeforeEvent: 0, refundPercentage: 0 }
        ];
        break;
      default:
        deadline.setDate(deadline.getDate() - 7);
        rules = [
          { daysBeforeEvent: 7, refundPercentage: 100 },
          { daysBeforeEvent: 3, refundPercentage: 50 },
          { daysBeforeEvent: 0, refundPercentage: 0 }
        ];
    }

    return {
      allowed: true,
      deadline: deadline.toISOString(),
      rules
    };
  }

  private calculateRefund(reservation: Reservation): number {
    const now = new Date();
    const eventDate = new Date(this.getEventDate(reservation)!);
    const daysUntil = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const paidAmount = reservation.pricing.depositPaidAt 
      ? reservation.pricing.depositAmount 
      : 0;

    if (paidAmount === 0) return 0;

    const rules = reservation.cancellationPolicy.rules;
    for (const rule of rules.sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent)) {
      if (daysUntil >= rule.daysBeforeEvent) {
        return Math.round(paidAmount * (rule.refundPercentage / 100));
      }
    }

    return 0;
  }

  private getEventDate(data: Partial<Reservation>): string | undefined {
    if ('date' in data) return data.date;
    if ('eventDate' in data) return data.eventDate;
    if ('checkIn' in data) return data.checkIn;
    if ('deliveryDate' in data) return data.deliveryDate;
    return undefined;
  }
}

export const reservationService = new ReservationService();
