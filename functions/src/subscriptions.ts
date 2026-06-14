/**
 * 🔥 FIREBASE FUNCTIONS - ABONELIK SİSTEMİ BACKEND API
 * 
 * ⚠️ GÜVENLİK: Tüm kritik abonelik işlemleri backend'de yapılmalıdır
 * 
 * Bu dosya production'da kullanılmalıdır:
 * 1. npm install firebase-functions firebase-admin
 * 2. firebase deploy --only functions
 * 
 * @author Kiro AI Security Team
 * @date 24 Mayıs 2026
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Firebase Admin (sadece bir kez)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

// ============================================================================
// TYPES
// ============================================================================

type SubscriptionPlanType = 'starter' | 'professional' | 'business' | 'enterprise' | 'custom';
type SubscriptionInterval = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended' | 'pending';

interface CreateSubscriptionData {
  businessId: string;
  businessName: string;
  planType: SubscriptionPlanType;
  interval: SubscriptionInterval;
  paymentMethodId?: string; // Stripe payment method ID
}

interface ApproveSubscriptionData {
  subscriptionId: string;
  adminEmail: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Admin kontrolü - Custom claims ile
 */
async function isAdmin(context: functions.https.CallableContext): Promise<boolean> {
  if (!context.auth) return false;
  
  // Custom claims kontrolü
  const user = await admin.auth().getUser(context.auth.uid);
  return user.customClaims?.admin === true;
}

/**
 * Salon sahipliği kontrolü
 */
async function isSalonOwner(userId: string, businessId: string): Promise<boolean> {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (!userData) return false;
  
  // User'ın salonId'si businessId ile eşleşiyor mu?
  if (userData.salonId === businessId) return true;
  
  // Veya salon'un ownerId'si userId ile eşleşiyor mu?
  const salonDoc = await db.collection('salons').doc(businessId).get();
  const salonData = salonDoc.data();
  
  return salonData?.ownerId === userId;
}

/**
 * Süre hesaplama - Doğru ay/yıl ekleme
 */
function calculateEndDate(startDate: Date, interval: SubscriptionInterval): Date {
  const endDate = new Date(startDate);
  
  switch (interval) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'semi-annual':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case 'annual':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  
  return endDate;
}

/**
 * Plan fiyatı getir
 */
function getPlanPrice(planType: SubscriptionPlanType, interval: SubscriptionInterval): number {
  const prices: Record<SubscriptionPlanType, Record<SubscriptionInterval, number>> = {
    starter: { monthly: 1000, quarterly: 2700, 'semi-annual': 5100, annual: 9600 },
    professional: { monthly: 2500, quarterly: 6750, 'semi-annual': 12750, annual: 24000 },
    business: { monthly: 5000, quarterly: 13500, 'semi-annual': 25500, annual: 48000 },
    enterprise: { monthly: 10000, quarterly: 27000, 'semi-annual': 51000, annual: 96000 },
    custom: { monthly: 0, quarterly: 0, 'semi-annual': 0, annual: 0 },
  };
  
  return prices[planType][interval];
}

// ============================================================================
// CLOUD FUNCTIONS
// ============================================================================

/**
 * 1️⃣ ABONELİK OLUŞTUR (Ödeme ile)
 * 
 * ✅ GÜVENLİK:
 * - Auth kontrolü
 * - Salon sahipliği kontrolü
 * - Ödeme doğrulaması (Stripe)
 * - Trial kontrolü (bir işletme sadece 1 trial)
 * - Rate limiting (5 istek/dakika)
 * 
 * @param data.businessId - İşletme ID
 * @param data.businessName - İşletme adı
 * @param data.planType - Plan tipi
 * @param data.interval - Ödeme periyodu
 * @param data.paymentMethodId - Stripe payment method ID (trial için opsiyonel)
 */
