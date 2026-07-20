/**
 * 🔥 FIREBASE FUNCTIONS - REZERVASYON FİYAT DOĞRULAMA
 * 
 * ✅ GÜVENLİK: Tüm rezervasyon fiyatları backend'de doğrulanır
 * Client-side manipülasyon engellenir
 * 
 * @author Kiro AI Security Team
 * @date 2026
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Rezervasyon fiyatını doğrula ve kaydet
 * 
 * ✅ GÜVENLİK:
 * - Auth kontrolü
 * - App Check kontrolü (bot koruması)
 * - Rate limiting (spam koruması)
 * - Fiyat backend'de hesaplanır
 * - Client-side fiyat manipülasyonu engellenir
 * 
 * @updated 2026-07-20
 */
export const createReservationWithValidation = functions
  .region('europe-west1')
  .runWith({ 
    memory: '512MB', 
    timeoutSeconds: 60,
    // ✅ KRİTİK: App Check zorunlu kıl (bot koruması)
    enforceAppCheck: true,
  })
  .https.onCall(async (data: any, context) => {
    // ✅ 1. AUTH KONTROLÜ
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı girişi gerekli');
    }

    // ✅ 2. APP CHECK KONTROLÜ (zaten enforceAppCheck ile zorunlu ama log için)
    if (!context.app) {
      console.error('🔴 App Check verification failed for user:', context.auth.uid);
      throw new functions.https.HttpsError('failed-precondition', 'App Check verification failed');
    }

    // ✅ 3. RATE LIMITING (Firestore tabanlı basit rate limiter)
    const userId = context.auth.uid;
    const rateLimitRef = db.collection('rateLimits').doc(userId);
    const rateLimitDoc = await rateLimitRef.get();
    
    if (rateLimitDoc.exists) {
      const data = rateLimitDoc.data();
      const lastRequest = data?.lastReservationRequest || 0;
      const requestCount = data?.reservationCount || 0;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      // 1 saat içinde 10'dan fazla rezervasyon denemesi
      if (now - lastRequest < oneHour && requestCount >= 10) {
        console.warn('🚫 Rate limit exceeded:', { userId, count: requestCount });
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Çok fazla rezervasyon denemesi. Lütfen 1 saat sonra tekrar deneyin.'
        );
      }
      
      // Sayacı güncelle
      await rateLimitRef.set({
        lastReservationRequest: now,
        reservationCount: (now - lastRequest < oneHour) ? requestCount + 1 : 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // İlk istek
      await rateLimitRef.set({
        lastReservationRequest: Date.now(),
        reservationCount: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // ✅ 4. USER ID DOĞRULAMA
    if (data.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Yetkiniz yok');
    }

    try {
      let validatedPrice = 0;
      
      // ✅ 5. FİYAT DOĞRULAMA - TİP BAZLI
      switch (data.type) {
        case 'slot': {
          // Servis ID'lerinden fiyatları çek
          const serviceIds = data.services.map((s: any) => s.id);
          const servicesSnapshot = await db.collection('services')
            .where(admin.firestore.FieldPath.documentId(), 'in', serviceIds)
            .get();
          
          validatedPrice = servicesSnapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().price || 0);
          }, 0);
          
          // Client-side fiyat ile karşılaştır
          if (Math.abs(validatedPrice - data.totalPrice) > 0.01) {
            console.warn('Price mismatch detected:', {
              client: data.totalPrice,
              server: validatedPrice
            });
          }
          break;
        }
        
        case 'nightly': {
          // Paket fiyatını çek
          if (!data._packageId) {
            throw new functions.https.HttpsError('invalid-argument', 'Paket ID gerekli');
          }
          
          // Salon dokümanından paket bilgisini al
          const salonDoc = await db.collection('salons').doc(data.businessId).get();
          const salonData = salonDoc.data();
          
          if (!salonData) {
            throw new functions.https.HttpsError('not-found', 'İşletme bulunamadı');
          }
          
          // Paket fiyatını bul
          const packageData = salonData.packages?.find((p: any) => p.id === data._packageId);
          if (!packageData) {
            throw new functions.https.HttpsError('not-found', 'Paket bulunamadı');
          }
          
          const roomPrice = packageData.price;
          const nights = data.nights || 1;
          
          // Ekstraları hesapla
          const extrasTotal = (data.extras || []).reduce((sum: number, extra: any) => {
            // Ekstra fiyatlarını da doğrula (salonData'dan)
            const validExtra = salonData.extras?.find((e: any) => e.id === extra.id);
            return sum + (validExtra?.price || 0);
          }, 0);
          
          validatedPrice = (roomPrice * nights) + extrasTotal;
          break;
        }
        
        case 'daily': {
          // Event paket fiyatını çek
          if (!data._packageId) {
            throw new functions.https.HttpsError('invalid-argument', 'Paket ID gerekli');
          }
          
          const salonDoc = await db.collection('salons').doc(data.businessId).get();
          const salonData = salonDoc.data();
          
          if (!salonData) {
            throw new functions.https.HttpsError('not-found', 'İşletme bulunamadı');
          }
          
          const packageData = salonData.packages?.find((p: any) => p.id === data._packageId);
          if (!packageData) {
            throw new functions.https.HttpsError('not-found', 'Paket bulunamadı');
          }
          
          const packagePrice = packageData.price;
          
          // Ekstraları hesapla
          const extrasTotal = (data.extras || []).reduce((sum: number, extra: any) => {
            const validExtra = salonData.extras?.find((e: any) => e.id === extra.id);
            return sum + (validExtra?.price || 0);
          }, 0);
          
          validatedPrice = packagePrice + extrasTotal;
          break;
        }
        
        case 'project': {
          // Proje paket fiyatını çek
          if (!data._packageId) {
            throw new functions.https.HttpsError('invalid-argument', 'Paket ID gerekli');
          }
          
          const salonDoc = await db.collection('salons').doc(data.businessId).get();
          const salonData = salonDoc.data();
          
          if (!salonData) {
            throw new functions.https.HttpsError('not-found', 'İşletme bulunamadı');
          }
          
          const packageData = salonData.packages?.find((p: any) => p.id === data._packageId);
          if (!packageData) {
            throw new functions.https.HttpsError('not-found', 'Paket bulunamadı');
          }
          
          validatedPrice = packageData.price;
          break;
        }
        
        case 'order': {
          // Sipariş item'larını doğrula
          // Menu item'larını çek (salonData'dan veya ayrı collection'dan)
          const salonDoc = await db.collection('salons').doc(data.businessId).get();
          const salonData = salonDoc.data();
          
          if (!salonData) {
            throw new functions.https.HttpsError('not-found', 'İşletme bulunamadı');
          }
          
          validatedPrice = data.items.reduce((sum: number, item: any) => {
            // Item fiyatını doğrula
            const validItem = salonData.menuItems?.find((m: any) => m.id === item.id);
            if (!validItem) {
              throw new functions.https.HttpsError('not-found', `Item bulunamadı: ${item.id}`);
            }
            return sum + (validItem.price * item.quantity);
          }, 0);
          break;
        }
        
        default:
          throw new functions.https.HttpsError('invalid-argument', 'Geçersiz rezervasyon tipi');
      }
      
      // ✅ 4. KAPORA HESAPLAMA (Salon ayarlarından)
      let depositInfo = {
        required: false,
        percentage: 0,
        amount: 0
      };

      // Salon ayarlarını al
      const salonDoc = await db.collection('salons').doc(data.businessId).get();
      const salonData = salonDoc.data();
      
      // ✅ IBAN kontrolü: Kapora sistemi için IBAN şart
      const hasValidIBAN = salonData?.paymentSettings?.bankTransferEnabled && 
                           salonData?.paymentSettings?.bankAccounts &&
                           salonData.paymentSettings.bankAccounts.length > 0 &&
                           salonData.paymentSettings.bankAccounts.some((acc: any) => 
                             acc.iban && acc.iban.trim().length > 0
                           );
      
      // Kapora ayarları varsa ve IBAN varsa
      if (hasValidIBAN && salonData?.paymentSettings?.depositSettings?.enabled) {
        const settings = salonData.paymentSettings.depositSettings;
        
        // Minimum tutar kontrolü
        if (!settings.minimumReservationAmount || validatedPrice >= settings.minimumReservationAmount) {
          if (settings.type === 'percentage') {
            depositInfo.percentage = settings.amount;
            depositInfo.amount = Math.round(validatedPrice * (settings.amount / 100));
          } else {
            depositInfo.amount = settings.amount;
            depositInfo.percentage = Math.round((settings.amount / validatedPrice) * 100);
          }
          depositInfo.required = true;
        }
      }

      // ✅ 5. REZERVASYON OLUŞTUR (validated price ve deposit bilgisi ile)
      const reservationData = {
        ...data,
        totalPrice: validatedPrice, // ✅ Backend-validated price
        pricing: {
          basePrice: validatedPrice,
          extrasTotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: validatedPrice,
          depositRequired: depositInfo.required,
          depositAmount: depositInfo.amount,
          depositPercentage: depositInfo.percentage,
          finalAmount: validatedPrice - depositInfo.amount,
          currency: 'TRY'
        },
        priceValidated: true,
        priceValidatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // _requiresPriceValidation gibi internal flagları kaldır
      delete reservationData._requiresPriceValidation;
      delete reservationData._packageId;
      
      const reservationRef = await db.collection('reservations').add(reservationData);
      
      console.log('Reservation created with validated price:', {
        id: reservationRef.id,
        clientPrice: data.totalPrice,
        validatedPrice,
        depositRequired: depositInfo.required,
        depositAmount: depositInfo.amount,
        type: data.type
      });
      
      return {
        success: true,
        reservationId: reservationRef.id,
        validatedPrice,
        message: 'Rezervasyon başarıyla oluşturuldu'
      };
      
    } catch (error: any) {
      console.error('Reservation validation error:', error);
      throw new functions.https.HttpsError('internal', error.message || 'Rezervasyon oluşturulamadı');
    }
  });

/**
 * Rezervasyon oluşturulduğunda trigger - Otomatik onay kontrolü
 */
export const onReservationCreated = functions
  .region('europe-west1')
  .firestore
  .document('reservations/{reservationId}')
  .onCreate(async (snap, context) => {
    const reservation = snap.data();
    
    // ✅ GÜVENLİK: Fiyat doğrulanmamış rezervasyonları reddet
    if (!reservation.priceValidated) {
      console.warn('Unvalidated reservation detected:', context.params.reservationId);
      
      // Status'ü rejected yap
      await snap.ref.update({
        status: 'rejected',
        rejectionReason: 'Fiyat doğrulaması yapılmadı',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return;
    }
    
    // Otomatik onay kategorileri (kuaför, berber vs.)
    const autoApproveCategories = ['kuafor', 'berber', 'guzellik', 'tirnak'];
    
    if (autoApproveCategories.includes(reservation.businessCategory)) {
      await snap.ref.update({
        status: 'confirmed',
        confirmedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await snap.ref.update({
        status: 'pending'
      });
    }
  });

/**
 * Scheduled: Expired pending reservations cleanup
 * Her gün çalışır ve 7 günden eski pending rezervasyonları iptal eder
 */
export const cleanupExpiredReservations = functions
  .region('europe-west1')
  .pubsub.schedule('every 24 hours')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const expiredReservations = await db
      .collection('reservations')
      .where('status', '==', 'pending')
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();
    
    const batch = db.batch();
    
    expiredReservations.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'cancelled',
        cancellationReason: 'Pending timeout (7 days)',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    console.log(`Cleaned up ${expiredReservations.size} expired reservations`);
  });
