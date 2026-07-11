# 🔍 HİZMETLER NEDEN GÖRÜNMÜYOR - DEBUG KILAVUZU

## ADIM 1: Migration Console Loglarını Kontrol Et

Migration butonuna bastıktan sonra **Chrome DevTools Console'da (F12)** şu logları görmelisiniz:

### ✅ **Başarılı Migration Örneği:**
```
📦 Migration başlıyor: 4 hizmet/masa services collection'a taşınacak...
📊 Mevcut durum: Collection'da 0 hizmet var
🔄 Taşınıyor: Masa TEST (ID: abc123, Kategori: MASA)
✅ Başarıyla taşındı: Masa TEST
🔄 Taşınıyor: Masa 1 (ID: def456, Kategori: MASA)
✅ Başarıyla taşındı: Masa 1
🔄 Taşınıyor: Masa 2 (ID: ghi789, Kategori: MASA)
✅ Başarıyla taşındı: Masa 2
🔄 Taşınıyor: Masa 3 (ID: jkl012, Kategori: MASA)
✅ Başarıyla taşındı: Masa 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 MİGRATION RAPORU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Başarılı: 4
⏭️ Atlandı: 0
❌ Hatalı: 0
📊 Toplam: 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ❌ **Hatalı Durum 1: Hiç Hizmet Yok**
```
ℹ️ Bu salonda taşınacak hizmet/masa yok (salon.services boş veya undefined)
```
**Çözüm**: Bu işletme hiç hizmet/masa eklememişse normal. Dashboard > Hizmetler'den eklenmeli.

### ❌ **Hatalı Durum 2: Hizmetler Var Ama Taşınmadı**
```
📦 Migration başlıyor: 4 hizmet/masa services collection'a taşınacak...
📊 Mevcut durum: Collection'da 0 hizmet var
🔄 Taşınıyor: Masa TEST (ID: abc123, Kategori: MASA)
❌ Hizmet taşınırken hata (Masa TEST): Error: ...
Service data: { ... }
```
**Çözüm**: Hata mesajına ve Service data'ya bakın. Sorun şunlardan biri olabilir:
- `salonId` eksik veya yanlış
- Firebase permissions
- Validation hatası

### ❌ **Hatalı Durum 3: Zaten Taşınmış**
```
📦 Migration başlıyor: 4 hizmet/masa services collection'a taşınacak...
📊 Mevcut durum: Collection'da 4 hizmet var
⏭️ Hizmet zaten var, atlanıyor: Masa TEST (ID: abc123)
⏭️ Hizmet zaten var, atlanıyor: Masa 1 (ID: def456)
⏭️ Hizmet zaten var, atlanıyor: Masa 2 (ID: ghi789)
⏭️ Hizmet zaten var, atlanıyor: Masa 3 (ID: jkl012)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 MİGRATION RAPORU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Başarılı: 0
⏭️ Atlandı: 4
❌ Hatalı: 0
📊 Toplam: 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
**Durum**: Hizmetler zaten collection'da! Sorun başka bir yerde.

---

## ADIM 2: Firebase Firestore'u Kontrol Et

### 2.1. Firebase Console'a Git
1. https://console.firebase.google.com/
2. Projenizi seçin
3. **Firestore Database** > **Data** sekmesine gidin

### 2.2. Services Collection'ını Kontrol Et
```
salons/{salonId}/services/{serviceId}
```

**Kontrol Edilmesi Gerekenler:**
- ✅ `services` collection'ı var mı?
- ✅ İçinde `salonId` ile filtrelenmiş documents var mı?
- ✅ `salonId` field'ı doğru mu? (ST CAFE'nin ID'si ile eşleşiyor mu?)
- ✅ `isActive: true` mu?
- ✅ `name`, `category`, `price` gibi alanlar dolu mu?

### 2.3. Salons Collection'ını Kontrol Et
```
salons/{salonId}
```

**Kontrol Edilmesi Gerekenler:**
- ✅ `salon.services` array'i var mı?
- ✅ İçinde 4 masa var mı?
- ✅ Her masa'nın `id`, `name`, `category` field'ları dolu mu?

---

## ADIM 3: Network Trafficini Kontrol Et

### 3.1. DevTools Network Sekmesini Aç
1. Chrome DevTools'u açın (F12)
2. **Network** sekmesine gidin
3. **Fetch/XHR** filtresini aktif edin

### 3.2. Rezervasyon Sayfasını Yenileyin
Şu request'i görmelisiniz:
```
GET /firestore/v1/.../services?...salonId=...
```

### 3.3. Response'u Kontrol Edin
**✅ Başarılı:**
```json
{
  "documents": [
    {
      "name": "Masa TEST",
      "salonId": "...",
      "category": "MASA",
      "price": 200,
      ...
    },
    ...
  ]
}
```

