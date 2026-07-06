// @ts-nocheck
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==================== AUDIT LOG ====================
export const auditLogService = {
  async log(action: {
    adminId: string;
    adminName: string;
    action: string;
    targetType: 'user' | 'business' | 'staff' | 'reservation' | 'subscription' | 'payment' | 'service';
    targetId: string;
    targetName: string;
    changes?: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    metadata?: any;
  }) {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        ...action,
        timestamp: new Date().toISOString(),
        ip: 'admin-panel', // Gerçek IP alınabilir
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  async getLogs(filters?: {
    adminId?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    try {
      let q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
      
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get logs error:', error);
      return [];
    }
  }
};

// ==================== USER MANAGEMENT ====================
export const adminUserService = {
  // Bulk Actions
  async bulkBan(userIds: string[], reason: string, adminId: string, adminName: string) {
    try {
      // ✅ GÜVENLİK: Rate limiting (max 100 items per batch)
      if (userIds.length > 100) {
        throw new Error('Tek seferde en fazla 100 kullanıcı işlem yapılabilir');
      }
      
      const batch = writeBatch(db);
      
      for (const userId of userIds) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          isBanned: true,
          bannedAt: new Date().toISOString(),
          bannedBy: adminId,
          banReason: reason,
        });

        // Audit log
        await auditLogService.log({
          adminId,
          adminName,
          action: 'bulk_ban_user',
          targetType: 'user',
          targetId: userId,
          targetName: userId,
          metadata: { reason },
        });
      }

      await batch.commit();
      return { success: true, count: userIds.length };
    } catch (error) {
      console.error('Bulk ban error:', error);
      throw error;
    }
  },

  async bulkDelete(userIds: string[], adminId: string, adminName: string) {
    try {
      // ✅ GÜVENLİK: Rate limiting (max 100 items per batch)
      if (userIds.length > 100) {
        throw new Error('Tek seferde en fazla 100 kullanıcı işlem yapılabilir');
      }
      
      const batch = writeBatch(db);
      
      for (const userId of userIds) {
        // Soft delete
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: adminId,
        });

        await auditLogService.log({
          adminId,
          adminName,
          action: 'bulk_delete_user',
          targetType: 'user',
          targetId: userId,
          targetName: userId,
        });
      }

      await batch.commit();
      return { success: true, count: userIds.length };
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  },

  async bulkGrantPremium(userIds: string[], days: number, adminId: string, adminName: string) {
    try {
      // ✅ GÜVENLİK: Rate limiting (max 100 items per batch)
      if (userIds.length > 100) {
        throw new Error('Tek seferde en fazla 100 kullanıcı işlem yapılabilir');
      }
      
      const batch = writeBatch(db);
      
      for (const userId of userIds) {
        const userRef = doc(db, 'users', userId);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        batch.update(userRef, {
          isPremium: true,
          premiumUntil: endDate.toISOString(),
          premiumGrantedBy: adminId,
          premiumGrantedAt: new Date().toISOString(),
        });

        await auditLogService.log({
          adminId,
          adminName,
          action: 'bulk_grant_premium',
          targetType: 'user',
          targetId: userId,
          targetName: userId,
          metadata: { days },
        });
      }

      await batch.commit();
      return { success: true, count: userIds.length };
    } catch (error) {
      console.error('Bulk grant premium error:', error);
      throw error;
    }
  },

  // Soft Delete & Restore
  async softDelete(userId: string, adminId: string, adminName: string) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: adminId,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'soft_delete_user',
        targetType: 'user',
        targetId: userId,
        targetName: userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Soft delete error:', error);
      throw error;
    }
  },

  async restore(userId: string, adminId: string, adminName: string) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isDeleted: false,
        restoredAt: new Date().toISOString(),
        restoredBy: adminId,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'restore_user',
        targetType: 'user',
        targetId: userId,
        targetName: userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  },

  async hardDelete(userId: string, adminId: string, adminName: string) {
    try {
      // ✅ GÜVENLİK: Transaction kullanarak atomic operation
      // Audit log ve delete aynı anda başarılı/başarısız olur
      const batch = writeBatch(db);
      
      // 1. Audit log oluştur (batch içinde)
      const auditLogRef = doc(collection(db, 'audit_logs'));
      batch.set(auditLogRef, {
        adminId,
        adminName,
        action: 'hard_delete_user',
        targetType: 'user' as const,
        targetId: userId,
        targetName: userId,
        timestamp: new Date().toISOString(),
        ip: 'admin-panel',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      });
      
      // 2. User dokümanını sil (batch içinde)
      const userRef = doc(db, 'users', userId);
      batch.delete(userRef);
      
      // ✅ Her iki işlem birlikte commit (atomicity garantisi)
      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error('Hard delete error:', error);
      throw error;
    }
  },

  // Advanced User Management
  async resetPassword(userId: string, adminId: string, adminName: string) {
    try {
      // Şifre sıfırlama token'ı oluştur
      const resetToken = Math.random().toString(36).substring(2, 15);
      
      await updateDoc(doc(db, 'users', userId), {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 3600000).toISOString(), // 1 saat
        passwordResetBy: adminId,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'reset_password',
        targetType: 'user',
        targetId: userId,
        targetName: userId,
      });

      return { success: true, resetToken };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  async clearDevices(userId: string, adminId: string, adminName: string) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        devices: [],
        devicesClearedAt: new Date().toISOString(),
        devicesClearedBy: adminId,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'clear_devices',
        targetType: 'user',
        targetId: userId,
        targetName: userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Clear devices error:', error);
      throw error;
    }
  },

  async changeRole(userId: string, newRole: string, adminId: string, adminName: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const oldRole = userDoc.data()?.role;

      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        roleChangedAt: new Date().toISOString(),
        roleChangedBy: adminId,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'change_role',
        targetType: 'user',
        targetId: userId,
        targetName: userId,
        changes: [{
          field: 'role',
          oldValue: oldRole,
          newValue: newRole,
        }],
      });

      return { success: true };
    } catch (error) {
      console.error('Change role error:', error);
      throw error;
    }
  },
};

// ==================== SUBSCRIPTION MANAGEMENT ====================
export const adminSubscriptionService = {
  // ✅ YENİ: Pending subscription'ı onayla
  async approveSubscription(
    subscriptionId: string,
    adminId: string,
    adminName: string
  ) {
    console.log('🔍 Approve Subscription Debug:', {
      subscriptionId,
      adminId,
      adminName
    });
    
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      
      console.log('📄 Subscription Document:', {
        exists: subDoc.exists(),
        id: subDoc.id,
        data: subDoc.data()
      });
      
      if (!subDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subData = subDoc.data();
      
      console.log('📊 Subscription Status Check:', {
        currentStatus: subData.status,
        canApprove: subData.status === 'pending'
      });
      
      if (subData.status !== 'pending') {
        throw new Error(`Only pending subscriptions can be approved. Current status: ${subData.status}`);
      }

      console.log('✍️ Updating subscription to active...');
      
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'active',
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('✅ Subscription updated successfully');
      
      // ✅ Salon'un subscriptionActive alanını güncelle
      try {
        await updateDoc(doc(db, 'salons', subData.businessId), {
          subscriptionActive: true,
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Salon subscriptionActive updated to true');
      } catch (salonError) {
        console.error('⚠️ Could not update salon subscriptionActive:', salonError);
        // Salon güncellenemese bile devam et
      }

      await auditLogService.log({
        adminId,
        adminName,
        action: 'approve_subscription',
        targetType: 'subscription',
        targetId: subscriptionId,
        targetName: subData.businessName || subscriptionId,
        metadata: { 
          planType: subData.planType,
          interval: subData.interval,
          price: subData.price 
        },
      });
      
      console.log('✅ Audit log created');

      return { success: true };
    } catch (error) {
      console.error('❌ Approve subscription error:', error);
      throw error;
    }
  },

  // ✅ YENİ: Pending subscription'ı reddet
  async rejectSubscription(
    subscriptionId: string,
    reason: string,
    adminId: string,
    adminName: string
  ) {
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subData = subDoc.data();
      if (subData.status !== 'pending') {
        throw new Error('Only pending subscriptions can be rejected');
      }

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'cancelled',
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      });
      
      // ✅ Salon'un subscriptionActive alanını güncelle
      try {
        await updateDoc(doc(db, 'salons', subData.businessId), {
          subscriptionActive: false,
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Salon subscriptionActive updated to false');
      } catch (salonError) {
        console.error('⚠️ Could not update salon subscriptionActive:', salonError);
        // Salon güncellenemese bile devam et
      }

      await auditLogService.log({
        adminId,
        adminName,
        action: 'reject_subscription',
        targetType: 'subscription',
        targetId: subscriptionId,
        targetName: subData.businessName || subscriptionId,
        metadata: { 
          planType: subData.planType,
          reason 
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Reject subscription error:', error);
      throw error;
    }
  },

  async extendSubscription(
    subscriptionId: string, 
    days: number, 
    adminId: string, 
    adminName: string
  ) {
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      const currentEndDate = new Date(subDoc.data()?.endDate);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        endDate: newEndDate.toISOString(),
        extendedBy: adminId,
        extendedAt: new Date().toISOString(),
        extensionDays: days,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'extend_subscription',
        targetType: 'subscription',
        targetId: subscriptionId,
        targetName: subscriptionId,
        metadata: { days, newEndDate: newEndDate.toISOString() },
      });

      return { success: true, newEndDate };
    } catch (error) {
      console.error('Extend subscription error:', error);
      throw error;
    }
  },

  async grantManualPremium(
    businessId: string,
    planType: string,
    days: number,
    adminId: string,
    adminName: string,
    businessName?: string
  ) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      // ✅ ID = businessId (her business için 1 subscription)
      await setDoc(doc(db, 'subscriptions', businessId), {
        id: businessId,
        businessId,
        businessName: businessName || businessId,
        planType,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        price: 0,
        interval: 'manual',
        isManual: true,
        grantedBy: adminId,
        grantedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usage: {
          staffCount: 0,
          serviceCount: 0,
          monthlyBookings: 0,
          lastUpdated: new Date().toISOString(),
        },
      });
      
      // ✅ Salon subscriptionActive güncelle
      try {
        await updateDoc(doc(db, 'salons', businessId), {
          subscriptionActive: true,
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Salon subscriptionActive updated to true');
      } catch (salonError) {
        console.error('⚠️ Could not update salon subscriptionActive:', salonError);
      }

      await auditLogService.log({
        adminId,
        adminName,
        action: 'grant_manual_premium',
        targetType: 'subscription',
        targetId: businessId,
        targetName: businessName || businessId,
        metadata: { planType, days },
      });

      return { success: true };
    } catch (error) {
      console.error('Grant manual premium error:', error);
      throw error;
    }
  },

  async freezeSubscription(subscriptionId: string, adminId: string, adminName: string) {
    try {
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'frozen',
        frozenAt: new Date().toISOString(),
        frozenBy: adminId,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'freeze_subscription',
        targetType: 'subscription',
        targetId: subscriptionId,
        targetName: subscriptionId,
      });

      return { success: true };
    } catch (error) {
      console.error('Freeze subscription error:', error);
      throw error;
    }
  },

  async unfreezeSubscription(subscriptionId: string, adminId: string, adminName: string) {
    try {
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'active',
        unfrozenAt: new Date().toISOString(),
        unfrozenBy: adminId,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'unfreeze_subscription',
        targetType: 'subscription',
        targetId: subscriptionId,
        targetName: subscriptionId,
      });

      return { success: true };
    } catch (error) {
      console.error('Unfreeze subscription error:', error);
      throw error;
    }
  },

  async upgradePlan(
    subscriptionId: string,
    newPlanType: string,
    adminId: string,
    adminName: string
  ) {
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      const oldPlanType = subDoc.data()?.planType;

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        planType: newPlanType,
        upgradedAt: new Date().toISOString(),
        upgradedBy: adminId,
      });

      await auditLogService.log({
        adminId,
        adminName,
        action: 'upgrade_plan',
        targetType: 'subscription',
        targetId: subscriptionId,
        targetName: subscriptionId,
        changes: [{
          field: 'planType',
          oldValue: oldPlanType,
          newValue: newPlanType,
        }],
      });

      return { success: true };
    } catch (error) {
      console.error('Upgrade plan error:', error);
      throw error;
    }
  },
};

