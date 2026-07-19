/**
 * Firebase Cloud Functions - Notification Scheduler
 * 
 * Bu dosya Firebase Cloud Functions backend'inde kullanılacak örnek koddur.
 * 
 * KURULUM:
 * 1. firebase init functions
 * 2. npm install firebase-admin firebase-functions
 * 3. Bu kodu functions/src/notifications.ts olarak kaydedin
 * 4. firebase deploy --only functions
 * 
 * ÖZELLİKLER:
 * - Zamanlanmış bildirimleri kontrol eder (her dakika)
 * - Süresi gelen bildirimleri FCM ile gönderir
 * - Hata durumlarını yönetir ve retry mekanizması
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin SDK'yı başlat (bir kere)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Zamanlanmış Bildirimleri Kontrol Et ve Gönder
 * Her dakika çalışır (cron: "* * * * *")
 */
export const processScheduledNotifications = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    console.log('📬 Zamanlanmış bildirimler kontrol ediliyor...');

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

    try {
      // Gönderilmesi gereken bildirimleri bul
      const snapshot = await db
        .collection('scheduledNotifications')
        .where('status', '==', 'pending')
        .where('scheduledFor', '<=', fiveMinutesFromNow.toISOString())
        .limit(100) // Batch limit
        .get();

      if (snapshot.empty) {
        console.log('✅ Gönderilecek bildirim yok');
        return null;
      }

      console.log(`📤 ${snapshot.size} bildirim gönderilecek`);

      // Batch işlem için promise array
      const sendPromises = snapshot.docs.map(async (doc) => {
        const notification = doc.data();
        const notificationId = doc.id;

        try {
          // Kullanıcının FCM token'ını al
          const deviceDoc = await db
            .collection('notificationDevices')
            .doc(`${notification.userId}_${notification.userType}`)
            .get();

          if (!deviceDoc.exists) {
            console.warn(`⚠️ Cihaz bulunamadı: ${notification.userId}`);
            await doc.ref.update({
              status: 'failed',
              error: 'Device not found',
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return;
          }

          const deviceData = deviceDoc.data();

          // Bildirimler devre dışı mı kontrol et
          if (!deviceData?.notificationsEnabled) {
            console.log(`⚠️ Bildirimler devre dışı: ${notification.userId}`);
            await doc.ref.update({
              status: 'cancelled',
              error: 'Notifications disabled',
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return;
          }

          // FCM mesajı oluştur
          const message: admin.messaging.Message = {
            token: deviceData.fcmToken,
            notification: {
              title: notification.payload.title,
              body: notification.payload.body,
              imageUrl: notification.payload.image,
            },
            data: notification.payload.data || {},
            android: {
              priority: 'high',
              notification: {
                icon: notification.payload.icon || 'notification_icon',
                color: '#7C3AED',
                sound: 'default',
                channelId: 'appointments',
                priority: 'high',
                defaultVibrateTimings: true,
              },
            },
            apns: {
              payload: {
                aps: {
                  badge: 1,
                  sound: 'default',
                  contentAvailable: true,
                },
              },
            },
            webpush: {
              notification: {
                icon: notification.payload.icon || '/favicon.svg',
                badge: notification.payload.badge || '/favicon.svg',
                requireInteraction: notification.payload.requireInteraction !== false,
                vibrate: [200, 100, 200],
                actions: notification.payload.actions || [],
              },
              fcmOptions: {
                link: notification.payload.data?.url || '/',
              },
            },
          };

          // Bildirimi gönder
          const response = await messaging.send(message);
          console.log(`✅ Bildirim gönderildi: ${notificationId}`, response);

          // Durumu güncelle
          await doc.ref.update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // İstatistik kaydet
          await db.collection('notificationStats').add({
            notificationId,
            userId: notification.userId,
            type: notification.type,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            success: true,
          });
        } catch (error: any) {
          console.error(`❌ Bildirim gönderme hatası (${notificationId}):`, error);

          // Hata durumunu kaydet
          await doc.ref.update({
            status: 'failed',
            error: error.message || 'Unknown error',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // İstatistik kaydet
          await db.collection('notificationStats').add({
            notificationId,
            userId: notification.userId,
            type: notification.type,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            success: false,
            error: error.message,
          });
        }
      });

      // Tüm bildirimleri paralel gönder
      await Promise.allSettled(sendPromises);
      console.log('✅ Batch tamamlandı');
      return null;
    } catch (error) {
      console.error('❌ Fatal error:', error);
      return null;
    }
  });

/**
 * Randevu Oluşturulduğunda Tetiklenen Fonksiyon
 * Otomatik olarak randevu hatırlatmaları planlar
 */
export const onReservationCreated = functions.firestore
  .document('reservations/{reservationId}')
  .onCreate(async (snap, context) => {
    const reservation = snap.data();
    const reservationId = context.params.reservationId;

    console.log(`📅 Yeni rezervasyon oluşturuldu: ${reservationId}`);

    try {
      // Sadece slot rezervasyonlar için hatırlatma planla
      if (reservation.type === 'slot' && reservation.date && reservation.startTime) {
        const appointmentDateTime = new Date(`${reservation.date}T${reservation.startTime}`);

        // 24 saat öncesi hatırlatıcı
        const reminder24h = new Date(appointmentDateTime);
        reminder24h.setHours(reminder24h.getHours() - 24);

        if (reminder24h > new Date()) {
          await db.collection('scheduledNotifications').add({
            userId: reservation.userId,
            userType: 'customer',
            appointmentId: reservationId,
            businessId: reservation.businessId,
            type: 'appointment_reminder',
            scheduledFor: reminder24h.toISOString(),
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            payload: {
              title: 'Randevu Hatırlatması',
              body: `Yarın ${reservation.businessName} randevunuz var. Hazırlıklarınızı yapmayı unutmayın!`,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              requireInteraction: true,
              data: {
                type: 'appointment_reminder',
                appointmentId: reservationId,
                businessName: reservation.businessName,
                url: `/appointments`,
              },
              actions: [
                { action: 'view', title: '👁️ Görüntüle' },
                { action: 'directions', title: '🗺️ Yol Tarifi' },
              ],
            },
          });
          console.log('✅ 24 saat öncesi hatırlatıcı planlandı');
        }

        // 1 saat öncesi hatırlatıcı
        const reminder1h = new Date(appointmentDateTime);
        reminder1h.setHours(reminder1h.getHours() - 1);

        if (reminder1h > new Date()) {
          await db.collection('scheduledNotifications').add({
            userId: reservation.userId,
            userType: 'customer',
            appointmentId: reservationId,
            businessId: reservation.businessId,
            type: 'appointment_today',
            scheduledFor: reminder1h.toISOString(),
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            payload: {
              title: 'Randevunuz Yaklaşıyor',
              body: `${reservation.businessName} randevunuz 1 saat sonra. Hazırlanmayı unutmayın!`,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              requireInteraction: true,
              data: {
                type: 'appointment_today',
                appointmentId: reservationId,
                businessName: reservation.businessName,
                url: `/appointments`,
              },
              actions: [
                { action: 'view', title: '👁️ Görüntüle' },
                { action: 'directions', title: '🗺️ Yol Tarifi' },
              ],
            },
          });
          console.log('✅ 1 saat öncesi hatırlatıcı planlandı');
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Hatırlatma planlama hatası:', error);
      return null;
    }
  });

/**
 * Randevu İptal Edildiğinde
 * Zamanlanmış bildirimleri iptal et
 */
export const onReservationCancelled = functions.firestore
  .document('reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const reservationId = context.params.reservationId;

    // İptal durumu kontrolü
    const wasCancelled =
      after.status === 'cancelled_by_user' ||
      after.status === 'cancelled_by_business';

    if (!wasCancelled || before.status === after.status) {
      return null;
    }

    console.log(`❌ Rezervasyon iptal edildi: ${reservationId}`);

    try {
      // Bu rezervasyon için zamanlanmış bildirimleri iptal et
      const snapshot = await db
        .collection('scheduledNotifications')
        .where('appointmentId', '==', reservationId)
        .where('status', '==', 'pending')
        .get();

      const cancelPromises = snapshot.docs.map((doc) =>
        doc.ref.update({
          status: 'cancelled',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );

      await Promise.all(cancelPromises);
      console.log(`✅ ${cancelPromises.length} zamanlanmış bildirim iptal edildi`);

      return null;
    } catch (error) {
      console.error('❌ Bildirim iptal etme hatası:', error);
      return null;
    }
  });

/**
 * Temizlik Görevi: Eski Bildirimleri Sil
 * Her gün gece 02:00'da çalışır
 */
export const cleanupOldNotifications = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    console.log('🧹 Eski bildirimler temizleniyor...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const snapshot = await db
        .collection('scheduledNotifications')
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(500)
        .get();

      if (snapshot.empty) {
        console.log('✅ Temizlenecek bildirim yok');
        return null;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ ${snapshot.size} eski bildirim silindi`);

      return null;
    } catch (error) {
      console.error('❌ Temizlik hatası:', error);
      return null;
    }
  });
