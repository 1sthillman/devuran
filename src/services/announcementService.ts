import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  arrayUnion,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { r2Service } from './cloudflareR2Service';
import type { Announcement, AnnouncementTargetType } from '@/types/announcement';

const COLLECTION = 'announcements';

class AnnouncementService {
  /**
   * Görsel yükle
   */
  async uploadImage(file: File): Promise<string> {
    const result = await r2Service.uploadImage(file, {
      folder: 'announcements',
      compress: true,
      maxSizeMB: 5
    });
    return result.url;
  }

  /**
   * Duyuru oluştur
   */
  async createAnnouncement(
    announcement: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...announcement,
      readBy: [],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * Duyuruları listele (admin)
   */
  async getAllAnnouncements(): Promise<Announcement[]> {
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    })) as Announcement[];
  }

  /**
   * Kullanıcıya göre duyuruları getir
   */
  async getUserAnnouncements(
    userId: string,
    userType: 'customer' | 'owner',
    businessId?: string,
    serviceIds?: string[]
  ): Promise<Announcement[]> {
    try {
      // Try with orderBy first (requires composite index)
      const q = query(
        collection(db, COLLECTION),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const allAnnouncements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
      })) as Announcement[];

      // Filtreleme
      return this.filterAnnouncementsByTarget(allAnnouncements, userType, businessId, serviceIds);
    } catch (error: any) {
      // Fallback: get without orderBy and sort in memory
      if (error?.code === 'failed-precondition') {
        const q = query(
          collection(db, COLLECTION),
          where('isActive', '==', true)
        );

        const snapshot = await getDocs(q);
        const allAnnouncements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
        })) as Announcement[];

        // Sort in memory
        const sorted = allAnnouncements.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Filtreleme
        return this.filterAnnouncementsByTarget(sorted, userType, businessId, serviceIds);
      }
      throw error;
    }
  }

  /**
   * Helper method for filtering announcements by target
   */
  private filterAnnouncementsByTarget(
    announcements: Announcement[],
    userType: 'customer' | 'owner',
    businessId?: string,
    serviceIds?: string[]
  ): Announcement[] {
    return announcements.filter(announcement => {
      // Expire kontrolü
      if (announcement.expiresAt) {
        const expireDate = new Date(announcement.expiresAt);
        if (expireDate < new Date()) return false;
      }

      // Hedef kontrolü
      switch (announcement.targetType) {
        case 'all':
          return true;

        case 'all_businesses':
          return userType === 'owner';

        case 'all_customers':
          return userType === 'customer';

        case 'specific_businesses':
          return userType === 'owner' && 
                 businessId && 
                 announcement.targetIds?.includes(businessId);

        case 'specific_services':
          return userType === 'customer' && 
                 serviceIds && 
                 serviceIds.some(sid => announcement.targetIds?.includes(sid));

        default:
          return false;
      }
    });
  }

  /**
   * Okunmamış duyuru sayısı
   */
  async getUnreadCount(
    userId: string,
    userType: 'customer' | 'owner',
    businessId?: string,
    serviceIds?: string[]
  ): Promise<number> {
    const announcements = await this.getUserAnnouncements(userId, userType, businessId, serviceIds);
    return announcements.filter(a => !a.readBy.includes(userId)).length;
  }

  /**
   * Duyuruyu okundu olarak işaretle
   */
  async markAsRead(announcementId: string, userId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, announcementId);
    await updateDoc(docRef, {
      readBy: arrayUnion(userId),
    });
  }

  /**
   * Duyuruyu güncelle
   */
  async updateAnnouncement(
    announcementId: string,
    updates: Partial<Announcement>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION, announcementId);
    await updateDoc(docRef, updates);
  }

  /**
   * Duyuruyu sil
   */
  async deleteAnnouncement(announcementId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, announcementId));
  }

  /**
   * Duyuruyu devre dışı bırak
   */
  async deactivateAnnouncement(announcementId: string): Promise<void> {
    await this.updateAnnouncement(announcementId, { isActive: false });
  }
}

export const announcementService = new AnnouncementService();
