export type SupportTicketType = 'bug' | 'feature_request' | 'help' | 'feedback' | 'other';
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportAttachment {
  id: string;
  name: string;
  type: string; // image/jpeg, application/pdf, etc.
  size: number;
  url: string;
  compressedUrl?: string;
  uploadedAt: string;
}

export interface SupportTicket {
  id: string;
  businessId: string;
  businessName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  type: SupportTicketType;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  subject: string;
  message: string;
  attachments: SupportAttachment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
  rating?: number; // 1-5, işletme çözümü puanlar
  ratingComment?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'owner' | 'admin' | 'customer';
  message: string;
  attachments: SupportAttachment[];
  createdAt: string;
  isRead: boolean;
}
