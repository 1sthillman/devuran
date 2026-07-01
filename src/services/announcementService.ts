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
  serverTimestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app, { db } from "@/lib/firebase";
import { storageService } from "./storageService";
import type { Announcement } from "@/types/announcement";

const storage = getStorage(app);
const COLLECTION = "announcements";

class AnnouncementService {
  async uploadImage(file: File): Promise<string> {
    try {
      const result = await storageService.uploadFile(file, {
        folder: "announcements",
        compress: true
      });
      return result.url;
    } catch (error) {
      console.error("Storage upload failed, using Firebase fallback:", error);
      const fileRef = ref(storage, `announcements/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      return await getDownloadURL(fileRef);
    }
  }

  async createAnnouncement(
    announcement: Omit<Announcement, "id" | "createdAt" | "readBy">
  ): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...announcement,
      readBy: [],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    const q = query(
      collection(db, COLLECTION),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    })) as Announcement[];
  }

  async getUserAnnouncements(
    userId: string,
    userType: "customer" | "owner",
    businessId?: string,
    serviceIds?: string[]
  ): Promise<Announcement[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const allAnnouncements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
      })) as Announcement[];

      return this.filterAnnouncementsByTarget(allAnnouncements, userType, businessId, serviceIds);
    } catch (error: any) {
      if (error?.code === "failed-precondition") {
        const q = query(
          collection(db, COLLECTION),
          where("isActive", "==", true)
        );

        const snapshot = await getDocs(q);
        const allAnnouncements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
        })) as Announcement[];

        const sorted = allAnnouncements.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return this.filterAnnouncementsByTarget(sorted, userType, businessId, serviceIds);
      }
      throw error;
    }
  }

  private filterAnnouncementsByTarget(
    announcements: Announcement[],
    userType: "customer" | "owner",
    businessId?: string,
    serviceIds?: string[]
  ): Announcement[] {
    return announcements.filter(announcement => {
      if (announcement.expiresAt) {
        const expireDate = new Date(announcement.expiresAt);
        if (expireDate < new Date()) return false;
      }

      switch (announcement.targetType) {
        case "all":
          return true;
        case "all_businesses":
          return userType === "owner";
        case "all_customers":
          return userType === "customer";
        case "specific_businesses":
          return userType === "owner" && 
                 businessId && 
                 announcement.targetIds?.includes(businessId);
        case "specific_services":
          return userType === "customer" && 
                 serviceIds && 
                 serviceIds.some(sid => announcement.targetIds?.includes(sid));
        default:
          return false;
      }
    });
  }

  async getUnreadCount(
    userId: string,
    userType: "customer" | "owner",
    businessId?: string,
    serviceIds?: string[]
  ): Promise<number> {
    const announcements = await this.getUserAnnouncements(userId, userType, businessId, serviceIds);
    return announcements.filter(a => a.readBy && !a.readBy.includes(userId)).length;
  }

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, announcementId);
    await updateDoc(docRef, {
      readBy: arrayUnion(userId),
    });
  }

  async updateAnnouncement(
    announcementId: string,
    updates: Partial<Announcement>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION, announcementId);
    await updateDoc(docRef, updates);
  }

  async deleteAnnouncement(announcementId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, announcementId));
  }

  async deactivateAnnouncement(announcementId: string): Promise<void> {
    await this.updateAnnouncement(announcementId, { isActive: false });
  }
}

export const announcementService = new AnnouncementService();
