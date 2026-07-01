import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { r2Service } from './cloudflareR2Service';
import type { SupportTicket, SupportMessage, SupportAttachment } from '@/types/support';

const COLLECTIONS = {
  TICKETS: 'support_tickets',
  MESSAGES: 'support_messages',
};

class SupportService {
  /**
   * Dosya yükleme
   */
  async uploadAttachment(file: File, ticketId: string): Promise<SupportAttachment> {
    // Upload to R2
    const result = await r2Service.uploadImage(file, {
      folder: `support/${ticketId}`,
      compress: file.type.startsWith('image/'),
      maxSizeMB: 10
    });

    return {
      id: `${Date.now()}_${file.name}`,
      name: file.name,
      type: file.type,
      size: result.size,
      url: result.url,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Görsel sıkıştırma
   */
  private async compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Boyut oranını koru
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Yeni destek talebi oluştur
   */
  async createTicket(
    ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TICKETS), {
      ...ticket,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * İşletmenin destek taleplerini getir
   */
  async getBusinessTickets(businessId: string): Promise<SupportTicket[]> {
    const q = query(
      collection(db, COLLECTIONS.TICKETS),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate().toISOString(),
    })) as SupportTicket[];
  }

  /**
   * Kullanıcının destek taleplerini getir
   */
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    try {
      // Try with orderBy first (requires composite index)
      const q = query(
        collection(db, COLLECTIONS.TICKETS),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
        resolvedAt: doc.data().resolvedAt?.toDate().toISOString(),
      })) as SupportTicket[];
    } catch (error: any) {
      // Fallback: get without orderBy and sort in memory
      if (error?.code === 'failed-precondition') {
        const q = query(
          collection(db, COLLECTIONS.TICKETS),
          where('ownerId', '==', userId)
        );

        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
          resolvedAt: doc.data().resolvedAt?.toDate().toISOString(),
        })) as SupportTicket[];

        // Sort in memory
        return tickets.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      throw error;
    }
  }

  /**
   * Tüm destek taleplerini getir (Admin)
   */
  async getAllTickets(): Promise<SupportTicket[]> {
    const q = query(
      collection(db, COLLECTIONS.TICKETS),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate().toISOString(),
    })) as SupportTicket[];
  }

  /**
   * Destek talebini güncelle
   */
  async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Destek talebini çöz
   */
  async resolveTicket(ticketId: string, resolvedBy: string, adminNotes?: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    await updateDoc(docRef, {
      status: 'resolved',
      resolvedAt: serverTimestamp(),
      resolvedBy,
      adminNotes,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Destek talebine mesaj ekle
   */
  async addMessage(
    ticketId: string,
    senderId: string,
    senderName: string,
    senderRole: 'owner' | 'admin' | 'customer',
    message: string,
    attachments: SupportAttachment[] = []
  ): Promise<void> {
    await addDoc(collection(db, COLLECTIONS.MESSAGES), {
      ticketId,
      senderId,
      senderName,
      senderRole,
      message,
      attachments,
      createdAt: serverTimestamp(),
      isRead: false,
    });

    // Ticket'ı güncelle
    await this.updateTicket(ticketId, {});
  }

  /**
   * Destek talebinin mesajlarını getir
   */
  async getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    })) as SupportMessage[];
  }

  /**
   * Çözümü puanla
   */
  async rateTicket(ticketId: string, rating: number, comment?: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    await updateDoc(docRef, {
      rating,
      ratingComment: comment,
      updatedAt: serverTimestamp(),
    });
  }
}

export const supportService = new SupportService();
