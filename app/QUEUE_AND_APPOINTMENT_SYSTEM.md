# Kapsamlı Randevu ve Sıra Yönetim Sistemi

## 📋 Genel Bakış

Bu belge, randevu sisteminin tüm özelliklerini ve mantığını detaylı olarak açıklar.

## 🎯 Temel Özellikler

### 1. Randevu Onay Sistemi

#### Otomatik Onay
- **Randevusuz (Walk-in) Hizmetler**: Otomatik olarak `confirmed` statüsünde oluşturulur
- **İşletme Ayarı**: `salon.settings.autoConfirm = true` ise tüm randevular otomatik onaylanır
- **Sıraya Alma**: Sıradan randevuya dönüşen rezervasyonlar otomatik onaylanır

#### Manuel Onay
- `salon.settings.autoConfirm = false` ise randevular `pending` statüsünde başlar
- İşletme sahibi dashboard'dan onaylar veya reddeder

### 2. İptal Sistemi

#### Müşteri İptali
```typescript
// Müşteri kendi randevusunu iptal edebilir
interface CancellationByCustomer {
  appointmentId: string;
  userId: string; // Randevuyu alan kişi
  reason?: 'schedule_conflict' | 'personal' | 'found_alternative' | 'other';
  customReason?: string;
  cancelledAt: Timestamp;
  cancelledBy: 'customer';
}
```

**İptal Kuralları**:
- Müşteri sadece `pending`, `confirmed`, `upcoming` statüsündeki randevuları iptal edebilir
- `completed` veya `cancelled` randevular iptal edilemez
- İptal sonrası sıra sistemi otomatik çalışır

#### İşletme İptali
```typescript
// İşletme randevuyu iptal edebilir
interface CancellationBySalon {
  appointmentId: string;
  salonId: string;
  reason: 'staff_unavailable' | 'emergency' | 'customer_issue' | 'no_show' | 'other';
  customReason?: string;
  cancelledAt: Timestamp;
  cancelledBy: 'salon';
  notifyCustomer: boolean; // Müşteriye bildirim gönderilsin mi?
}
```

**İptal Nedenleri**:
- `staff_