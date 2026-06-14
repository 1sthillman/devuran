/**
 * 🔒 BACKEND REZERVASYON SERVİSİ
 * 
 * ✅ GÜVENLİK: Tüm rezervasyonlar backend'de fiyat doğrulaması ile oluşturulur
 * Bu servis Firebase Cloud Functions ile iletişim kurar
 * 
 * @author Kiro AI Security Team
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Reservation } from '@/types';

class ReservationServiceBackend {
  /**
   * Backend validation ile rezervasyon oluştur
   * 
   * ✅ GÜVENLİK:
   * - Fiyat backend'de hesaplanır
   * - Client-side manipülasyon engellenir
   * - Otomatik onay kontrolü backend'de yapılır
   */
  async createReservationWithValidation(reservationData: any): Promise<{
    success: boolean;
    reservationId: string;
    validatedPrice: number;
    message: string;
  }> {
    const functions = getFunctions();
    const createReservationFn = httpsCallable(functions, 'createReservationWithValidation');
    
    try {
      console.log('📤 Calling backend validation...', {
        type: reservationData.type,
        clientPrice: reservationData.totalPrice
      });
      
      const result = await createReservationFn(reservationData);
      const data = result.data as any;
      
      console.log('✅ Backend validation successful:', data);
      
      return {
        success: data.success,
        reservationId: data.reservationId,
        validatedPrice: data.validatedPrice,
        message: data.message
      };
    } catch (error: any) {
      console.error('❌ Backend validation error:', error);
      
      // Firebase Functions error handling
      if (error.code === 'unauthenticated') {
        throw new Error('Giriş yapmanız gerekiyor');
      }
      
      if (error.code === 'permission-denied') {
        throw new Error('Bu işlem için yetkiniz yok');
      }
      
      if (error.code === 'invalid-argument') {
        throw new Error(error.message || 'Geçersiz rezervasyon bilgisi');
      }
      
      if (error.code === 'not-found') {
        throw new Error(error.message || 'İşletme veya paket bulunamadı');
      }
      
      // Generic error
      throw new Error(error.message || 'Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Legacy: Direkt Firestore write (DEPRECATED)
   * 
   * ⚠️ UYARI: Bu fonksiyon artık kullanılmamalı
   * createReservationWithValidation() kullanın
   * 
   * Sadece geriye dönük uyumluluk için korunuyor
   */
  async createReservationDirect(reservationData: any): Promise<Reservation> {
    console.warn('⚠️ DEPRECATED: createReservationDirect() kullanılıyor. Backend validation yok!');
    
    // Legacy reservation service import
    const { reservationService } = await import('./reservationService');
    return reservationService.createReservation(reservationData);
  }
  
  /**
   * Rezervasyon getir
   */
  async getReservation(reservationId: string): Promise<Reservation | null> {
    const { reservationService } = await import('./reservationService');
    return reservationService.getReservation(reservationId);
  }
  
  /**
   * Kullanıcının rezervasyonlarını getir
   */
  async getUserReservations(userId: string): Promise<Reservation[]> {
    const { reservationService } = await import('./reservationService');
    return reservationService.getUserReservations(userId);
  }
  
  /**
   * İşletme rezervasyonlarını getir
   */
  async getBusinessReservations(businessId: string, date?: string): Promise<Reservation[]> {
    const { reservationService } = await import('./reservationService');
    return reservationService.getBusinessReservations(businessId, date);
  }
  
  /**
   * Rezervasyonu onayla
   */
  async confirmReservation(reservationId: string): Promise<void> {
    const { reservationService } = await import('./reservationService');
    return reservationService.confirmReservation(reservationId);
  }
  
  /**
   * Rezervasyonu iptal et
   */
  async cancelReservation(
    reservationId: string,
    cancelledBy: 'user' | 'business',
    reason?: string
  ): Promise<number> {
    const { reservationService } = await import('./reservationService');
    return reservationService.cancelReservation(reservationId, cancelledBy, reason);
  }
}

export const reservationServiceBackend = new ReservationServiceBackend();

// ✅ Default export: Backend validation service
export default reservationServiceBackend;
