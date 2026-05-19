/**
 * Validation utilities for form inputs
 */

export const validation = {
  /**
   * Türkiye telefon numarası validasyonu
   * Format: 5XX XXX XX XX veya 05XX XXX XX XX
   */
  phone: (phone: string): { valid: boolean; message?: string } => {
    if (!phone) {
      return { valid: false, message: 'Telefon numarası gerekli' };
    }

    // Sadece rakamları al
    const cleaned = phone.replace(/\D/g, '');

    // 0 ile başlıyorsa kaldır
    const normalized = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;

    // 10 haneli olmalı ve 5 ile başlamalı
    if (normalized.length !== 10) {
      return { valid: false, message: 'Telefon numarası 10 haneli olmalı' };
    }

    if (!normalized.startsWith('5')) {
      return { valid: false, message: 'Telefon numarası 5 ile başlamalı' };
    }

    // İkinci hane 0-5 arası olmalı (Türkiye operatörleri)
    const secondDigit = parseInt(normalized[1]);
    if (secondDigit > 5) {
      return { valid: false, message: 'Geçersiz telefon numarası' };
    }

    return { valid: true };
  },

  /**
   * Email validasyonu
   */
  email: (email: string): { valid: boolean; message?: string } => {
    if (!email) {
      return { valid: false, message: 'E-posta adresi gerekli' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Geçersiz e-posta adresi' };
    }

    return { valid: true };
  },

  /**
   * İsim validasyonu
   */
  name: (name: string): { valid: boolean; message?: string } => {
    if (!name || name.trim().length === 0) {
      return { valid: false, message: 'İsim gerekli' };
    }

    if (name.trim().length < 2) {
      return { valid: false, message: 'İsim en az 2 karakter olmalı' };
    }

    if (name.trim().length > 100) {
      return { valid: false, message: 'İsim çok uzun' };
    }

    // En az bir boşluk olmalı (ad soyad)
    if (!name.includes(' ')) {
      return { valid: false, message: 'Lütfen ad ve soyadınızı girin' };
    }

    return { valid: true };
  },

  /**
   * Telefon numarasını formatla
   * 5551234567 -> 555 123 45 67
   */
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    const normalized = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    
    if (normalized.length !== 10) return phone;

    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8)}`;
  },

  /**
   * Telefon numarasını temizle (sadece rakamlar)
   */
  cleanPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  }
};
