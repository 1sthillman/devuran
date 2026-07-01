/**
 * 📅 Cross-Platform Calendar Service
 * 
 * iOS, Android, Windows, macOS ve tüm tarayıcılarda çalışan
 * profesyonel takvim entegrasyonu
 * 
 * Desteklenen Platformlar:
 * - iOS: Apple Calendar (native)
 * - Android: Google Calendar, Samsung Calendar, etc.
 * - Windows: Outlook, Windows Calendar
 * - macOS: Apple Calendar, Outlook
 * - Web: Google Calendar, Outlook.com
 */

import type { Reservation } from '@/types';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
}

export interface CalendarOption {
  id: string;
  name: string;
  icon: string;
  action: () => void;
  supported: boolean;
}

class CalendarService {
  /**
   * Platform tespiti
   */
  private detectPlatform(): {
    isIOS: boolean;
    isAndroid: boolean;
    isMacOS: boolean;
    isWindows: boolean;
    isMobile: boolean;
  } {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    return {
      isIOS: /iphone|ipad|ipod/.test(ua) || (platform.includes('mac') && 'ontouchend' in document),
      isAndroid: /android/.test(ua),
      isMacOS: platform.includes('mac') && !('ontouchend' in document),
      isWindows: platform.includes('win'),
      isMobile: /iphone|ipad|ipod|android|mobile/.test(ua)
    };
  }

  /**
   * Rezervasyonu CalendarEvent'e dönüştür
   */
  private reservationToEvent(reservation: Reservation): CalendarEvent {
    let title = '';
    let startDate = new Date();
    let endDate = new Date();
    let location = reservation.businessName || '';
    let description = `Rezervasyon No: ${reservation.id.slice(0, 8).toUpperCase()}\n`;

    // Tip kontrolü ve değişken isimlendirmesi
    const slotRes = reservation as any;
    const dailyRes = reservation as any;
    const nightlyRes = reservation as any;

    try {
      switch (reservation.type) {
        case 'slot':
          title = `${reservation.businessName} - Randevu`;
          
          // Tarih ve saat parse - güvenli kontrol
          if (slotRes.date && slotRes.startTime) {
            const [year, month, day] = slotRes.date.split('-').map(Number);
            const [hours, minutes] = slotRes.startTime.split(':').map(Number);
            
            startDate = new Date(year, month - 1, day, hours, minutes);
            
            // Bitiş saati - services varsa duration al
            const duration = slotRes.services?.[0]?.duration || 60;
            endDate = new Date(startDate.getTime() + duration * 60000);

            description += `Tarih: ${slotRes.date}\n`;
            description += `Saat: ${slotRes.startTime}\n`;
            if (slotRes.services) {
              description += `Hizmetler: ${slotRes.services.map((s: any) => s.name).join(', ')}\n`;
            }
          } else {
            // Tarih bilgisi yoksa bugünden başlat
            startDate = new Date();
            endDate = new Date(startDate.getTime() + 3600000); // 1 saat
          }
          break;

        case 'daily':
          title = `${reservation.businessName} - Etkinlik`;
          
          if (dailyRes.eventDate) {
            const [dYear, dMonth, dDay] = dailyRes.eventDate.split('-').map(Number);
            const [dHours, dMinutes] = dailyRes.startTime ? dailyRes.startTime.split(':').map(Number) : [10, 0];
            
            startDate = new Date(dYear, dMonth - 1, dDay, dHours, dMinutes);
            endDate = new Date(startDate.getTime() + 4 * 3600000); // 4 saat

            description += `Etkinlik: ${dailyRes.eventType || ''}\n`;
            description += `Misafir Sayısı: ${dailyRes.capacity || 0}\n`;
            if (dailyRes.package?.name) {
              location = dailyRes.package.name;
            }
          } else {
            startDate = new Date();
            endDate = new Date(startDate.getTime() + 4 * 3600000);
          }
          break;

        case 'nightly':
          title = `${reservation.businessName} - Konaklama`;
          
          if (nightlyRes.checkIn && nightlyRes.checkOut) {
            startDate = new Date(nightlyRes.checkIn);
            endDate = new Date(nightlyRes.checkOut);

            description += `Check-in: ${nightlyRes.checkIn}\n`;
            description += `Check-out: ${nightlyRes.checkOut}\n`;
            description += `Misafir: ${nightlyRes.guests?.adults || 1} kişi\n`;
            if (nightlyRes.roomType) {
              description += `Oda: ${nightlyRes.roomType}\n`;
            }
          } else {
            startDate = new Date();
            endDate = new Date(startDate.getTime() + 86400000); // 1 gün
          }
          break;

        case 'project':
          title = `${reservation.businessName} - Proje/Etkinlik`;
          
          if (dailyRes.eventDate) {
            startDate = new Date(dailyRes.eventDate);
            endDate = new Date(startDate.getTime() + 2 * 3600000); // 2 saat
            
            if (dailyRes.eventType) {
              description += `Etkinlik: ${dailyRes.eventType}\n`;
            }
            if (dailyRes.guestCount) {
              description += `Misafir: ${dailyRes.guestCount}\n`;
            }
          } else {
            startDate = new Date();
            endDate = new Date(startDate.getTime() + 2 * 3600000);
          }
          break;

        case 'order':
          title = `${reservation.businessName} - Sipariş Teslimat`;
          
          if (dailyRes.deliveryDate) {
            const [oYear, oMonth, oDay] = dailyRes.deliveryDate.split('-').map(Number);
            const [oHours, oMinutes] = dailyRes.deliveryTime ? dailyRes.deliveryTime.split(':').map(Number) : [12, 0];
            
            startDate = new Date(oYear, oMonth - 1, oDay, oHours, oMinutes);
            endDate = new Date(startDate.getTime() + 3600000); // 1 saat

            if (dailyRes.deliveryAddress) {
              location = dailyRes.deliveryAddress;
            }
          } else {
            startDate = new Date();
            endDate = new Date(startDate.getTime() + 3600000);
          }
          break;

        default:
          // Bilinmeyen tip için güvenli varsayılan
          title = `${(reservation as any).businessName || 'Rezervasyon'} - Rezervasyon`;
          startDate = new Date();
          endDate = new Date(startDate.getTime() + 3600000);
      }
    } catch (error) {
      console.error('Calendar event oluşturma hatası:', error);
      // Hata durumunda güvenli varsayılan değerler
      title = `${(reservation as any).businessName || 'Rezervasyon'} - Rezervasyon`;
      startDate = new Date();
      endDate = new Date(startDate.getTime() + 3600000);
    }

    // İletişim bilgileri ekle
    if (reservation.userPhone) {
      description += `Telefon: ${reservation.userPhone}\n`;
    }

    // Toplam tutar ekle
    if (reservation.pricing?.totalAmount) {
      description += `Tutar: ${reservation.pricing.totalAmount.toLocaleString('tr-TR')} ₺\n`;
    }

    description += `\n✨ Randevunuzu unutmayın!`;

    return {
      title,
      description,
      location,
      startDate,
      endDate
    };
  }

