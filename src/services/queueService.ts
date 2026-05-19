import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import type { QueueEntry } from '@/types';

// Sıra sisteminin aktif olduğu kategoriler
const QUEUE_ENABLED_CATEGORIES = [
  'kuafor',
  'berber',
  'guzellik',
  'tirnak'
];

class QueueService {
  private collectionName = 'queue';

  canUseQueue(businessCategory: string): boolean {
    return QUEUE_ENABLED_CATEGORIES.includes(businessCategory);
  }

  async joinQueue(params: {
    userId: string;
    salonId: string;
    staffId: string;
    customerName: string;
    customerPhone: string;
    services: { id: string; name: string; price: number; duration: number }[];
    notes?: string;
  }): Promise<QueueEntry> {
    
    // Sıradaki pozisyonu hesapla
    const currentQueue = await this.getQueue(params.salonId);
    const queuePosition = currentQueue.length + 1;

    // Toplam süre ve fiyat
    const totalDuration = params.services.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = params.services.reduce((sum, s) => sum + s.price, 0);

    const queueEntry: QueueEntry = {
      id: doc(collection(db, this.collectionName)).id,
      appointmentId: '', // Randevuya dönüştürülünce doldurulur
      userId: params.userId,
      salonId: params.salonId,
      staffId: params.staffId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      services: params.services,
      queuePosition,
      totalPrice,
      totalDuration,
      notes: params.notes || '',
      createdAt: new Date().toISOString(),
      notified: false
    };

    await setDoc(doc(db, this.collectionName, queueEntry.id), queueEntry);

    return queueEntry;
  }

  async getQueue(salonId: string): Promise<QueueEntry[]> {
    const q = query(
      collection(db, this.collectionName),
      where('salonId', '==', salonId),
      orderBy('queuePosition', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as QueueEntry);
  }

  async getUserQueuePosition(userId: string, salonId: string): Promise<QueueEntry | null> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('salonId', '==', salonId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return snapshot.docs[0].data() as QueueEntry;
  }

  async removeFromQueue(queueId: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, queueId));

    // Sıradaki diğer kişilerin pozisyonlarını güncelle
    // Bu işlem Cloud Function ile yapılmalı
  }

  async callNext(salonId: string, staffId: string): Promise<QueueEntry | null> {
    const queue = await this.getQueue(salonId);
    
    // Belirtilen personel için sıradaki ilk kişiyi bul
    const nextInQueue = queue.find(entry => entry.staffId === staffId);
    
    if (!nextInQueue) return null;

    // Bildirim gönderildi olarak işaretle
    await setDoc(doc(db, this.collectionName, nextInQueue.id), {
      notified: true
    }, { merge: true });

    return nextInQueue;
  }

  async convertToAppointment(queueId: string, appointmentId: string): Promise<void> {
    // Sıradan randevuya dönüştür
    await setDoc(doc(db, this.collectionName, queueId), {
      appointmentId
    }, { merge: true });

    // Sıradan çıkar
    await this.removeFromQueue(queueId);
  }

  async getEstimatedWaitTime(salonId: string, staffId: string): Promise<number> {
    const queue = await this.getQueue(salonId);
    
    // Belirtilen personel için sıradaki kişileri filtrele
    const staffQueue = queue.filter(entry => entry.staffId === staffId);
    
    // Toplam bekleme süresi (dakika)
    const totalDuration = staffQueue.reduce((sum, entry) => sum + entry.totalDuration, 0);
    
    return totalDuration;
  }

  async cleanupExpiredQueue(): Promise<void> {
    // Gece yarısı geçmiş sıraları temizle
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59);

    const q = query(
      collection(db, this.collectionName),
      where('createdAt', '<', yesterday.toISOString())
    );

    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }
}

export const queueService = new QueueService();
