/**
 * Push Notification Service
 * Müşteri ve İşletme için kapsamlı bildirim sistemi
 * 
 * ÖZELLİKLER:
 * - Randevu hatırlatmaları (müşteri)
 * - Randevu durumu değişikliği bildirimleri (müşteri)
 * - Yeni randevu bildirimleri (işletme)
 * - Sıra sistemi bildirimleri (müşteri)
 * - Ödeme durumu bildirimleri (her iki taraf)
 * - Tarayıcı uyumluluğu (Chrome, Firefox, Safari, Edge)
 * - Arka plan bildirimleri (site kapalı olsa bile)
 */

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import app, { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, string>;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  userType: 'customer' | 'owner';
  businessId?: string;
  reservationId?: string;
  appointmentId?: string;
  type: 'appointment_reminder' | 'appointment_today' | 'queue_notification' | 'payment_reminder' | 'review_request';
  scheduledFor: string;
  payload: NotificationPayload;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

class PushNotificationService {
  private messaging: Messaging | null = null;
  private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  private isMessagingSupported = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.isMessagingSupported = await isSupported();
      
      if (!this.isMessagingSupported) {
        console.warn('⚠️ Bu tarayıcı Firebase Cloud Messaging desteklemiyor');
        return;
      }

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        this.messaging = getMessaging(app);
        console.log('✅ Push Notification Service başlatıldı');
      } else {
        console.warn('⚠️ Bu tarayıcı push bildirimleri desteklemiyor');
      }
    } catch (error) {
      console.error('❌ Push Notification Service başlatılamadı:', error);
    }
  }

  /**
   * Bildirim desteğini kontrol et
   */
  isNotificationSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      this.isMessagingSupported
    );
  }

  /**
   * Bildirim izin durumunu al
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isNotificationSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Kullanıcıdan bildirim izni iste
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isNotificationSupported()) {
      console.warn('⚠️ Bildirimler desteklenmiyor');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Bildirim izni alma hatası:', error);
      return false;
    }
  }

  /**
   * FCM Token al ve Firestore'a kaydet
   */
  async registerDevice(userId: string, userType: 'customer' | 'owner', businessId?: string): Promise<string | null> {
    if (!this.isMessagingSupported || !this.messaging) {
      console.warn('⚠️ Messaging servisi kullanılamıyor');
      return null;
    }

    try {
      // İzin kontrolü
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('⚠️ Kullanıcı bildirim iznini reddetti');
        return null;
      }

      // Service Worker'ı kaydet
      let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      
      if (!registration) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          type: 'classic'
        });
        console.log('✅ Service Worker kaydedildi');
        
        // Service Worker'ın aktif olmasını bekle
        if (registration.installing) {
          await new Promise<void>((resolve) => {
            registration!.installing!.addEventListener('statechange', (e: any) => {
              if (e.target.state === 'activated') {
                resolve();
              }
            });
          });
        }
      }

      // FCM token al
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        console.error('❌ FCM token alınamadı');
        return null;
      }

      console.log('✅ FCM Token alındı:', token.substring(0, 20) + '...');

      // Token'ı Firestore'a kaydet
      await this.saveTokenToFirestore(userId, token, userType, businessId);

      return token;

    } catch (error: any) {
      console.error('❌ Cihaz kaydetme hatası:', error);
      
      if (error.code === 'messaging/unsupported-browser') {
        console.warn('⚠️ Bu tarayıcı Firebase Messaging desteklemiyor');
      } else if (error.code === 'messaging/permission-blocked') {
        console.warn('⚠️ Bildirim izni engellendi. Tarayıcı ayarlarından izin verin.');
      }
      
      return null;
    }
  }

  /**
   * Token'ı Firestore'a kaydet
   */
  private async saveTokenToFirestore(
    userId: string,
    token: string,
    userType: 'customer' | 'owner',
    businessId?: string
  ): Promise<void> {
    try {
      const deviceData = {
        fcmToken: token,
        userType,
        businessId: businessId || null,
        notificationsEnabled: true,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'notificationDevices', `${userId}_${userType}`), deviceData, { merge: true });
      console.log('✅ FCM token Firestore\'a kaydedildi');
    } catch (error) {
      console.error('❌ Token kaydetme hatası:', error);
    }
  }

  /**
   * Bildirimleri devre dışı bırak
   */
  async disableNotifications(userId: string, userType: 'customer' | 'owner'): Promise<void> {
    try {
      await updateDoc(doc(db, 'notificationDevices', `${userId}_${userType}`), {
        notificationsEnabled: false,
        disabledAt: new Date().toISOString(),
      });
      console.log('✅ Bildirimler devre dışı bırakıldı');
    } catch (error) {
      console.error('❌ Bildirimleri devre dışı bırakma hatası:', error);
    }
  }

  /**
   * Ön planda bildirim dinle (uygulama açıkken)
   */
  onForegroundMessage(callback: (payload: any) => void): () => void {
    if (!this.isMessagingSupported || !this.messaging) {
      return () => {};
    }

    const unsubscribe = onMessage(this.messaging, (payload) => {
      console.log('📬 Ön plan bildirimi alındı:', payload);
      callback(payload);
      
      // Manuel bildirim göster
      this.showNotification(payload);
    });

    return unsubscribe;
  }

  /**
   * Tarayıcı bildirimi göster
   */
  private async showNotification(payload: any): Promise<void> {
    if (Notification.permission !== 'granted') {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const options: NotificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/favicon.svg',
        badge: payload.notification?.badge || '/favicon.svg',
        requireInteraction: payload.notification?.requireInteraction !== false,
        tag: payload.data?.type || 'general',
        data: payload.data,
      };

      await registration.showNotification(
        payload.notification?.title || 'Yeni Bildirim',
        options as any
      );
    } catch (error) {
      console.error('❌ Bildirim gösterme hatası:', error);
    }
  }

  /**
   * Bildirim aksiyonlarını belirle
   */
  private getNotificationActions(type?: string): any[] {
    if (!type) return [];

    const actions: Record<string, any[]> = {
      'appointment_reminder': [
        { action: 'view', title: '👁️ Görüntüle' },
        { action: 'directions', title: '🗺️ Yol Tarifi' },
      ],
      'appointment_confirmed': [
        { action: 'view', title: '✓ Görüntüle' },
        { action: 'calendar', title: '📅 Takvime Ekle' },
      ],
      'new_appointment': [
        { action: 'approve', title: '✓ Onayla' },
        { action: 'view', title: '👁️ Görüntüle' },
      ],
      'queue_ready': [
        { action: 'confirm', title: '✓ Geliyorum' },
        { action: 'cancel', title: '✕ İptal Et' },
      ],
      'payment_reminder': [
        { action: 'pay', title: '💳 Öde' },
        { action: 'view', title: '👁️ Detaylar' },
      ],
    };

    return actions[type] || [];
  }

  /**
   * Test bildirimi gönder
   */
  async sendTestNotification(userId: string): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('⚠️ Bildirim izni yok');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Bildirimi', {
        body: 'Bildirim sisteminiz çalışıyor! Randevularınız için bildirim alacaksınız.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        requireInteraction: false,
        tag: 'test',
      } as any);
      console.log('✅ Test bildirimi gönderildi');
    } catch (error) {
      console.error('❌ Test bildirimi hatası:', error);
    }
  }

  /**
   * Zamanlanmış bildirim oluştur (Cloud Functions tarafından işlenecek)
   */
  async scheduleNotification(notification: Omit<ScheduledNotification, 'id' | 'status' | 'createdAt'>): Promise<string> {
    try {
      const notificationData: Omit<ScheduledNotification, 'id'> = {
        ...notification,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const docRef = doc(collection(db, 'scheduledNotifications'));
      await setDoc(docRef, notificationData);

      console.log('✅ Zamanlanmış bildirim oluşturuldu:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Zamanlanmış bildirim oluşturma hatası:', error);
      throw error;
    }
  }

  /**
   * Randevu hatırlatıcısı zamanla
   * Randevu 24 saat öncesi ve 1 saat öncesi bildirim gönderir
   */
  async scheduleAppointmentReminders(
    userId: string,
    appointmentId: string,
    appointmentDate: string,
    businessName: string,
    businessAddress: string
  ): Promise<void> {
    const appointmentTime = new Date(appointmentDate);
    
    // 24 saat öncesi hatırlatıcı
    const reminder24h = new Date(appointmentTime);
    reminder24h.setHours(reminder24h.getHours() - 24);
    
    if (reminder24h > new Date()) {
      await this.scheduleNotification({
        userId,
        userType: 'customer',
        appointmentId,
        type: 'appointment_reminder',
        scheduledFor: reminder24h.toISOString(),
        payload: {
          title: 'Randevu Hatırlatması',
          body: `Yarın ${businessName} randevunuz var. Hazırlıklarınızı yapmayı unutmayın!`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          requireInteraction: true,
          data: {
            type: 'appointment_reminder',
            appointmentId,
            businessName,
          },
          actions: [
            { action: 'view', title: '👁️ Görüntüle' },
            { action: 'directions', title: '🗺️ Yol Tarifi' },
          ],
        },
      });
    }

    // 1 saat öncesi hatırlatıcı
    const reminder1h = new Date(appointmentTime);
    reminder1h.setHours(reminder1h.getHours() - 1);
    
    if (reminder1h > new Date()) {
      await this.scheduleNotification({
        userId,
        userType: 'customer',
        appointmentId,
        type: 'appointment_today',
        scheduledFor: reminder1h.toISOString(),
        payload: {
          title: 'Randevunuz Yaklaşıyor',
          body: `${businessName} randevunuz 1 saat sonra. Adres: ${businessAddress}`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          requireInteraction: true,
          data: {
            type: 'appointment_today',
            appointmentId,
            businessName,
            businessAddress,
          },
          actions: [
            { action: 'view', title: '👁️ Görüntüle' },
            { action: 'directions', title: '🗺️ Yol Tarifi' },
          ],
        },
      });
    }
  }

  /**
   * Randevu onay bildirimi gönder (İşletmeye)
   */
  async notifyBusinessNewAppointment(
    businessId: string,
    appointmentId: string,
    customerName: string,
    date: string,
    services: string[]
  ): Promise<void> {
    try {
      // İşletmenin device bilgisini al
      const deviceDoc = await getDoc(doc(db, 'notificationDevices', `${businessId}_owner`));
      
      if (!deviceDoc.exists()) {
        console.log('⚠️ İşletme için kayıtlı cihaz bulunamadı');
        return;
      }

      const deviceData = deviceDoc.data();
      if (!deviceData.notificationsEnabled) {
        console.log('⚠️ İşletme bildirimleri devre dışı');
        return;
      }

      // Anlık bildirim için zamanlanmış bildirim oluştur
      await this.scheduleNotification({
        userId: businessId,
        userType: 'owner',
        businessId,
        appointmentId,
        type: 'appointment_reminder',
        scheduledFor: new Date().toISOString(),
        payload: {
          title: 'Yeni Randevu',
          body: `${customerName} adlı müşteriden yeni randevu: ${date}. Hizmetler: ${services.join(', ')}`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          requireInteraction: true,
          data: {
            type: 'new_appointment',
            appointmentId,
            customerName,
          },
          actions: [
            { action: 'approve', title: '✓ Onayla' },
            { action: 'view', title: '👁️ Görüntüle' },
          ],
        },
      });
    } catch (error) {
      console.error('❌ İşletme bildirimi gönderme hatası:', error);
    }
  }

  /**
   * Randevu iptal zamanlanmış bildirimleri sil
   */
  async cancelScheduledNotifications(appointmentId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'scheduledNotifications'),
        where('appointmentId', '==', appointmentId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      
      const promises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
        })
      );

      await Promise.all(promises);
      console.log(`✅ ${promises.length} zamanlanmış bildirim iptal edildi`);
    } catch (error) {
      console.error('❌ Zamanlanmış bildirimleri iptal etme hatası:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