  /**
   * Tarihi ICS formatına çevir
   */
  private formatICSDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return date.getFullYear() +
           pad(date.getMonth() + 1) +
           pad(date.getDate()) + 'T' +
           pad(date.getHours()) +
           pad(date.getMinutes()) +
           pad(date.getSeconds());
  }

  /**
   * ICS dosyası oluştur (Apple Calendar, Outlook için)
   */
  private generateICS(event: CalendarEvent): string {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Randevu Sistemi//TR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${this.formatICSDate(event.startDate)}`,
      `DTEND:${this.formatICSDate(event.endDate)}`,
      `DTSTAMP:${this.formatICSDate(new Date())}`,
      `UID:${Date.now()}@randevusistemi.com`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H', // 1 saat önceden alarm
      'ACTION:DISPLAY',
      `DESCRIPTION:${event.title}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return ics;
  }

  /**
   * Google Calendar URL oluştur
   */
  private generateGoogleCalendarURL(event: CalendarEvent): string {
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
      details: event.description,
      location: event.location
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Outlook Calendar URL oluştur
   */
  private generateOutlookURL(event: CalendarEvent): string {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      body: event.description,
      location: event.location,
      startdt: event.startDate.toISOString(),
      enddt: event.endDate.toISOString()
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  /**
   * ICS dosyası indir
   */
  private downloadICS(ics: string, filename: string) {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * iOS Apple Calendar'ı aç
   */
  private async openIOSCalendar(event: CalendarEvent) {
    const ics = this.generateICS(event);
    
    // Web Share API ile paylaşım - iOS takvim uygulamalarını gösterir
    if (navigator.share && navigator.canShare) {
      const blob = new Blob([ics], { type: 'text/calendar' });
      const file = new File([blob], 'randevu.ics', { type: 'text/calendar' });
      
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: event.title,
            text: 'Takvime ekle'
          });
          console.log('✅ iOS: Web Share API ile paylaşıldı');
          return;
        }
      } catch (error) {
        console.log('Web Share API hatası, data URI deneniyor...');
      }
    }
    
    // Fallback: Data URI ile direkt aç
    const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = 'randevu.ics';
    link.click();
    
    console.log('✅ iOS Calendar: ICS dosyası oluşturuldu');
  }

  /**
   * Android Calendar'ı aç
   */
  private async openAndroidCalendar(event: CalendarEvent) {
    const ics = this.generateICS(event);
    
    // Web Share API - Android tüm takvim uygulamalarını gösterir
    if (navigator.share && navigator.canShare) {
      const blob = new Blob([ics], { type: 'text/calendar' });
      const file = new File([blob], 'randevu.ics', { type: 'text/calendar' });
      
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: event.title,
            text: 'Takvime ekle'
          });
          console.log('✅ Android: Web Share API ile paylaşıldı');
          return;
        }
      } catch (error) {
        console.log('Web Share API hatası, alternatif yöntemler deneniyor...');
      }
    }
    
    // Alternatif 1: Google Calendar Web (tüm cihazlarda çalışır)
    const googleURL = this.generateGoogleCalendarURL(event);
    
    // Kullanıcıya seçenek sun
    const useGoogle = confirm(
      'Takvime eklemek için:\n\n' +
      '✅ Google Calendar\'ı aç (önerilen)\n' +
      '❌ ICS dosyası indir\n\n' +
      'Google Calendar\'ı açmak için Tamam\'a basın'
    );
    
    if (useGoogle) {
      window.open(googleURL, '_blank');
      console.log('✅ Android: Google Calendar açıldı');
    } else {
      // ICS dosyası indir
      const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = 'randevu.ics';
      link.click();
      console.log('✅ Android: ICS dosyası indirildi');
    }
  }

  /**
   * Kullanıcıya takvim seçenekleri sun
   */
  async showCalendarOptions(reservation: Reservation): Promise<void> {
    const event = this.reservationToEvent(reservation);
    const platform = this.detectPlatform();

    // Platform'a göre otomatik aksiyon
    if (platform.isIOS) {
      await this.openIOSCalendar(event);
      return;
    }

    if (platform.isAndroid) {
      await this.openAndroidCalendar(event);
      return;
    }

    // Desktop: Kullanıcıya seçenekler sun
    return this.showDesktopOptions(event, platform);
  }

  /**
   * Desktop için takvim seçenekleri
   */
  private async showDesktopOptions(event: CalendarEvent, platform: ReturnType<typeof this.detectPlatform>) {
    // Bu fonksiyon UI component tarafından çağrılacak
    // CalendarOptionsDialog component'i bu bilgileri kullanacak
    console.log('Desktop platform:', platform);
  }

  /**
   * Tüm takvim seçeneklerini al
   */
  getCalendarOptions(reservation: Reservation): CalendarOption[] {
    const event = this.reservationToEvent(reservation);
    const platform = this.detectPlatform();

    const options: CalendarOption[] = [];

    // Mobil için Web Share API - native paylaşım
    if (platform.isMobile && navigator.share) {
      options.push({
        id: 'share',
        name: 'Takvim Uygulamalarını Göster',
        icon: '📱',
        supported: true,
        action: async () => {
          const ics = this.generateICS(event);
          const blob = new Blob([ics], { type: 'text/calendar' });
          const file = new File([blob], 'randevu.ics', { type: 'text/calendar' });
          
          try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: event.title,
                text: 'Takvime eklemek için bir uygulama seçin'
              });
              return;
            }
          } catch (error: any) {
            // Kullanıcı iptal etti veya hata oluştu
            if (error.name !== 'AbortError') {
              console.log('Web Share hatası:', error);
            }
          }
        }
      });
    }

    // Google Calendar (Tüm platformlar - en popüler)
    options.push({
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      supported: true,
      action: () => {
        const url = this.generateGoogleCalendarURL(event);
        window.open(url, '_blank');
      }
    });

    // iOS/macOS için Apple Calendar
    if (platform.isIOS || platform.isMacOS) {
      options.push({
        id: 'apple',
        name: 'Apple Calendar',
        icon: '🍎',
        supported: true,
        action: async () => {
          const ics = this.generateICS(event);
          
          // Mobilde Web Share API dene
          if (platform.isMobile && navigator.share) {
            const blob = new Blob([ics], { type: 'text/calendar' });
            const file = new File([blob], 'randevu.ics', { type: 'text/calendar' });
            
            try {
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file] });
                return;
              }
            } catch (error) {
              console.log('Web Share hatası, data URI kullanılıyor');
            }
          }
          
          // Fallback: Data URI veya download
          const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
          const link = document.createElement('a');
          link.href = dataUri;
          link.download = 'randevu.ics';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    }

    // Outlook (Tüm platformlar)
    options.push({
      id: 'outlook',
      name: 'Outlook',
      icon: '📧',
      supported: true,
      action: () => {
        const url = this.generateOutlookURL(event);
        window.open(url, '_blank');
      }
    });

    // ICS Dosyası İndir (Desktop için)
    if (!platform.isMobile) {
      options.push({
        id: 'ics',
        name: 'ICS Dosyası İndir',
        icon: '📎',
        supported: true,
        action: () => {
          const ics = this.generateICS(event);
          this.downloadICS(ics, 'randevu.ics');
        }
      });
    }

    return options.filter(opt => opt.supported);
  }

  /**
   * Akıllı takvim ekleme (platform'a göre)
   */
  async addToCalendarSmart(reservation: Reservation): Promise<void> {
    const platform = this.detectPlatform();

    // Mobil: Direkt aksiyon
    if (platform.isMobile) {
      await this.showCalendarOptions(reservation);
      return;
    }

    // Desktop: Seçenekler göster (UI component handle edecek)
    // Bu fonksiyon sadece veri hazırlığı yapar
  }
}

export const calendarService = new CalendarService();