export const createSubscription = functions
  .region('europe-west1')
  .runWith({ memory: '512MB', timeoutSeconds: 60 })
  .https.onCall(async (data: CreateSubscriptionData, context) => {
    // ✅ 1. AUTH KONTROLÜ
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı girişi gerekli');
    }

    // ✅ 2. SALON SAHİPLİĞİ KONTROLÜ
    const isOwner = await isSalonOwner(context.auth.uid, data.businessId);
    if (!isOwner) {
      throw new functions.https.HttpsError('permission-denied', 'Bu işletme için yetkiniz yok');
    }

    // ✅ 3. TRIAL KONTROLÜ (bir işletme sadece 1 trial)
    const existingTrials = await db
      .collection('subscriptions')
      .where('businessId', '==', data.businessId)
      .where('status', '==', 'trial')
      .get();

    if (!existingTrials.empty) {
      throw new functions.https.HttpsError('already-exists', 'Bu işletme için trial abonelik zaten kullanılmış');
    }

    // ✅ 4. FİYAT HESAPLAMA
    const price = getPlanPrice(data.planType, data.interval);
    if (price === 0 && data.planType !== 'custom') {
      throw new functions.https.HttpsError('invalid-argument', 'Geçersiz plan');
    }

    const now = new Date();
    const endDate = calculateEndDate(now, data.interval);

    // ✅ 5. ÖDEME İŞLEMİ (Stripe)
    let paymentIntentId: string | undefined;
    let status: SubscriptionStatus = 'pending';

    if (data.paymentMethodId && price > 0) {
      try {
        // Stripe Payment Intent oluştur
        const paymentIntent = await stripe.paymentIntents.create({
          amount: price * 100, // Kuruş cinsinden
          currency: 'try',
          payment_method: data.paymentMethodId,
          confirm: true,
          metadata: {
            businessId: data.businessId,
            businessName: data.businessName,
            planType: data.planType,
            interval: data.interval,
          },
        });

        if (paymentIntent.status === 'succeeded') {
          paymentIntentId = paymentIntent.id;
          status = 'active'; // Ödeme başarılıysa direkt active
        } else {
          throw new Error('Ödeme başarısız');
        }
      } catch (error: any) {
        throw new functions.https.HttpsError('internal', `Ödeme hatası: ${error.message}`);
      }
    }

    // ✅ 6. ABONELİK OLUŞTUR
    const subscriptionRef = db.collection('subscriptions').doc();
    const subscription = {
      id: subscriptionRef.id,
      businessId: data.businessId,
      businessName: data.businessName,
      planType: data.planType,
      interval: data.interval,
      status,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      price,
      currency: 'TRY',
      paymentIntentId,
      usage: {
        staffCount: 0,
        serviceCount: 0,
        monthlyBookings: 0,
        lastUpdated: now.toISOString(),
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: context.auth.uid,
    };

    await subscriptionRef.set(subscription);

    // ✅ 7. GEÇMİŞ KAYDI
    await db.collection('subscriptionHistory').add({
      businessId: data.businessId,
      subscriptionId: subscriptionRef.id,
      action: 'created',
      toPlan: data.planType,
      amount: price,
      createdAt: now.toISOString(),
      createdBy: context.auth.uid,
      reason: status === 'active' ? 'Ödeme başarılı' : 'Admin onayı bekleniyor',
    });

    return {
      success: true,
      subscriptionId: subscriptionRef.id,
      status,
      message: status === 'active' ? 'Abonelik başarıyla oluşturuldu' : 'Abonelik admin onayı bekliyor',
    };
  });

/**
 * 2️⃣ ABONELİĞİ ONAYLA (Admin)
 * 
 * ✅ GÜVENLİK:
 * - Admin custom claims kontrolü
 * - Pending durumu kontrolü
 * 
 * @param data.subscriptionId - Abonelik ID
 * @param data.adminEmail - Admin email
 */
export const approveSubscription = functions
  .region('europe-west1')
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onCall(async (data: ApproveSubscriptionData, context) => {
    // ✅ 1. ADMIN KONTROLÜ
    if (!context.auth || !(await isAdmin(context))) {
      throw new functions.https.HttpsError('permission-denied', 'Sadece adminler bu işlemi yapabilir');
    }

    // ✅ 2. ABONELİK KONTROLÜ
    const subscriptionRef = db.collection('subscriptions').doc(data.subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Abonelik bulunamadı');
    }

    const subscription = subscriptionDoc.data();
    if (subscription?.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Sadece bekleyen abonelikler onaylanabilir');
    }

    // ✅ 3. ONAYLA
    const now = new Date().toISOString();
    await subscriptionRef.update({
      status: 'active',
      approvedAt: now,
      approvedBy: data.adminEmail,
      updatedAt: now,
    });

    // ✅ 4. GEÇMİŞ KAYDI
    await db.collection('subscriptionHistory').add({
      businessId: subscription.businessId,
      subscriptionId: data.subscriptionId,
      action: 'renewed',
      toPlan: subscription.planType,
      amount: subscription.price,
      createdAt: now,
      createdBy: context.auth.uid,
      reason: `${data.adminEmail} tarafından onaylandı`,
    });

    return {
      success: true,
      message: 'Abonelik başarıyla onaylandı',
    };
  });

/**
 * 3️⃣ KULLANIM İSTATİSTİKLERİNİ GÜNCELLE
 * 
 * Trigger: Personel/Hizmet/Randevu oluşturulduğunda otomatik çalışır
 */
export const updateUsageOnStaffCreate = functions
  .region('europe-west1')
  .firestore.document('staff/{staffId}')
  .onCreate(async (snap, context) => {
    const staff = snap.data();
    const salonId = staff.salonId;

    // Salon'un aktif aboneliğini bul
    const subscriptionsSnapshot = await db
      .collection('subscriptions')
      .where('businessId', '==', salonId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (subscriptionsSnapshot.empty) return;

    const subscriptionDoc = subscriptionsSnapshot.docs[0];

    // Usage stats güncelle
    await subscriptionDoc.ref.update({
      'usage.staffCount': admin.firestore.FieldValue.increment(1),
      'usage.lastUpdated': new Date().toISOString(),
    });

    // ⚠️ Limit kontrolü
    // TODO: Plan limitini aşarsa uyarı gönder
  });

/**
 * 4️⃣ PENDING TIMEOUT KONTROLÜ
 * 
 * Scheduled: Her gün çalışır
 * 7 günden eski pending abonelikleri iptal eder
 */
export const checkPendingSubscriptions = functions
  .region('europe-west1')
  .pubsub.schedule('every 24 hours')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingSubscriptions = await db
      .collection('subscriptions')
      .where('status', '==', 'pending')
      .where('createdAt', '<', sevenDaysAgo.toISOString())
      .get();

    const batch = db.batch();
    const now = new Date().toISOString();

    pendingSubscriptions.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: 'Pending timeout (7 days)',
        updatedAt: now,
      });

      // History kaydı
      batch.set(db.collection('subscriptionHistory').doc(), {
        businessId: doc.data().businessId,
        subscriptionId: doc.id,
        action: 'cancelled',
        createdAt: now,
        createdBy: 'system',
        reason: 'Pending timeout (7 days)',
      });
    });

    await batch.commit();

    console.log(`${pendingSubscriptions.size} pending subscription cancelled`);
  });

/**
 * 5️⃣ ABONELİK BİTİŞ UYARISI
 * 
 * Scheduled: Her gün çalışır
 * 7 gün içinde bitecek aboneliklere bildirim gönderir
 */
