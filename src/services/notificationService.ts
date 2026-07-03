/**
 * Notification Service
 * Handles email and SMS notifications
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface NotificationTemplate {
  type: 'email' | 'sms' | 'both';
  subject?: string;
  message: string;
  variables?: Record<string, string>;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reservation_created' | 'reservation_confirmed' | 'reservation_cancelled' | 'reservation_reminder' | 'payment_received' | 'review_request';
  channel: 'email' | 'sms' | 'both';
  recipient: {
    email?: string;
    phone?: string;
    name: string;
  };
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

class NotificationService {
  private collectionName = 'notifications';

  /**
   * Send reservation created notification
   */
  async sendReservationCreated(data: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    businessName: string;
    reservationId: string;
    date: string;
    time?: string;
    totalAmount: number;
  }): Promise<void> {
    const message = `Merhaba ${data.userName},

${data.businessName} için rezervasyonunuz oluşturuldu.

Rezervasyon No: ${data.reservationId}
Tarih: ${data.date}
${data.time ? `Saat: ${data.time}` : ''}
Tutar: ${data.totalAmount.toLocaleString('tr-TR')} TL

Rezervasyonunuz işletme tarafından onaylandığında bilgilendirileceksiniz.

İyi günler dileriz.`;

    await this.createNotification({
      userId: data.userId,
      type: 'reservation_created',
      channel: 'both',
      recipient: {
        email: data.userEmail,
        phone: data.userPhone,
        name: data.userName,
      },
      subject: 'Rezervasyonunuz Oluşturuldu',
      message,
      metadata: {
        reservationId: data.reservationId,
        businessName: data.businessName,
      },
    });
  }

  /**
   * Send reservation confirmed notification
   */
  async sendReservationConfirmed(data: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    businessName: string;
    reservationId: string;
    date: string;
    time?: string;
  }): Promise<void> {
    const message = `Merhaba ${data.userName},

${data.businessName} rezervasyonunuz onaylandı!

Rezervasyon No: ${data.reservationId}
Tarih: ${data.date}
${data.time ? `Saat: ${data.time}` : ''}

Randevunuza gelmeyi unutmayın.

İyi günler dileriz.`;

    await this.createNotification({
      userId: data.userId,
      type: 'reservation_confirmed',
      channel: 'both',
      recipient: {
        email: data.userEmail,
        phone: data.userPhone,
        name: data.userName,
      },
      subject: 'Rezervasyonunuz Onaylandı',
      message,
      metadata: {
        reservationId: data.reservationId,
        businessName: data.businessName,
      },
    });
  }

  /**
   * Send reservation reminder (1 day before)
   */
  async sendReservationReminder(data: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    businessName: string;
    reservationId: string;
    date: string;
    time?: string;
    address: string;
  }): Promise<void> {
    const message = `Merhaba ${data.userName},

Yarın ${data.businessName} randevunuz var!

Rezervasyon No: ${data.reservationId}
Tarih: ${data.date}
${data.time ? `Saat: ${data.time}` : ''}
Adres: ${data.address}

Randevunuza gelmeyi unutmayın.

İyi günler dileriz.`;

    await this.createNotification({
      userId: data.userId,
      type: 'reservation_reminder',
      channel: 'both',
      recipient: {
        email: data.userEmail,
        phone: data.userPhone,
        name: data.userName,
      },
      subject: 'Randevu Hatırlatma',
      message,
      metadata: {
        reservationId: data.reservationId,
        businessName: data.businessName,
      },
    });
  }

  /**
   * Send reservation cancelled notification
   */
  async sendReservationCancelled(data: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    businessName: string;
    reservationId: string;
    cancelledBy: 'user' | 'business';
    reason?: string;
  }): Promise<void> {
    const message = `Merhaba ${data.userName},

${data.businessName} rezervasyonunuz iptal edildi.

Rezervasyon No: ${data.reservationId}
İptal Eden: ${data.cancelledBy === 'user' ? 'Siz' : 'İşletme'}
${data.reason ? `Sebep: ${data.reason}` : ''}

Yeni bir rezervasyon oluşturabilirsiniz.

İyi günler dileriz.`;

    await this.createNotification({
      userId: data.userId,
      type: 'reservation_cancelled',
      channel: 'both',
      recipient: {
        email: data.userEmail,
        phone: data.userPhone,
        name: data.userName,
      },
      subject: 'Rezervasyon İptal Edildi',
      message,
      metadata: {
        reservationId: data.reservationId,
        businessName: data.businessName,
        cancelledBy: data.cancelledBy,
      },
    });
  }

  /**
   * Send reservation updated notification
   */
  async sendReservationUpdated(data: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    businessName: string;
    reservationId: string;
  }): Promise<void> {
    const message = `Merhaba ${data.userName},

${data.businessName} rezervasyonunuz güncellendi.

Rezervasyon No: ${data.reservationId}

Güncel bilgilerinizi rezervasyonlarım sayfasından kontrol edebilirsiniz.

İyi günler dileriz.`;

    await this.createNotification({
      userId: data.userId,
      type: 'reservation_confirmed',
      channel: 'both',
      recipient: {
        email: data.userEmail,
        phone: data.userPhone,
        name: data.userName,
      },
      subject: 'Rezervasyonunuz Güncellendi',
      message,
      metadata: {
        reservationId: data.reservationId,
        businessName: data.businessName,
      },
    });
  }

  /**
   * Send payment received notification
   */
  async sendPaymentReceived(data: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    businessName: string;
    reservationId: string;
    amount: number;
    paymentType: 'deposit' | 'full';
  }): Promise<void> {
    const message = `Merhaba ${data.userName},

${data.businessName} için ${data.paymentType === 'deposit' ? 'depozito' : 'tam'} ödemeniz alındı.

Rezervasyon No: ${data.reservationId}
Tutar: ${data.amount.toLocaleString('tr-TR')} TL

Teşekkür ederiz.`;

    await this.createNotification({
      userId: data.userId,
      type: 'payment_received',
      channel: 'both',
      recipient: {
        email: data.userEmail,
        phone: data.userPhone,
        name: data.userName,
      },
      subject: 'Ödemeniz Alındı',
      message,
      metadata: {
        reservationId: data.reservationId,
        businessName: data.businessName,
        amount: data.amount,
      },
    });
  }

  /**
   * Send review request notification
   */
  async sendReviewRequest(data: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    businessName: string;
    reservationId: string;
  }): Promise<void> {
    const message = `Merhaba ${data.userName},

${data.businessName} deneyiminizi değerlendirir misiniz?

Görüşleriniz bizim için çok değerli.

Değerlendirme yapmak için rezervasyonlarım sayfasını ziyaret edin.

Teşekkür ederiz.`;

    await this.createNotification({
      userId: data.userId,
      type: 'review_request',
      channel: 'email',
      recipient: {
        email: data.userEmail,
        phone: data.userPhone,
        name: data.userName,
      },
      subject: 'Deneyiminizi Değerlendirin',
      message,
      metadata: {
        reservationId: data.reservationId,
        businessName: data.businessName,
      },
    });
  }

  /**
   * Create notification record
   */
  private async createNotification(data: Omit<Notification, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const notification: Omit<Notification, 'id'> = {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, this.collectionName), notification);
    
    // In production, this would trigger a Cloud Function to actually send the notification
    // For now, we just mark it as sent
    // await updateDoc(docRef, { status: 'sent', sentAt: new Date().toISOString() });
    
    return docRef.id;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }
}

export const notificationService = new NotificationService();
