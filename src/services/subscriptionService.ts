import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import type {
  BusinessSubscription,
  SubscriptionHistory,
  SubscriptionPlanType,
  SubscriptionInterval,
  SubscriptionStatus,
  FeatureAccess,
  PlanFeatures,
} from '@/types/subscription';
import { SUBSCRIPTION_PLANS, TRIAL_PERIOD_DAYS } from '@/config/subscriptionPlans';

class SubscriptionService {
  private subscriptionsCollection = 'subscriptions';
  private historyCollection = 'subscriptionHistory';

  /**
   * Yeni işletme için trial abonelik oluştur
   * NOT: Bir işletme sadece 1 kez trial alabilir
   * 
   * ✅ CRITICAL FIX #12: Trial bypass prevention with permanent flag
   * Issue: Users could delete history records to bypass trial limit
   * Date: 2026-07-03
   */
  async createTrialSubscription(businessId: string, businessName: string): Promise<BusinessSubscription> {
    // ✅ GÜVENLİK: Subscription document kontrolü - trialUsed flag
    const existingDoc = await getDoc(doc(db, this.subscriptionsCollection, businessId));
    
    if (existingDoc.exists()) {
      const existingData = existingDoc.data();
      
      // ✅ CRITICAL: Permanent trialUsed flag kontrolü
      if (existingData?.trialUsed === true) {
        throw new Error('Bu işletme daha önce trial kullanmış. Lütfen ücretli plana geçin.');
      }
      
      // Legacy: Existing trial subscription check
      if (existingData?.status === 'trial') {
        throw new Error('Bu işletme için trial abonelik zaten kullanılmış');
      }
    }
    
    // ✅ DOUBLE CHECK: History kontrolü (secondary defense)
    const historyQuery = query(
      collection(db, this.historyCollection),
      where('businessId', '==', businessId),
      where('action', '==', 'created'),
      where('toPlan', '==', 'professional')
    );
    
    const historySnapshot = await getDocs(historyQuery);
    
    if (!historySnapshot.empty) {
      // History'de trial kaydı var - tekrar alamaz
      throw new Error('Bu işletme daha önce trial kullanmış (history). Lütfen ücretli plana geçin.');
    }

    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS); // GÜN bazlı ekleme (trial için uygun)

