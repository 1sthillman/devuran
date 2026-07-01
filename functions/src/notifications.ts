import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Bildirim oluşturulduğunda ilgili kullanıcılara push notification gönder
 * 
 * Trigger: restaurantNotifications koleksiyonuna yeni belge eklendiğinde
 */
export const sendPushNotificationOnCreate = functions
  .region('europe-west1')
  .firestore
  .document('restaurantNotifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const notification = snapshot.data();
    const { restaurantId, type, message, tableName } = notification;

    console.log('📬 Yeni bildirim oluşturuldu:', {
      notificationId: context.params.notificationId,
      restaurantId,
      type,
      message
    });

    try {
      // Restoran personelini bul
      const staffQuery = await admin.firestore()
        .collection('restaurantStaff')
        .where('restaurantId', '==', restaurantId)
        .where('isActive', '==', true)
        .get();

      if (staffQuery.empty) {
        console.log('⚠️ Aktif personel bulunamadı');
        return null;
      }

      // Her personel için token'ları topla
      const tokens: string[] = [];
      const staffIds: string[] = [];

      for (const staffDoc of staffQuery.docs) {
        const staff = staffDoc.data();
        
        // Bildirim tipine göre sadece ilgili rollere gönder
        const shouldReceive = checkIfRoleShouldReceive(type, staff.role);
        
        if (!shouldReceive) {
          console.log(`⏭️ ${staff.name} (${staff.role}) bu bildirimi almayacak`);
          continue;
        }

        // User dokümanından FCM token'ı al
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(staff.userId || staffDoc.id)
          .get();

        const userData = userDoc.data();
        if (userData?.fcmToken && userData?.notificationsEnabled) {
          tokens.push(userData.fcmToken);
          staffIds.push(staffDoc.id);
          console.log(`✅ ${staff.name} (${staff.role}) bildirim alacak`);
        } else {
          console.log(`⚠️ ${staff.name} için token yok veya bildirimler kapalı`);
        }
      }

      if (tokens.length === 0) {
        console.log('⚠️ Bildirim gönderilecek token bulunamadı');
        return null;
      }

      // Bildirim içeriğini hazırla
      const notificationPayload = buildNotificationPayload(type, message, tableName);

      // Push notification gönder
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: notificationPayload.notification,
        data: {
          ...notificationPayload.data,
          notificationId: context.params.notificationId,
          restaurantId,
          type
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'restaurant_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        webpush: {
          notification: {
            requireInteraction: true,
            vibrate: [200, 100, 200]
          },
          fcmOptions: {
            link: `/restaurant/${restaurantId}/waiter`
          }
        }
      });

      console.log('✅ Push notification gönderildi:', {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length
      });

      // Başarısız token'ları temizle
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error(`❌ Token gönderimi başarısız: ${resp.error?.message}`);
          }
        });

        // Geçersiz token'ları Firestore'dan temizle
        for (let i = 0; i < failedTokens.length; i++) {
          const token = failedTokens[i];
          const staffId = staffIds[i];
          
          if (staffDoc) {
            await admin.firestore()
              .collection('users')
              .doc(staffId)
              .update({
                fcmToken: admin.firestore.FieldValue.delete(),
                notificationsEnabled: false
              });
            console.log(`🗑️ Geçersiz token temizlendi: ${staffId}`);
          }
        }
      }

      return { success: true, sent: response.successCount };

    } catch (error) {
      console.error('❌ Push notification gönderme hatası:', error);
      return null;
    }
  });

/**
 * Rol ve bildirim tipine göre bildirimin gönderilip gönderilmeyeceğini belirle
 */
function checkIfRoleShouldReceive(notificationType: string, role: string): boolean {
  switch (notificationType) {
    case 'waiter_call':
    case 'coal_request':
      return role === 'waiter' || role === 'owner';
    
    case 'bill_request':
      return role === 'cashier' || role === 'waiter' || role === 'owner';
    
    case 'new_order':
      return role === 'kitchen' || role === 'owner';
    
    case 'order_ready':
      return role === 'waiter' || role === 'owner';
    
    default:
      return role === 'owner'; // Bilinmeyen tipler sadece owner'a
  }
}

/**
 * Bildirim tipine göre payload oluştur
 */
function buildNotificationPayload(type: string, message: string, tableName?: string) {
  let title = '';
  let body = message;
  let icon = '🔔';

  switch (type) {
    case 'waiter_call':
      title = `📞 Masa ${tableName} - Garson Çağırıyor`;
      icon = '📞';
      break;
    
    case 'coal_request':
      title = `🔥 Masa ${tableName} - Köz İstiyor`;
      icon = '🔥';
      break;
    
    case 'bill_request':
      title = `💳 Masa ${tableName} - Hesap İstiyor`;
      icon = '💳';
      break;
    
    case 'new_order':
      title = `🍽️ Yeni Sipariş - Masa ${tableName}`;
      icon = '🍽️';
      break;
    
    case 'order_ready':
      title = `✅ Sipariş Hazır - Masa ${tableName}`;
      icon = '✅';
      break;
    
    default:
      title = 'Yeni Bildirim';
  }

  return {
    notification: {
      title,
      body,
      icon: '/favicon.svg'
    },
    data: {
      type,
      message,
      tableName: tableName || '',
      icon
    }
  };
}

/**
 * Manuel push notification gönderme fonksiyonu (test için)
 */
export const sendTestNotification = functions
  .region('europe-west1')
  .https
  .onCall(async (data, context) => {
    // Auth kontrolü
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı girişi gerekli');
    }

    const { userId, title, body } = data;

    try {
      // User'ın FCM token'ını al
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      const userData = userDoc.data();
      if (!userData?.fcmToken) {
        throw new functions.https.HttpsError('not-found', 'FCM token bulunamadı');
      }

      // Test bildirimi gönder
      await admin.messaging().send({
        token: userData.fcmToken,
        notification: {
          title: title || 'Test Bildirimi',
          body: body || 'Bu bir test bildirimidir'
        },
        data: {
          type: 'test',
          timestamp: Date.now().toString()
        }
      });

      return { success: true, message: 'Test bildirimi gönderildi' };

    } catch (error: any) {
      console.error('❌ Test bildirimi hatası:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });
