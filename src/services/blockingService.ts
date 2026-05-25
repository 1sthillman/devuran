import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

export interface BlockedBusiness {
  id: string;
  userId: string;
  businessId: string;
  businessName: string;
  blockedAt: string;
  reason: string;
}

class BlockingService {
  /**
   * Block a business (customer blocks salon)
   */
  async blockBusiness(
    userId: string,
    businessId: string,
    businessName: string,
    reason: string
  ): Promise<void> {
    const blockId = `${userId}_${businessId}`;
    const blockRef = doc(db, 'blockedBusinesses', blockId);
    
    await setDoc(blockRef, {
      userId,
      businessId,
      businessName,
      blockedAt: new Date().toISOString(),
      reason,
    });
  }

  /**
   * Unblock a business
   */
  async unblockBusiness(userId: string, businessId: string): Promise<void> {
    const blockId = `${userId}_${businessId}`;
    const blockRef = doc(db, 'blockedBusinesses', blockId);
    await deleteDoc(blockRef);
  }

  /**
   * Check if user has blocked a business
   */
  async isBusinessBlocked(userId: string, businessId: string): Promise<boolean> {
    const blockId = `${userId}_${businessId}`;
    const blockRef = doc(db, 'blockedBusinesses', blockId);
    const blockDoc = await getDoc(blockRef);
    return blockDoc.exists();
  }

  /**
   * Get all businesses blocked by user
   */
  async getBlockedBusinesses(userId: string): Promise<BlockedBusiness[]> {
    const q = query(
      collection(db, 'blockedBusinesses'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlockedBusiness));
  }

  /**
   * Check if customer is banned by business
   */
  async isCustomerBanned(userId: string, businessId: string): Promise<boolean> {
    const customerId = `${businessId}_${userId}`;
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);
    
    if (customerDoc.exists()) {
      return customerDoc.data().isBanned || false;
    }
    
    return false;
  }
}

export const blockingService = new BlockingService();