// ==================== BUSINESS MANAGEMENT ====================
export const adminBusinessService = {
  async bulkApprove(businessIds: string[], adminId: string, adminName: string) {
    try {
      const batch = writeBatch(db);
      
      for (const businessId of businessIds) {
        const businessRef = doc(db, 'salons', businessId);
        batch.update(businessRef, {
          isApproved: true,
          approvalStatus: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: adminId,
          isActive: true,
        });

        await auditLogService.log({
          adminId,
          adminName,
          action: 'bulk_approve_business',
          targetType: 'business',
          targetId: businessId,
          targetName: businessId,
        });
      }

      await batch.commit();
      return { success: true, count: businessIds.length };
    } catch (error) {
      console.error('Bulk approve error:', error);
      throw error;
    }
  },

  async bulkReject(businessIds: string[], reason: string, adminId: string, adminName: string) {
    try {
      const batch = writeBatch(db);
      
      for (const businessId of businessIds) {
        const businessRef = doc(db, 'salons', businessId);
        batch.update(businessRef, {
          isApproved: false,
          approvalStatus: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectedBy: adminId,
          rejectionReason: reason,
        });

        await auditLogService.log({
          adminId,
          adminName,
          action: 'bulk_reject_business',
          targetType: 'business',
          targetId: businessId,
          targetName: businessId,
          metadata: { reason },
        });
      }

      await batch.commit();
      return { success: true, count: businessIds.length };
    } catch (error) {
      console.error('Bulk reject error:', error);
      throw error;
    }
  },

  async clone(businessId: string, adminId: string, adminName: string) {
    try {
      const businessDoc = await getDoc(doc(db, 'salons', businessId));
      const businessData = businessDoc.data();

      if (!businessData) throw new Error('Business not found');

      const newBusiness = {
        ...businessData,
        name: `${businessData.name} (Kopya)`,
        isApproved: false,
        approvalStatus: 'pending',
        clonedFrom: businessId,
        clonedBy: adminId,
        clonedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'salons'), newBusiness);

      await auditLogService.log({
        adminId,
        adminName,
        action: 'clone_business',
        targetType: 'business',
        targetId: docRef.id,
        targetName: newBusiness.name,
        metadata: { originalId: businessId },
      });

      return { success: true, newId: docRef.id };
    } catch (error) {
      console.error('Clone business error:', error);
      throw error;
    }
  },
};

// ==================== ADVANCED SEARCH ====================
export const adminSearchService = {
  async advancedUserSearch(filters: {
    isPremium?: boolean;
    lastLoginDays?: number;
    hasActiveBooking?: boolean;
    hasPaymentIssue?: boolean;
    minSpent?: number;
    role?: string;
  }) {
    try {
      let q = query(collection(db, 'users'));

      if (filters.role) {
        q = query(q, where('role', '==', filters.role));
      }

      if (filters.isPremium !== undefined) {
        q = query(q, where('isPremium', '==', filters.isPremium));
      }

      const snapshot = await getDocs(q);
      let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Client-side filtering for complex conditions
      if (filters.lastLoginDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.lastLoginDays);
        users = users.filter(user => {
          const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
          return lastLogin && lastLogin >= cutoffDate;
        });
      }

      return users;
    } catch (error) {
      console.error('Advanced search error:', error);
      return [];
    }
  },
};

export default {
  auditLogService,
  adminUserService,
  adminSubscriptionService,
  adminBusinessService,
  adminSearchService,
};
