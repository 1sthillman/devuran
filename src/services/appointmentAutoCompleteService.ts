import { appointmentsService } from './firebaseService';

/**
 * Randevuları otomatik olarak tamamlayan servis
 * Randevu bitiş saati geçtiğinde otomatik olarak 'completed' durumuna geçirir
 */
class AppointmentAutoCompleteService {
  private intervalId: number | null = null;
  private readonly CHECK_INTERVAL = 60000; // 1 dakika

  /**
   * Otomatik tamamlama servisini başlat
   */
  start() {
    if (this.intervalId) {
      console.warn('Auto-complete service is already running');
      return;
    }

    // Service başlatıldı - production'da bu log kalabilir
    if (import.meta.env.DEV) {
      console.log('Appointment auto-complete service started');
    }
    
    // İlk kontrolü hemen yap
    this.checkAndCompleteAppointments();
    
    // Periyodik kontrol başlat
    this.intervalId = window.setInterval(() => {
      this.checkAndCompleteAppointments();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Otomatik tamamlama servisini durdur
   */
  stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      
      if (import.meta.env.DEV) {
        console.log('Appointment auto-complete service stopped');
      }
    }
  }

  /**
   * Randevuları kontrol et ve gerekirse tamamla
   */
  private async checkAndCompleteAppointments() {
    try {
      await appointmentsService.autoCompleteAppointments();
    } catch (error) {
      // Sessizce geç
    }
  }
}

// Singleton instance
export const appointmentAutoCompleteService = new AppointmentAutoCompleteService();
