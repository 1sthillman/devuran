# Firestore Permission Error - ÇÖZÜM ✅

## Durum
1. ✅ **Dashboard yükleniyor** - Veriler başarıyla görüntüleniyor
2. ❌ **Usage stats güncellenemiyor** - Permission hatası (migration sonrası düzelecek)
3. ❌ **Subscription satın alma çalışmıyor** - Permission hatası (migration sonrası düzelecek)

## Kök Neden
Subscription dokümanlarının ID'si rastgele oluşturuluyordu. Firestore rules businessId'yi kontrol etmeye çalışıyordu ama ID'den businessId'ye erişemiyordu.

## Çözüm: Subscription ID = BusinessID

### Değişiklik
**Önceki:** Rastgele ID
```typescript
id: "abc123xyz"  // Rastgele
businessId: "DLbNzdU5yGTaA1xiSACC"
```

**Yeni:** ID = businessId
```typescript
id: "DLbNzdU5yGTaA1xiSACC"  // businessId ile aynı
businessId: "DLbNzdU5yGTaA1xiSACC"
```

### Avantajlar
1. ✅ Firestore Rules basit - `match /subscriptions/{businessId}` direkt kontrol
2. ✅ Query gereksiz - `getDoc(businessId)` ile direkt erişim
3. ✅ Performans - Index gerekmez
4. ✅ Her business'in 1 subscription'ı garantili

## Migration Gerekli! ⚠️

Mevcut subscription'ı migrate etmen gerekiyor:

### Firebase Console'dan Manuel Migration
1. https://console.firebase.google.com/project/ruloposs/firestore
2. `subscriptions` collection'ını aç
3. Mevcut dokümanı bul, `businessId` field'ını kopyala: `DLbNzdU5yGTaA1xiSACC`
4. "Add document" → Document ID: `DLbNzdU5yGTaA1xiSACC`
5. Tüm field'ları kopyala-yapıştır
6. Eski dokümanı sil

**Detaylı adımlar:** `SUBSCRIPTION_MIGRATION_GUIDE.md`

## Yapılan Değişiklikler

### 1. subscriptionService.ts
```typescript
// ✅ Direkt getDoc kullanımı
async getBusinessSubscription(businessId: string) {
  const docRef = doc(db, 'subscriptions', businessId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// ✅ ID = businessId
const subscription = {
  id: businessId,
  businessId,
  // ...
};
```

### 2. firestore.rules
```javascript
match /subscriptions/{businessId} {
  allow read: if true;
  allow create, update: if request.auth != null && 
                           exists(/databases/$(database)/documents/salons/$(businessId)) &&
                           get(/databases/$(database)/documents/salons/$(businessId)).data.ownerId == request.auth.uid;
  allow delete: if false;
  allow read, write: if isSuperAdmin();
}
```

## Migration Sonrası Test
- [ ] Dashboard yükleniyor
- [ ] Usage stats güncellenebiliyor
- [ ] Subscription satın alma çalışıyor
- [ ] Console'da hata yok

## Deployment
```bash
npx firebase deploy --only firestore:rules  # ✅ Tamamlandı
```

## Sıradaki Adım
**Migration yap!** Sonra tarayıcıyı yenile ve test et.
