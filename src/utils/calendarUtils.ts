import type { Reservation } from '@/types';

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

/**
 * Format date to yyyyMMddTHHmmssZ format for calendar links
 */
function formatCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format Turkish date
 */
function formatTurkishDate(date: Date): string {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year} ${dayName}`;
}

/**
 * Format time
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Convert reservation to calendar event
 */
export function reservationToCalendarEvent(reservation: Reservation): CalendarEvent {
  const { type, businessName } = reservation;
  
  let title = '';
  let description = '';
  let startDate = new Date();
  let endDate = new Date();
  let location = businessName;

  switch (type) {
    case 'slot': {
      const slotRes = reservation as any; // Type assertion for flexibility
      const [startHour, startMinute] = slotRes.startTime.split(':');
      const [endHour, endMinute] = slotRes.endTime.split(':');
      startDate = new Date(slotRes.date);
      startDate.setHours(parseInt(startHour), parseInt(startMinute));
      endDate = new Date(slotRes.date);
      endDate.setHours(parseInt(endHour), parseInt(endMinute));
      
      title = `${businessName} - Randevu`;
      
      const formattedDate = formatTurkishDate(startDate);
      const formattedStartTime = formatTime(startDate);
      const formattedEndTime = formatTime(endDate);
      
      const serviceName = slotRes.services?.[0]?.name || slotRes.serviceName || 'Hizmet';
      const staffName = slotRes.staffName || 'Belirtilmedi';
      
      description = `Randevu Detayları
      
Tarih: ${formattedDate}
Saat: ${formattedStartTime} - ${formattedEndTime}
İşletme: ${businessName}
Hizmet: ${serviceName}
Personel: ${staffName}

İletişim
Telefon: ${reservation.userPhone}

Rezervasyon No: ${reservation.id.slice(0, 8).toUpperCase()}

Randevunuzu iptal etmeniz veya değiştirmeniz gerekirse lütfen önceden bildiriniz.`;
      break;
    }
    
    case 'daily': {
      const dailyRes = reservation as any;
      startDate = new Date(dailyRes.date || dailyRes.eventDate);
      startDate.setHours(9, 0);
      endDate = new Date(dailyRes.date || dailyRes.eventDate);
      endDate.setHours(18, 0);
      
      title = `${businessName} - Rezervasyon`;
      
      const formattedDate = formatTurkishDate(startDate);
      const serviceName = dailyRes.serviceName || dailyRes.package?.name || 'Rezervasyon';
      
      description = `Rezervasyon Detayları

Tarih: ${formattedDate}
İşletme: ${businessName}
Hizmet: ${serviceName}

İletişim
Telefon: ${reservation.userPhone}

Rezervasyon No: ${reservation.id.slice(0, 8).toUpperCase()}`;
      break;
    }
    
    case 'nightly': {
      const nightlyRes = reservation as any;
      startDate = new Date(nightlyRes.checkIn);
      startDate.setHours(14, 0);
      endDate = new Date(nightlyRes.checkOut);
      endDate.setHours(12, 0);
      
      title = `${businessName} - Konaklama`;
      
      const checkInDate = formatTurkishDate(startDate);
      const checkOutDate = formatTurkishDate(endDate);
      const guestCount = nightlyRes.guestCount?.adults || nightlyRes.guestCount || 1;
      
      description = `Konaklama Detayları

Giriş: ${checkInDate} - 14:00
Çıkış: ${checkOutDate} - 12:00
Misafir Sayısı: ${guestCount} kişi
İşletme: ${businessName}

İletişim
Telefon: ${reservation.userPhone}

Rezervasyon No: ${reservation.id.slice(0, 8).toUpperCase()}`;
      break;
    }
    
    case 'project': {
      startDate = new Date(reservation.eventDate);
      startDate.setHours(10, 0);
      endDate = new Date(reservation.eventDate);
      endDate.setHours(22, 0);
      
      title = `${businessName} - Etkinlik`;
      
      const formattedDate = formatTurkishDate(startDate);
      
      description = `Etkinlik Detayları

Tarih: ${formattedDate}
Organizatör: ${businessName}
Misafir Sayısı: ${reservation.guestCount} kişi

İletişim
Telefon: ${reservation.userPhone}

Rezervasyon No: ${reservation.id.slice(0, 8).toUpperCase()}`;
      break;
    }
    
    case 'order': {
      const [deliveryHour, deliveryMinute] = (reservation.deliveryTime || '12:00').split(':');
      startDate = new Date(reservation.deliveryDate);
      startDate.setHours(parseInt(deliveryHour), parseInt(deliveryMinute));
      endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);
      
      title = `${businessName} - Sipariş Teslimatı`;
      
      const formattedDate = formatTurkishDate(startDate);
      const formattedTime = formatTime(startDate);
      
      description = `Sipariş Detayları

Tarih: ${formattedDate}
Teslimat Saati: ${formattedTime}
Teslimat Adresi: ${reservation.deliveryAddress}
İşletme: ${businessName}

İletişim
Telefon: ${reservation.userPhone}

Sipariş No: ${reservation.id.slice(0, 8).toUpperCase()}`;
      
      location = reservation.deliveryAddress || businessName;
      break;
    }
  }

  return {
    title,
    description,
    startDate,
    endDate,
    location
  };
}

/**
 * Generate Google Calendar link (opens app on mobile, web on desktop)
 */
export function generateGoogleCalendarLink(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${formatCalendarDate(event.startDate)}/${formatCalendarDate(event.endDate)}`,
    location: event.location || '',
    ctz: 'Europe/Istanbul',
    // Android için direkt uygulama açılması
    sf: 'true',
    output: 'xml'
  });
  
  // Android cihazlarda Google Calendar uygulaması varsa direkt açar
  // Yoksa web versiyonu açılır
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Apple Calendar (ICS) content with enhanced alarm support
 */
