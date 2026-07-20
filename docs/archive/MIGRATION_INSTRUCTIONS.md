# ⚠️ Acil: ownerId Migration Talimatları

## Sorun

Veritabanındaki mevcut salon'da `ownerId` field'ı yok:
```
Salon ownerId: undefined
Match? false
❌ FirebaseError: Missing or insufficient permissions
```

## ✅ Çözüm: Otomatik Migration Butonu

### Adım 1: Dashboard'a Git
1. https://app-ruby-ten-20.vercel.app adresine git
2. Login ol (owner hesabıyla)
3. Dashboard → **Ayarlar** sekmesine tıkla

### Adım 2: Migration Butonunu Gör
Ayarlar sekmesinin **en üstünde** kırmızı bir uyarı kutusu göreceksin:

```
⚠️ Veritabanı Güncellemesi Gerekli

İşletmenizde ownerId field'ı eksik. 
Bu yüzden ayarları güncelleyemiyorsunuz. 
Aşağıdaki butona tıklayarak otomatik düzeltme yapabilirsiniz.

[🗄️ Otomatik Düzelt]
```

### Adım 3: Migration'ı Çalıştır
1. **"Otomatik Düzelt"** butonuna tıkla
2. Onay dialogunda **"Tamam"** de
3. Console'u aç (F12) ve migration loglarını izle:
   ```
   🔄 Starting salon ownerId migration...
   🔍 Finding owner for salon DLbNzdU5yGTaA1xiSACC...
   ✅ Found owner 50lkKgP3sOctMyk48gn7WWKQnJ43 for salon DLbNzdU5yGTaA1xiSACC
   ✅ Updated salon DLbNzdU5yGTaA1xiSACC with ownerId 50lkKgP3sOctMyk48gn7WWKQnJ43
   
   📊 Migration Summary:
   ✅ Updated: 1
   ⏭️  Skipped: 0
   ❌ Errors: 0
   📝 Total: 1
   ```
4. Başarılı mesajı göreceksin: **"✅ Migration tamamlandı! 1 salon güncellendi."**
5. Sayfa otomatik yenilenecek

### Adım 4: Test Et
1. Kırmızı uyarı kutusu **kaybolmalı** (artık ownerId var)
2. **Çalışma Saatlerini** değiştirmeyi dene:
   - Hızlı Ayar'dan saat seç
   - "Tümüne Uygula" tıkla
   - "Değişiklikleri Kaydet" tıkla
   - Console'da `Match? true` ✅ göreceksin
   - Artık kaydediyor!

3. **Randevu Sistemini** toggle et:
   - Toggle butonuna tıkla
   - Console'da `Match? true` ✅ göreceksin
   - Artık çalışıyor!

## Migration Nasıl Çalışıyor?

```typescript
// 1. Tüm salonları oku
const salons = await getDocs(collection(db, 'salons'));

// 2. ownerId olmayan salonları bul
for (const salon of salons) {
  if (!salon.ownerId) {
    // 3. Bu salon'a sahip user'ı bul
    const users = await getDocs(
      query(collection(db, 'users'), where('salonId', '==', salon.id))
    );
    
    // 4. Salon'a ownerId ekle
    await updateDoc(doc(db, 'salons', salon.id), {
      ownerId: users[0].id
    });
  }
}
```

## Beklenen Sonuç

**Önce**:
```javascript
{
  id: "DLbNzdU5yGTaA1xiSACC",
  name: "Sedat'ın Salonu",
  // ownerId: YOK ❌
}
```

**Sonra**:
```javascript
{
  id: "DLbNzdU5yGTaA1xiSACC",
  name: "Sedat'ın Salonu",
  ownerId: "50lkKgP3sOctMyk48gn7WWKQnJ43" // ✅ EKLENDI
}
```

## Sorun Giderme

### Migration Butonu Görünmüyor
- Salon'da zaten `ownerId` var demektir
- Console'da kontrol et: `console.log(salon.ownerId)`

### Migration Başarısız Oldu
1. Console'da hata mesajını kontrol et
2. Firestore rules'u kontrol et
3. User'ın `salonId` field'ı doğru mu kontrol et

### Hala Permission Denied Alıyorum
1. Sayfa yenilemeyi dene (Ctrl+F5)
2. Console'da kontrol et:
   ```javascript
   console.log('Salon ownerId:', salon.ownerId);
   console.log('User UID:', user.uid);
   console.log('Match?', salon.ownerId === user.uid);
   ```
3. Match `true` olmalı

## Deployment

**Production URL**: https://app-ruby-ten-20.vercel.app

**Status**: ✅ Deployed with migration button

## Sonraki Adımlar

Migration başarılı olduktan sonra:
1. ✅ Çalışma saatleri güncellenebilir
2. ✅ Randevu sistemi toggle edilebilir
3. ✅ Tüm salon ayarları çalışır
4. ✅ Permission denied hatası gitmez

## Not

Bu migration **sadece bir kez** çalıştırılmalı. Sonrasında tüm yeni salonlar otomatik olarak `ownerId` ile oluşturulacak.