**❌ Boş:**
```json
{
  "documents": []
}
```

**Sorun**: Query yanlış veya `salonId` eşleşmiyor!

---

## ADIM 4: Debug Script Çalıştır

Console'da şu kodu çalıştırın:

```javascript
// ST CAFE'nin salon ID'sini bulun
const salonId = "nk5O1R45Vhqxi80fZTjr"; // URL'den alın

// Services collection'ını sorgula
const servicesRef = firebase.firestore()
  .collection('services')
  .where('salonId', '==', salonId);

servicesRef.get().then(snapshot => {
  console.log(`📊 Toplam ${snapshot.size} hizmet bulundu`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- ${data.name} (ID: ${doc.id}, Category: ${data.category})`);
  });
  
  if (snapshot.empty) {
    console.log('❌ Hiç hizmet bulunamadı! Migration başarısız olmuş olabilir.');
  }
});

// Salon.services array'ini kontrol et
firebase.firestore()
  .collection('salons')
  .doc(salonId)
  .get()
  .then(doc => {
    const salon = doc.data();
    console.log(`🏢 Salon.services array: ${salon.services?.length || 0} hizmet`);
    if (salon.services && salon.services.length > 0) {
      salon.services.forEach((s, i) => {
        console.log(`  ${i+1}. ${s.name} (ID: ${s.id})`);
      });
    }
  });
```

---

## ADIM 5: Manuel Migration (Son Çare)

Eğer automatic migration çalışmadıysa, manuel olarak yapalım:

### 5.1. Firestore Console'dan

1. `salons/{salonId}` document'ini açın
2. `services` array'ini kopyalayın
3. Her bir service için:
   ```
   Collection: services
   Document ID: Auto
   Fields:
     - salonId: {salonId}
     - name: "Masa 1"
     - category: "MASA"
     - price: 200
     - capacity: 4
     - isActive: true
     - ... (diğer alanlar)
   ```

### 5.2. Code İle (Önerilen)

Dashboard > Console'da şu kodu çalıştırın:

```javascript
const salonId = "nk5O1R45Vhqxi80fZTjr";
const db = firebase.firestore();

// Salon'u oku
db.collection('salons').doc(salonId).get().then(async (doc) => {
  const salon = doc.data();
  
  if (!salon.services || salon.services.length === 0) {
    console.log('❌ Salon.services boş!');
    return;
  }
  
  console.log(`📦 ${salon.services.length} hizmet taşınacak...`);
  
  for (const service of salon.services) {
    try {
      await db.collection('services').add({
        ...service,
        salonId: salonId,
        isActive: service.isActive !== false
      });
      console.log(`✅ ${service.name} taşındı`);
    } catch (err) {
      console.error(`❌ ${service.name} taşınamadı:`, err);
    }
  }
  
  console.log('✅ Migration tamamlandı! Sayfayı yenileyin.');
});
```

---

## ADIM 6: Sorun Devam Ediyorsa

### Olası Sebepler:

1. **Yanlış Wizard Kullanılıyor**
   - Restoran `reservation` model kullanıyor ama `order` wizard açılıyor
   - Çözüm: `salon.capabilities.bookingModels` kontrol et

2. **Cache Problemi**
   - Browser cache'i silip hard refresh yapın (Ctrl+Shift+R)
   - Incognito mode'da deneyin

3. **Firebase Permissions**
   - Firestore Rules'da `services` collection'a read izni var mı?
   - Console'da permission denied hatası var mı?

4. **Code Bug**
   - `servicesService.getBySalon()` doğru collection'ı mı sorguluyor?
   - `salonId` parameter'ı doğru mu?

---

## ✅ ÇÖZÜM CHECKLIST

- [ ] Console'da migration loglarını gördüm
- [ ] Migration raporu 4 başarılı gösterdi
- [ ] Firebase'de `services` collection'ında 4 document var
- [ ] Her document'ta `salonId` doğru
- [ ] Network tab'de services query başarılı
- [ ] Response'da 4 hizmet dönüyor
- [ ] Sayfa yenilendi, hâlâ "Henüz Ürün Yok"
- [ ] Cache silindi, sorun devam ediyor

**Eğer tüm checklistler ✅ ise ama sorun devam ediyorsa:**
→ Kod seviyesinde bir bug var. Daha derin investigation gerekli.

---

## 🆘 HIZLI DESTEK

Bu dokümandaki adımları takip ettikten sonra şu bilgileri paylaşın:

1. **Migration console logları** (tam çıktı)
2. **Firebase Firestore screenshot** (`services` collection)
3. **Network tab screenshot** (services query response)
4. **Salon ID** (URL'den)
5. **Hata mesajları** (varsa)

Bu bilgilerle sorunu 5 dakikada çözebiliriz! 🚀