export function generateICSFile(event: CalendarEvent): string {
  // Randevu zamanına göre alarm ayarla
  const now = new Date();
  const eventTime = event.startDate;
  const timeDiff = eventTime.getTime() - now.getTime();
  const hoursUntilEvent = Math.floor(timeDiff / (1000 * 60 * 60));
  
  // Alarm trigger'ları hesapla
  const alarms = [];
  
  // 1 saat önce alarm (her zaman)
  alarms.push({
    trigger: '-PT1H',
    action: 'AUDIO',
    description: '1 Saat Sonra Randevunuz Var!'
  });
  
  // 15 dakika önce alarm (son hatırlatma)
  alarms.push({
    trigger: '-PT15M',
    action: 'DISPLAY',
    description: '15 Dakika Sonra Randevunuz - Hazır Olun!'
  });
  
  // Eğer randevu 1 günden fazla uzaktaysa, 1 gün önce alarm ekle
  if (hoursUntilEvent > 24) {
    alarms.push({
      trigger: '-P1D',
      action: 'DISPLAY',
      description: 'Yarın Randevunuz Var - Hazırlıklarınızı Unutmayın'
    });
  }
  
  // Eğer randevu 1 haftadan fazla uzaktaysa, 1 hafta önce alarm ekle
  if (hoursUntilEvent > 168) { // 7 gün = 168 saat
    alarms.push({
      trigger: '-P7D',
      action: 'DISPLAY',
      description: 'Gelecek Hafta Randevunuz Var'
    });
  }
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Randevu Sistemi//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Randevu Hatırlatıcısı',
    'X-WR-TIMEZONE:Europe/Istanbul',
    'X-WR-CALDESC:Otomatik randevu hatırlatıcısı',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Istanbul',
    'BEGIN:STANDARD',
    'DTSTART:19701025T040000',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'TZNAME:+03',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `DTSTART;TZID=Europe/Istanbul:${formatCalendarDate(event.startDate)}`,
    `DTEND;TZID=Europe/Istanbul:${formatCalendarDate(event.endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    event.location ? `LOCATION:${event.location}` : '',
    'STATUS:CONFIRMED',
    'PRIORITY:5',
    'SEQUENCE:0',
    `UID:${Date.now()}@randevu-sistemi.com`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    'CLASS:PUBLIC',
    'TRANSP:OPAQUE',
    // Tüm alarmları ekle
    ...alarms.flatMap(alarm => [
      'BEGIN:VALARM',
      `TRIGGER:${alarm.trigger}`,
      `ACTION:${alarm.action}`,
      `DESCRIPTION:${alarm.description}`,
      alarm.action === 'AUDIO' ? 'ATTACH;VALUE=URI:Chord' : '',
      'END:VALARM'
    ].filter(Boolean)),
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  
  return icsContent;
}

/**
 * Download ICS file
 */
export function downloadICSFile(event: CalendarEvent, filename: string = 'randevu.ics'): void {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Generate Outlook Web link
 */
export function generateOutlookWebLink(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    location: event.location || ''
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Office 365 link
 */
export function generateOffice365Link(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    location: event.location || ''
  });
  
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Detect user's platform and preferred calendar
 */
export function detectPlatform(): 'ios' | 'android' | 'macos' | 'windows' | 'other' {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  if (/mac os x/.test(userAgent)) return 'macos';
  if (/windows/.test(userAgent)) return 'windows';
  
  return 'other';
}

/**
 * Generate webcal URL for iOS/macOS (opens Calendar app directly)
 */
export function generateWebcalURL(event: CalendarEvent): string {
  // ICS içeriğini oluştur
  const icsContent = generateICSFile(event);
  
  // Blob oluştur
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // webcal protokolü ile döndür (iOS/macOS için)
  return url.replace('blob:', 'webcal://');
}

/**
 * Open calendar directly for iOS/macOS
 */
export function openAppleCalendar(event: CalendarEvent): void {
  const icsContent = generateICSFile(event);
  
  // iOS ve Safari için direkt data URL (takvim uygulaması otomatik açılır)
  const dataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  
  // Yeni pencerede aç - iOS otomatik olarak Calendar uygulamasına yönlendirir
  window.location.href = dataUrl;
}

/**
 * Get default calendar action based on platform
 */
export function getDefaultCalendarAction(event: CalendarEvent): () => void {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'ios':
    case 'macos':
      // Apple devices - direkt Calendar uygulamasını aç
      return () => openAppleCalendar(event);
    
    case 'android':
      // Android - Google Calendar web'i aç (direkt uygulamaya gider)
      return () => window.open(generateGoogleCalendarLink(event), '_blank');
    
    case 'windows':
      // Windows - ICS indir (Outlook veya Windows Calendar açar)
      return () => downloadICSFile(event, `randevu-${Date.now()}.ics`);
    
    default:
      // Diğer platformlar - ICS indir
      return () => downloadICSFile(event, `randevu-${Date.now()}.ics`);
  }
}

/**
 * Get calendar button text - simple and universal
 */
export function getCalendarButtonText(): string {
  return 'Takvime Ekle';
}