    const subscription: BusinessSubscription = {
      id: businessId, // ✅ DÜZELTME: ID = businessId
      businessId,
      businessName,
      planType: 'professional', // Trial'da Professional özellikleri ver
      interval: 'monthly',
      status: 'trial',
      startDate: now.toISOString(),
      endDate: trialEndDate.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      trialUsed: true, // ✅ CRITICAL: Permanent flag - never changes
      price: 0,
      currency: 'TRY',
      usage: {
        staffCount: 0,
        serviceCount: 0,
        monthlyBookings: 0,
        lastUpdated: now.toISOString(),
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await setDoc(doc(db, this.subscriptionsCollection, subscription.id), subscription);

    // Geçmiş kaydı oluştur
    await this.addHistory(businessId, subscription.id, 'created', undefined, 'professional', 0, `${TRIAL_PERIOD_DAYS} günlük trial başlatıldı`);
    
    // ✅ Salon subscriptionActive güncelle (trial aktif olduğu sürece true)
    try {
      await updateDoc(doc(db, 'salons', businessId), {
        subscriptionActive: true,
        subscriptionTrialEnd: trialEndDate.toISOString(),
        updatedAt: now.toISOString(),
      });
      console.log(`✅ Salon subscriptionActive = true (Trial: ${TRIAL_PERIOD_DAYS} gün)`);
    } catch (error) {
      console.error('⚠️ Could not update salon subscriptionActive:', error);
      // Salon güncellenemese bile devam et
    }

    return subscription;
  }

  /**
   * İşletmenin aboneliğini getir
   * NOT: Index hazır olana kadar client-side sıralama kullanılıyor
   */
  async getBusinessSubscription(businessId: string): Promise<BusinessSubscription | null> {
    try {
      // ✅ DÜZELTME: Artık ID = businessId olduğu için direkt getDoc kullanıyoruz
      const docRef = doc(db, this.subscriptionsCollection, businessId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return docSnap.data() as BusinessSubscription;
    } catch (error: any) {
      console.error('Error getting business subscription:', error);
      throw error;
    }
  }

  /**
   * Abonelik durumunu kontrol et ve güncelle
   */
  async checkAndUpdateSubscriptionStatus(businessId: string): Promise<SubscriptionStatus> {
    const subscription = await this.getBusinessSubscription(businessId);
    if (!subscription) return 'expired';

    const now = new Date();
    const endDate = new Date(subscription.endDate);

    // Süre dolmuşsa
    if (now > endDate) {
      if (subscription.status !== 'expired') {
        await this.updateSubscriptionStatus(subscription.id, 'expired');
        await this.addHistory(businessId, subscription.id, 'expired', subscription.planType, subscription.planType, 0, 'Abonelik süresi doldu');
        
        // ✅ Salon subscriptionActive FALSE yap (süre doldu)
        try {
          await updateDoc(doc(db, 'salons', businessId), {
            subscriptionActive: false,
            updatedAt: now.toISOString(),
          });
          console.log('✅ Salon subscriptionActive = false (Subscription expired)');
        } catch (error) {
          console.error('⚠️ Could not update salon subscriptionActive:', error);
        }
      }
      return 'expired';
    }

    return subscription.status;
  }

  /**
   * Abonelik satın al veya yenile
   * NOT: TÜM abonelik işlemleri 'pending' durumunda başlar ve admin onayı gerektirir
   * Yenileme yapılırsa mevcut sürenin üzerine eklenir (onaylandıktan sonra)
   * 
   * ✅ GÜVENLİK: Custom price kaldırıldı - sadece plan fiyatları kullanılır
   * Production'da Firebase Functions ile backend'e taşınmalı
   * Ödeme entegrasyonu (Stripe/Iyzico) eklenmelidir
   */
  async purchaseSubscription(
    businessId: string,
    businessName: string,
    planType: SubscriptionPlanType,
    interval: SubscriptionInterval
  ): Promise<BusinessSubscription> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planType);
    if (!plan) throw new Error('Geçersiz plan');

    const currentSubscription = await this.getBusinessSubscription(businessId);
    const now = new Date();
    
    // ✅ GÜVENLİK: Fiyat SADECE plan tanımından alınır (client manipülasyonu engellendi)
    const price = plan.pricing[interval];
    
    // Başlangıç ve bitiş tarihleri hesapla
    let startDate: Date;
    let endDate: Date;
    
    // Eğer mevcut aktif abonelik varsa ve süresi dolmamışsa, üzerine ekle
    if (currentSubscription && currentSubscription.status === 'active') {
      const currentEndDate = new Date(currentSubscription.endDate);
      const isExpired = now > currentEndDate;
      
      if (!isExpired) {
        // Mevcut sürenin üzerine ekle
        startDate = currentEndDate;
        endDate = new Date(currentEndDate);
      } else {
        // Süresi dolmuşsa bugünden başlat
        startDate = now;
        endDate = new Date(now);
      }
    } else {
      // Yeni abonelik veya süresi dolmuş - bugünden başlat
      startDate = now;
      endDate = new Date(now);
    }
    
    // Periyoda göre süre ekle (AY/YIL bazlı hesaplama - DOĞRU)
    switch (interval) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1); // 1 ay
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3); // 3 ay
        break;
      case 'semi-annual':
        endDate.setMonth(endDate.getMonth() + 6); // 6 ay
        break;
      case 'annual':
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 yıl
        break;
    }

    // ⚠️ TÜM ABONELIKLER PENDING DURUMUNDA BAŞLAR (Admin onayı gerekir)
    const status: SubscriptionStatus = 'pending';

    const subscription: BusinessSubscription = {
      id: businessId, // ✅ DÜZELTME: ID = businessId (her business'in 1 subscription'ı var)
      businessId,
      businessName,
      planType,
      interval,
      status,
      startDate: currentSubscription?.startDate || startDate.toISOString(), // İlk başlangıç tarihini koru
      endDate: endDate.toISOString(),
      price,
      currency: 'TRY',
      lastPaymentDate: now.toISOString(),
      lastPaymentAmount: price,
      nextPaymentDate: endDate.toISOString(),
      usage: currentSubscription?.usage || {
        staffCount: 0,
        serviceCount: 0,
        monthlyBookings: 0,
        lastUpdated: now.toISOString(),
      },
      createdAt: currentSubscription?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    try {
      await setDoc(doc(db, this.subscriptionsCollection, subscription.id), subscription);
    } catch (error) {
      console.error('Error creating subscription document:', error);
      throw error;
    }

    // Geçmiş kaydı
    const action = currentSubscription ? 'renewed' : 'created';
    const daysAdded = interval === 'monthly' ? 30 : interval === 'quarterly' ? 90 : interval === 'semi-annual' ? 180 : 365;
    const historyNote = currentSubscription 
      ? `${plan.name} planı yenileme talebi oluşturuldu (+${daysAdded} gün eklenecek) - Admin onayı bekleniyor`
      : `${plan.name} planı satın alma talebi oluşturuldu - Admin onayı bekleniyor`;
    
    await this.addHistory(
      businessId,
      subscription.id,
      action,
      currentSubscription?.planType,
      planType,
      price,
      historyNote
    );
    
    // ✅ Salon subscriptionActive FALSE yap (pending durumda görünmez)
    try {
      await updateDoc(doc(db, 'salons', businessId), {
        subscriptionActive: false,
        subscriptionPendingApproval: true,
        updatedAt: now.toISOString(),
      });
    } catch (error) {
      console.error('⚠️ Could not update salon subscriptionActive:', error);
    }

    return subscription;
  }

  /**
   * Plan yükselt/düşür
   * NOT: Plan değişikliği için admin onayı gerekir
   * Onaylanana kadar eski plan devam eder
   * 
   * ✅ GÜVENLİK: Custom price kaldırıldı
   */
  async changePlan(
    businessId: string,
    newPlanType: SubscriptionPlanType
  ): Promise<BusinessSubscription> {
    const subscription = await this.getBusinessSubscription(businessId);
    if (!subscription) throw new Error('Abonelik bulunamadı');

    const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanType);
    if (!newPlan) throw new Error('Geçersiz plan');

    const oldPlanType = subscription.planType;
    const price = newPlan.pricing[subscription.interval];

    // ⚠️ Plan değişikliği talebi oluştur (pending durumunda)
    // Gerçek değişiklik admin onayından sonra olacak
    const changeRequest = {
      requestedPlanType: newPlanType,
      requestedPrice: price,
      requestedAt: new Date().toISOString(),
      requestStatus: 'pending' as const,
    };

    // Aboneliği güncelle - sadece talep bilgisini ekle
    const updatedSubscription: BusinessSubscription = {
      ...subscription,
      // Mevcut plan değişmez, sadece talep kaydedilir
      pendingPlanChange: changeRequest,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, this.subscriptionsCollection, subscription.id), {
      pendingPlanChange: changeRequest,
      updatedAt: updatedSubscription.updatedAt,
    });

    // Geçmiş kaydı
    const action = this.comparePlans(oldPlanType, newPlanType) > 0 ? 'upgraded' : 'downgraded';
    await this.addHistory(
      businessId,
      subscription.id,
      action,
      oldPlanType,
      newPlanType,
      price,
      `Plan değişikliği talebi: ${oldPlanType} → ${newPlanType} (Admin onayı bekleniyor)`
    );

    return updatedSubscription;
  }

  /**
   * Admin: Plan değişikliği talebini onayla
   * 
   * ⚠️ GÜVENLİK UYARISI: Bu fonksiyon CLIENT-SIDE ÇALIŞMAZ!
   * Firebase Admin SDK kullanıyor (admin.firestore.FieldValue.delete)
   * Production'da Firebase Functions ile backend'e taşınmalı
   * 
   * TODO: Cloud Functions'a taşınmalı
   * TODO: Admin custom claims kontrolü yapılmalı
   */
  async approvePlanChange(businessId: string, adminEmail: string): Promise<void> {
    // ⚠️ Bu fonksiyon şu anda kullanılmamalı - backend'e taşınmalı
    throw new Error('Bu işlem şu anda desteklenmiyor. Lütfen admin panelinden yapın.');
  }

  /**
   * Admin: Plan değişikliği talebini reddet
   * 
   * ⚠️ GÜVENLİK UYARISI: Bu fonksiyon CLIENT-SIDE ÇALIŞMAZ!
   * Production'da Firebase Functions ile backend'e taşınmalı
   */
  async rejectPlanChange(businessId: string, adminEmail: string, reason: string): Promise<void> {
    // ⚠️ Bu fonksiyon şu anda kullanılmamalı - backend'e taşınmalı
    throw new Error('Bu işlem şu anda desteklenmiyor. Lütfen admin panelinden yapın.');
  }

  /**
   * Aboneliği iptal et
   */
  async cancelSubscription(businessId: string, reason?: string): Promise<void> {
    const subscription = await this.getBusinessSubscription(businessId);
    if (!subscription) throw new Error('Abonelik bulunamadı');

    const now = new Date().toISOString();

    await updateDoc(doc(db, this.subscriptionsCollection, subscription.id), {
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    });
    
    // ✅ Salon'un subscriptionActive alanını güncelle
    try {
      await updateDoc(doc(db, 'salons', businessId), {
        subscriptionActive: false,
        updatedAt: now,
      });
      console.log('✅ Salon subscriptionActive updated to false after cancellation');
    } catch (salonError) {
      console.error('⚠️ Could not update salon subscriptionActive:', salonError);
      // Salon güncellenemese bile devam et
    }

    await this.addHistory(
      businessId,
      subscription.id,
      'cancelled',
      subscription.planType,
      subscription.planType,
      0,
      reason || 'Abonelik iptal edildi'
    );
  }

  /**
   * Admin: Aboneliği onayla (pending -> active)
   * 
   * ⚠️ GÜVENLİK UYARISI: Bu fonksiyon CLIENT-SIDE ÇALIŞMAZ!
   * Production'da Firebase Functions ile backend'e taşınmalı
   * Admin custom claims kontrolü yapılmalı
   */
  async approveSubscription(businessId: string, adminEmail: string): Promise<void> {
    // ⚠️ Bu fonksiyon şu anda kullanılmamalı - backend'e taşınmalı
    throw new Error('Bu işlem şu anda desteklenmiyor. Lütfen admin panelinden yapın.');
  }

  /**
   * Admin: Aboneliği reddet
   * 
   * ⚠️ GÜVENLİK UYARISI: Bu fonksiyon CLIENT-SIDE ÇALIŞMAZ!
   * Production'da Firebase Functions ile backend'e taşınmalı
   */
  async rejectSubscription(businessId: string, adminEmail: string, reason: string): Promise<void> {
    // ⚠️ Bu fonksiyon şu anda kullanılmamalı - backend'e taşınmalı
    throw new Error('Bu işlem şu anda desteklenmiyor. Lütfen admin panelinden yapın.');
  }

  /**
   * Kullanım istatistiklerini güncelle
   * 
   * ✅ CRITICAL FIX #6: Atomic updates kullan
   * Issue: Race condition in concurrent usage updates
   * Date: 2026-07-03
   * 
   * @deprecated Use incrementUsageStat() for concurrent-safe updates
   */
  async updateUsageStats(
    businessId: string,
    stats: { staffCount?: number; serviceCount?: number; monthlyBookings?: number }
  ): Promise<void> {
    const subscription = await this.getBusinessSubscription(businessId);
    if (!subscription) return;

    // ⚠️ WARNING: This method is NOT concurrent-safe
    // Use incrementUsageStat() instead for atomic updates
    console.warn('[DEPRECATED] updateUsageStats: Use incrementUsageStat() for concurrent safety');

    const updatedUsage = {
      ...subscription.usage,
      ...stats,
      lastUpdated: new Date().toISOString(),
    };

    await updateDoc(doc(db, this.subscriptionsCollection, subscription.id), {
      usage: updatedUsage,
      updatedAt: new Date().toISOString(),
    });
  }
  
  /**
   * Kullanım istatistiklerini increment et (atomic)
   * 
   * ✅ CRITICAL FIX #6: Concurrent-safe counter updates
   * Issue: Race condition in subscription usage updates
   * Date: 2026-07-03
   * 
   * ✅ PREFERRED: Use this method instead of updateUsageStats()
   */
  async incrementUsageStat(
    businessId: string,
    field: 'staffCount' | 'serviceCount' | 'monthlyBookings',
    amount: number = 1
  ): Promise<void> {
    const subscription = await this.getBusinessSubscription(businessId);
    if (!subscription) return;

    // ✅ GÜVENLİK: Firestore FieldValue.increment() - atomik işlem
    const { increment } = await import('firebase/firestore');
    
    await updateDoc(doc(db, this.subscriptionsCollection, subscription.id), {
      [`usage.${field}`]: increment(amount),
      'usage.lastUpdated': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  /**
   * ✅ CRITICAL FIX #7: Monthly booking counter reset logic
   * Issue: Monthly bookings never reset, causing false limit errors
   * Date: 2026-07-03
   * 
   * This function checks if a new month has started and resets the counter
   * Should be called before checking booking limits
   */
  async checkAndResetMonthlyBookings(businessId: string): Promise<void> {
    const subscription = await this.getBusinessSubscription(businessId);
    if (!subscription) return;
    
    const lastReset = new Date(subscription.usage.lastResetDate || subscription.createdAt);
    const now = new Date();
    
    // ✅ Check if month changed
    if (now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()) {
      
      console.log(`[SUBSCRIPTION] Resetting monthly bookings for ${businessId}`, {
        lastReset: lastReset.toISOString(),
        now: now.toISOString(),
        oldCount: subscription.usage.monthlyBookings
      });
      
      await updateDoc(doc(db, this.subscriptionsCollection, businessId), {
        'usage.monthlyBookings': 0,
        'usage.lastResetDate': now.toISOString(),
        updatedAt: now.toISOString()
      });
    }
  }

  /**
   * Özellik erişim kontrolü
   */
  async checkFeatureAccess(businessId: string, feature: keyof PlanFeatures): Promise<FeatureAccess> {
    const subscription = await this.getBusinessSubscription(businessId);
    
    // Abonelik yoksa veya süresi dolmuşsa
    if (!subscription || subscription.status === 'expired') {
      return {
        hasAccess: false,
        reason: 'Aboneliğiniz bulunmuyor veya süresi dolmuş',
        upgradeRequired: true,
        requiredPlan: 'starter',
      };
    }

    // Trial veya suspended durumunda
    if (subscription.status === 'suspended') {
      return {
        hasAccess: false,
        reason: 'Aboneliğiniz askıya alınmış',
        upgradeRequired: false,
      };
    }

    // Plan özelliklerini al
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planType);
    if (!plan) {
      return { hasAccess: false, reason: 'Plan bulunamadı' };
    }

    // Custom features varsa öncelik ver
    const features = subscription.customFeatures || plan.features;
    const hasFeature = features[feature];

    if (typeof hasFeature === 'boolean') {
      return {
        hasAccess: hasFeature,
        reason: hasFeature ? undefined : `Bu özellik ${plan.name} planında bulunmuyor`,
        upgradeRequired: !hasFeature,
        requiredPlan: this.getRequiredPlanForFeature(feature),
      };
    }

    return { hasAccess: true };
  }

  /**
   * Limit kontrolü (personel, hizmet, randevu)
   */
  async checkLimit(
    businessId: string,
    limitType: 'staff' | 'services' | 'bookings',
    currentCount: number
  ): Promise<FeatureAccess> {
    const subscription = await this.getBusinessSubscription(businessId);
    
    if (!subscription || subscription.status === 'expired') {
      return {
        hasAccess: false,
        reason: 'Aboneliğiniz bulunmuyor veya süresi dolmuş',
        upgradeRequired: true,
      };
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planType);
    if (!plan) return { hasAccess: false };

    const features = subscription.customFeatures || plan.features;
    
    let limit: number | 'unlimited';
    switch (limitType) {
      case 'staff':
        limit = features.maxStaff;
        break;
      case 'services':
        limit = features.maxServices;
        break;
      case 'bookings':
        limit = features.maxMonthlyBookings;
        break;
    }

    if (limit === 'unlimited') {
      return { hasAccess: true };
    }

    const hasAccess = currentCount < limit;
    return {
      hasAccess,
      reason: hasAccess ? undefined : `${limitType} limiti aşıldı (${currentCount}/${limit})`,
      upgradeRequired: !hasAccess,
      requiredPlan: this.getNextPlan(subscription.planType),
    };
  }

  /**
   * Abonelik geçmişini getir
   * NOT: Index hazır olana kadar client-side sıralama kullanılıyor
   */
  async getSubscriptionHistory(businessId: string): Promise<SubscriptionHistory[]> {
    try {
      // Önce index'li sorguyu dene
      const q = query(
        collection(db, this.historyCollection),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SubscriptionHistory);
    } catch (error: any) {
      // Index henüz hazır değilse, client-side sıralama yap
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.log('⏳ Index building, using client-side sorting...');
        
        const q = query(
          collection(db, this.historyCollection),
          where('businessId', '==', businessId)
        );

        const snapshot = await getDocs(q);
        
        // Client-side'da sırala
        return snapshot.docs
          .map(doc => doc.data() as SubscriptionHistory)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      throw error;
    }
  }

  // Private helper methods

  private async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Promise<void> {
    await updateDoc(doc(db, this.subscriptionsCollection, subscriptionId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  private async addHistory(
    businessId: string,
    subscriptionId: string,
    action: SubscriptionHistory['action'],
    fromPlan: SubscriptionPlanType | undefined,
    toPlan: SubscriptionPlanType | undefined,
    amount: number,
    reason?: string
  ): Promise<void> {
    const history: any = {
      id: doc(collection(db, this.historyCollection)).id,
      businessId,
      subscriptionId,
      action,
      amount,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
    };

    // Sadece tanımlı alanları ekle
    if (fromPlan !== undefined) history.fromPlan = fromPlan;
    if (toPlan !== undefined) history.toPlan = toPlan;
    if (reason !== undefined) history.reason = reason;

    await setDoc(doc(db, this.historyCollection, history.id), history);
  }

  private comparePlans(plan1: SubscriptionPlanType, plan2: SubscriptionPlanType): number {
    const order: SubscriptionPlanType[] = ['starter', 'professional', 'business', 'enterprise', 'custom'];
    return order.indexOf(plan2) - order.indexOf(plan1);
  }

  private getNextPlan(currentPlan: SubscriptionPlanType): SubscriptionPlanType {
    const order: SubscriptionPlanType[] = ['starter', 'professional', 'business', 'enterprise'];
    const currentIndex = order.indexOf(currentPlan);
    return order[currentIndex + 1] || 'enterprise';
  }

  private getRequiredPlanForFeature(feature: keyof PlanFeatures): SubscriptionPlanType {
    // Her özellik için minimum gereken planı bul
    for (const plan of SUBSCRIPTION_PLANS) {
      if (plan.features[feature]) {
        return plan.id;
      }
    }
    return 'starter';
  }
}

export const subscriptionService = new SubscriptionService();
