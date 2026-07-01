import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import app from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

class FCMService {
  private messaging: Messaging | null = null;
  private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  private isMessagingSupported = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Safari ve diğer tarayıcılar için destek kontrolü
    try {
      this.isMessagingSupported = await isSupported();
      
      if (!this.isMessagingSupported) {
        console.warn('⚠️ Bu tarayıcı Firebase Messaging desteklemiyor');
        return;
      }

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        this.messaging = getMessaging(app);
        console.log('✅ Firebase Messaging başlatıldı');
      } else {
        console.warn('⚠️ Bu tarayıcı push bildirimleri desteklemiyor');
      }
    } catch (error) {
      console.error('❌ Firebase Messaging başlatılamadı:', error);
    }
  }

  /**
   * Kullanıcıdan bildirim izni iste ve FCM token al
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (!this.isMessagingSupported || !this.messaging) {
      console.warn('⚠️ Messaging servisi kullanılamıyor');
      return null;
    }

    try {
      // Bildirim izni iste
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('⚠️ Kullanıcı bildirim iznini reddetti');
        return null;
      }

      console.log('✅ Bildirim izni verildi');

      // Service Worker'ı kaydet veya mevcut olanı kullan
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
      } else {
        console.log('✅ Service Worker zaten kayıtlı');
      }

      // FCM token al
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: registration
      });

      console.log('✅ FCM Token alındı:', token.substring(0, 20) + '...');
      return token;

    } catch (error: any) {
      console.error('❌ Token alma hatası:', error);
      
      // Safari özel hata mesajları
      if (error.code === 'messaging/unsupported-browser') {
        console.warn('⚠️ Bu tarayıcı Firebase Messaging desteklemiyor');
      } else if (error.code === 'messaging/permission-blocked') {
        console.warn('⚠️ Bildirim izni engellendi. Tarayıcı ayarlarından izin verin.');
      }
      
      return null;
    }
  }

  /**
   * Kullanıcının FCM token'ını Firestore'a kaydet
   */
  async saveTokenToFirestore(userId: string, token: string, role: 'owner' | 'waiter' | 'kitchen' | 'cashier'): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmRole: role,
        fcmUpdatedAt: new Date().toISOString(),
        notificationsEnabled: true
      });
      console.log('✅ FCM token Firestore\'a kaydedildi');
    } catch (error) {
      console.error('❌ Token kaydetme hatası:', error);
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
      
      // Manuel bildirim göster (tarayıcı uyumluluğu için)
      this.showNotificationCompat(payload);
    });

    return unsubscribe;
  }

  /**
   * Cross-browser bildirim gösterimi
   */
  private async showNotificationCompat(payload: any) {
    if (Notification.permission !== 'granted') {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(
        payload.notification?.title || 'Yeni Bildirim',
        {
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/favicon.svg',
          badge: '/favicon.svg',
          requireInteraction: false,
          data: payload.data
        } as any // Vibrate TypeScript'te tanımlı değil ama tarayıcılar destekliyor
      );
    } catch (error) {
      console.error('❌ Bildirim gösterme hatası:', error);
    }
  }

  /**
   * Bildirim iznini kontrol et
   */
  isNotificationSupported(): boolean {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window &&
           this.isMessagingSupported;
  }

  /**
   * Bildirim izin durumunu kontrol et
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isNotificationSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Test bildirimi göster
   */
  async showTestNotification(): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('⚠️ Bildirim izni yok');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Bildirimi', {
        body: 'Bildirimler çalışıyor! 🎉',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        requireInteraction: false,
        tag: 'test-notification'
      } as any);
    } catch (error) {
      console.error('❌ Test bildirimi hatası:', error);
    }
  }
}

export const fcmService = new FCMService();
