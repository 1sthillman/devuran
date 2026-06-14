export type AnnouncementTargetType = 
  | 'all'                    // Tüm kullanıcılar
  | 'all_businesses'         // Tüm işletmeler
  | 'all_customers'          // Tüm müşteriler
  | 'specific_businesses'    // Belirli işletmeler
  | 'specific_services';     // Belirli hizmet alan müşteriler

export interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  targetType: AnnouncementTargetType;
  targetIds?: string[]; // businessId veya serviceId listesi
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  readBy: string[]; // Okuyan kullanıcı ID'leri
}

export interface AnnouncementRead {
  userId: string;
  announcementId: string;
  readAt: string;
}