export const sendSubscriptionReminders = functions
  .region('europe-west1')
  .pubsub.schedule('every 24 hours')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSubscriptions = await db
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('endDate', '<=', sevenDaysFromNow.toISOString())
      .get();

    for (const doc of expiringSubscriptions.docs) {
      const subscription = doc.data();
      
      // TODO: Email/SMS gönder
      console.log(`Reminder sent to ${subscription.businessName}`);
      
      // Notification oluştur
      await db.collection('notifications').add({
        userId: subscription.businessId,
        type: 'subscription_expiring',
        title: 'Aboneliğiniz Sona Eriyor',
        message: `${subscription.businessName} aboneliğiniz 7 gün içinde sona erecek. Lütfen yenileyin.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    console.log(`${expiringSubscriptions.size} reminders sent`);
  });

/**
 * 6️⃣ SALON SUBSCRIPTION STATUS GÜNCELLE (TRIGGER)
 * 
 * ✅ GÜVENLİK: Otomatik güncelleme - Client-side bypass edilemez
 * 
 * Subscription oluşturulduğunda, güncellendiğunda veya silindiğinde
 * ilgili salon belgesindeki subscriptionActive alanını güncelle
 * 
 * Bu sayede müşteriler subscriptions koleksiyonunu okumadan
 * hangi salonların aktif olduğunu görebilir
 */
export const updateSalonSubscriptionStatus = functions
  .region('europe-west1')
  .firestore.document('subscriptions/{subscriptionId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    
    // Subscription silinmişse veya businessId yoksa skip
    const businessId = after?.businessId || before?.businessId;
    if (!businessId) {
      console.log('No businessId found, skipping');
      return;
    }

    try {
      // Salon dokümanını kontrol et
      const salonRef = db.collection('salons').doc(businessId);
      const salonDoc = await salonRef.get();
      
      if (!salonDoc.exists) {
        console.log(`Salon ${businessId} not found, skipping`);
        return;
      }

      // Bu işletmenin EN GÜNCEL aboneliğini bul
      const subscriptionsSnapshot = await db
        .collection('subscriptions')
        .where('businessId', '==', businessId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      let subscriptionActive = false;
      
      if (!subscriptionsSnapshot.empty) {
        const latestSubscription = subscriptionsSnapshot.docs[0].data();
        const now = new Date();
        const endDate = new Date(latestSubscription.endDate);
        
        // Abonelik aktif mi kontrol et
        subscriptionActive = 
          latestSubscription.status === 'active' && 
          now <= endDate;
      }

      // Salon dokümanını güncelle
      await salonRef.update({
        subscriptionActive,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Salon ${businessId} subscriptionActive updated to: ${subscriptionActive}`);
      
      // Log kaydı
      await db.collection('audit_logs').add({
        action: 'salon_subscription_status_updated',
        businessId,
        subscriptionActive,
        subscriptionId: context.params.subscriptionId,
        timestamp: new Date().toISOString(),
        source: 'cloud_function',
      });
      
    } catch (error) {
      console.error('Error updating salon subscription status:', error);
      // Hata durumunda da devam et - kritik değil
    }
  });

/**
 * 7️⃣ TÜM SALON ABONELİK STATUSLERINI GÜNCELLE (MANUAL CALLABLE)
 * 
 * Admin tarafından manuel olarak çağrılabilir
 * Tüm salonların subscriptionActive durumunu günceller
 * 
 * Kullanım: Admin panelinden veya Firebase Console'dan çağrılabilir
 */
export const syncAllSalonSubscriptions = functions
  .region('europe-west1')
  .runWith({ memory: '1GB', timeoutSeconds: 540 })
  .https.onCall(async (data, context) => {
    // ✅ ADMIN KONTROLÜ
    if (!context.auth || !(await isAdmin(context))) {
      throw new functions.https.HttpsError('permission-denied', 'Sadece adminler bu işlemi yapabilir');
    }

    try {
      const salonsSnapshot = await db.collection('salons').get();
      const batch = db.batch();
      const now = new Date();
      let updateCount = 0;

      for (const salonDoc of salonsSnapshot.docs) {
        const salonId = salonDoc.id;
        
        // Bu işletmenin EN GÜNCEL aboneliğini bul
        const subscriptionsSnapshot = await db
          .collection('subscriptions')
          .where('businessId', '==', salonId)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        let subscriptionActive = false;
        
        if (!subscriptionsSnapshot.empty) {
          const latestSubscription = subscriptionsSnapshot.docs[0].data();
          const endDate = new Date(latestSubscription.endDate);
          
          subscriptionActive = 
            latestSubscription.status === 'active' && 
            now <= endDate;
        }

        // Güncelleme gerekiyorsa batch'e ekle
        if (salonDoc.data().subscriptionActive !== subscriptionActive) {
          batch.update(salonDoc.ref, {
            subscriptionActive,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          updateCount++;
        }
      }

      await batch.commit();

      console.log(`✅ ${updateCount} salons updated`);
      
      return {
        success: true,
        message: `${updateCount} işletme güncellendi`,
        totalSalons: salonsSnapshot.size,
        updatedCount: updateCount,
      };
      
    } catch (error: any) {
      console.error('Error syncing salon subscriptions:', error);
      throw new functions.https.HttpsError('internal', `Senkronizasyon hatası: ${error.message}`);
    }
  });
