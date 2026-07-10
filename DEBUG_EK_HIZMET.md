# 🔍 EK HİZMET DEBUG REHBERİ

## SORUN
Ek hizmet eklendi ama müşteri göremiyormuş.

## SEBEBİ
Eklediğiniz hizmetin `category` alanı **TAM OLARAK** `"Ek Hizmet"` olmalı.

Muhtemelen:
- "Genel" 
- "İçecek"
- "Kahvaltı"
- veya başka bir kategori seçmişsinizdir.

## ÇÖZÜM

### Yöntem 1: Mevcut Hizmeti Düzenle

1. **Dashboard → Hizmetler**
2. **"Kahvaltı"** servisini bul
3. **Düzenle** (kalem ikonu)
4. **Kategori dropdown'ını aç**
5. **"➕ Ek Hizmet (Kahvaltı, Transfer, Spa vb.)"** seçeneğini seç
6. **Kaydet**

### Yöntem 2: Yeni Hizmet Ekle (Tavsiye Edilen)

1. **Dashboard → Hizmetler → Yeni Hizmet Ekle**
2. **Kategori**: Dropdown'dan **"➕ Ek Hizmet"** seç (en altta)
3. **Hizmet Adı**: "Organik Kahvaltı"
4. **Açıklama**: "Taze mevsim ürünleriyle hazırlanan kahvaltı"
5. **Fiyat**: 150
6. **Fiyat Tipi**: "Kişi Başı" seç
7. **Kaydet**

## DOĞRULAMA

### Console Logları

Browser'da rezervasyon sayfasına gidin ve Console'u açın (F12):

```
🔍 All services from database: [{...}]
🏠 Rooms found: [...]
📦 Category-based extras: [...]  <-- Burası önemli!
```

Eğer `📦 Category-based extras: []` (boş) ise:
- Hizmetin category'si "Ek Hizmet" değil demektir
- Yukarıdaki uyarı logları görünecektir

### Firestore'da Kontrol

1. Firebase Console → Firestore Database
2. `services` collection
3. İlgili hizmeti bulun
4. `category` alanına bakın
5. **Tam olarak** `"Ek Hizmet"` yazmalı (boşluklar dahil)

## HATA AYIKLAMA

Eğer hala görünmüyorsa:

### 1. Console'da Şunu Görmelisiniz:
```
⚠️ Servis "Kahvaltı" ek hizmet DEĞİL çünkü category="Genel"
```

### 2. Hizmet İnaktif mi?
- `isActive: true` olmalı
- Dashboard'da hizmet aktif görünüyor mu?

### 3. Odayla Karışmış mı?
- Kategori "Oda", "Villa", "Bungalov" içermemeli
- Bunlar oda kategorisi olarak algılanır

## SONUÇ

✅ **Doğru Format**:
```json
{
  "name": "Organik Kahvaltı",
  "category": "Ek Hizmet",  // ← TAM OLARAK BU
  "price": 150,
  "pricingRules": {
    "priceType": "per-person"
  },
  "isActive": true
}
```

❌ **Yanlış Formatlar**:
```json
{ "category": "Genel" }           // Yanlış
{ "category": "Kahvaltı" }         // Yanlış
{ "category": "ek hizmet" }        // Küçük harf - Yanlış
{ "category": "Ek Hizmet " }       // Sonunda boşluk - Yanlış
{ "category": " Ek Hizmet" }       // Başında boşluk - Yanlış
```

---

**Son Güncelleme**: 8 Temmuz 2026
**Durum**: Debug modu aktif - console logları artık daha detaylı
