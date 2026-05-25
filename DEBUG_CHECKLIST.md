# Debug Checklist - Subscription Permission Error

## Kontrol Edilmesi Gerekenler

### 1. Kullanıcı Bilgileri
Console'da şu logları kontrol et:
- `Loading subscription for salonId: DLbNzdU5yGTaA1xiSACC` ✅
- `Loading data for salonId: DLbNzdU5yGTaA1xiSACC` ✅

**Kullanıcının salonId'si:** `DLbNzdU5yGTaA1xiSACC`

### 2. Firebase Console Kontrolleri

#### A. Salons Collection
1. https://console.firebase.google.com/project/ruloposs/firestore
2. `salons` collection'ını aç
3. `DLbNzdU5yGTaA1xiSACC` ID'li dokümanı bul
4. Kontrol et:
   - [ ] Doküman var mı?
   - [ ] `ownerId` field'ı var mı?
   - [ ] `ownerId` değeri kullanıcının UID'si ile eşleşiyor mu?

**Kullanıcının UID'sini bulmak için:**
- Firebase Console > Authentication > Users
- Giriş yaptığın email'i bul
- UID'yi kopyala

#### B. Subscriptions Collection
1. `subscriptions` collection'ını aç
2. Kontrol et:
   - [ ] `DLbNzdU5yGTaA1xiSACC` ID'li doküman var mı?
   - [ ] Varsa, tüm field'ları not et
   - [ ] Yoksa, yeni oluşturulacak

### 3. Firestore Rules Test

Firebase Console'da Rules Playground kullan:
1. https://console.firebase.google.com/project/ruloposs/firestore/rules
2. "Rules Playground" sekmesine tıkla
3. Test et:

**Test 1: Subscription Okuma**
```
Location: /subscriptions/DLbNzdU5yGTaA1xiSACC
Operation: get
Authenticated: Yes
UID: [Kullanıcının UID'si]
```

**Test 2: Subscription Yazma**
```
Location: /subscriptions/DLbNzdU5yGTaA1xiSACC
Operation: create
Authenticated: Yes
UID: [Kullanıcının UID'si]
Data:
{
  "id": "DLbNzdU5yGTaA1xiSACC",
  "businessId": "DLbNzdU5yGTaA1xiSACC",
  "status": "pending"
}
```

### 4. Olası Sorunlar ve Çözümler

#### Sorun 1: Salon Dokümanı Yok
**Belirti:** Rules test'i "Document not found" hatası veriyor
**Çözüm:** Salon dokümanını oluştur veya kullanıcının salonId'sini güncelle

#### Sorun 2: ownerId Eşleşmiyor
**Belirti:** Rules test'i "Permission denied" veriyor
**Çözüm:** Salon dokümanının ownerId'sini kullanıcının UID'si ile güncelle

#### Sorun 3: ownerId Field'ı Yok
**Belirti:** Salon dokümanı var ama ownerId field'ı yok
**Çözüm:** Salon dokümanına ownerId field'ı ekle

### 5. Hızlı Çözüm

Eğer salon dokümanı varsa ama ownerId yanlışsa:

1. Firebase Console > Firestore > salons > DLbNzdU5yGTaA1xiSACC
2. "Edit document" butonuna tıkla
3. `ownerId` field'ını bul (yoksa ekle)
4. Değeri kullanıcının UID'si ile değiştir
5. Save

### 6. Test Sonrası

Tarayıcıyı yenile ve:
- [ ] Dashboard yükleniyor
- [ ] Subscription satın alma çalışıyor
- [ ] Console'da hata yok

## Sıradaki Adım

Yukarıdaki kontrolleri yap ve sonuçları buraya not et. Hangi adımda sorun olduğunu bulalım.
