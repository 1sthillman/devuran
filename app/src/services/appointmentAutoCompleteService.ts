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

    console.log('Starting appointment auto-complete service');
    
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
      console.log('Stopped appointment auto-complete service');
    }
  }

  /**
   * Randevuları kontrol et ve gerekirse tamamla
   */
  private async checkAndCompleteAppointments() {
    try {
      await appointmentsService.autoCompleteAppointments();
    } catch (error) {
      console.error('Error in auto-complete service:', error);
    }
  }
}

// Singleton instance
export const appointmentAutoCompleteService = new AppointmentAutoCompleteService();
