# 🔴 KRİTİK - FİYAT HESAPLAMA TEST SENARYOLARI

## ⚠️ SORUN
Fiyat hesaplamasında kritik hata bulundu ve düzeltildi.

**Hata:** `perNight` kuralı varsa sadece ek geceleri hesaplıyordu, yoksa tüm geceleri çarpıyordu.

**Sonuç:** Bazı durumlarda fiyat yanlış hesaplanıyordu.

---

## ✅ DÜZELTİLDİ

### Frontend
- `src/components/booking/wizards/NightlyBookingWizard.tsx` → Satır 155-195
- Detaylı console.log eklendi

### Backend
- `functions/src/reservations.ts` → Satır 66-88
- Aynı mantık backend'e de uygulandı

---

## 🧪 TEST SENARYOLARI

### TEST 1: Basit Oda (pricingRules YOK)
```
Oda: Standart Bungalov
Price: 1500₺
Nights: 2
Guests: 2

BEKLENEN: 1500 × 2 = 3000₺
```

### TEST 2: perPerson Kuralı VAR
```
Oda: Aile Bungalov
basePrice: 2000₺
perPerson: 500₺
Nights: 2
Guests: 3 (2 + 1 çocuk)

HESAPLAMA:
1. Base = 2000₺
2. Ek kişi = 500₺ × (3-1) = 1000₺
3. İlk gece = 2000 + 1000 = 3000₺
4. perNight YOK → 3000 × 2 gece = 6000₺

BEKLENEN: 6000₺
```

### TEST 3: perNight Kuralı VAR
```
Oda: Lüks Bungalov
basePrice: 3500₺
perPerson: 0
perNight: 3000₺
Nights: 2
Guests: 2

HESAPLAMA:
1. İlk gece = 3500₺
2. İkinci gece = 3000₺
3. Toplam = 3500 + 3000 = 6500₺

BEKLENEN: 6500₺
```

### TEST 4: perPerson + perNight VARSA
```
Oda: VIP Bungalov
basePrice: 4000₺
perPerson: 1000₺
perNight: 3500₺
Nights: 3
Guests: 4

HESAPLAMA:
1. Base = 4000₺
2. Ek kişi = 1000₺ × (4-1) = 3000₺
3. İlk gece = 4000 + 3000 = 7000₺
4. İkinci gece = 3500₺
5. Üçüncü gece = 3500₺
6. Toplam = 7000 + 3500 + 3500 = 14000₺

BEKLENEN: 14000₺
```

### TEST 5: Ek Hizmet - Sabit
```
Extra: Havaalanı Transferi
basePrice: 500₺
priceType: fixed
Nights: 3
Guests: 4

HESAPLAMA: 500₺ (sabit)

BEKLENEN: 500₺
```

### TEST 6: Ek Hizmet - Kişi Başı
```
Extra: Kahvaltı
basePrice: 150₺
priceType: per-person
Nights: 2
Guests: 3

HESAPLAMA: 150 × 3 = 450₺

BEKLENEN: 450₺
```

### TEST 7: Ek Hizmet - Gece Başı
```
Extra: Otopark
basePrice: 100₺
priceType: per-night
Nights: 3
Guests: 2

HESAPLAMA: 100 × 3 = 300₺

BEKLENEN: 300₺
```

### TEST 8: Ek Hizmet - Kişi+Gece
```
Extra: Akşam Yemeği
basePrice: 200₺
priceType: per-person-per-night
Nights: 2
Guests: 3

HESAPLAMA: 200 × 3 × 2 = 1200₺

BEKLENEN: 1200₺
```

### TEST 9: FULL SENARYO (Ekran Görüntüsündeki)
```
Oda: Standart Bungalov (2 Kişi)
price: 7500₺ (varsayılan, pricingRules YOK)
Nights: 1
Guests: 2

Ek Hizmet 1: Kahvaltı (Kişi Başı)
basePrice: 150₺
priceType: per-person

Ek Hizmet 2: Akşam Yemeği (Kişi Başı)
basePrice: 300₺
priceType: per-person

HESAPLAMA:
1. Oda = 7500 × 1 = 7500₺
2. Kahvaltı = 150 × 2 = 300₺
3. Akşam Yemeği = 300 × 2 = 600₺ (600₺ DEĞİL 300₺!)
4. Toplam = 7500 + 300 + 600 = 8400₺

⚠️ EKRAN GÖRÜNTÜSÜNDEKİ HATA: 8100₺ gösteriyordu
✅ DOĞRU: 8400₺ olmalı
```

---

## 🔍 MANUEL TEST ADIMLARI

1. **Dev Tools Aç:** F12 → Console
2. **Rezervasyon Yap:** 
   - Oda seç
   - Ek hizmet ekle
   - Console'da şu logları gör:

```javascript
💰 [ROOM PRICE DEBUG] {
  selectedRoom: "Standart Bungalov",
  basePrice: 7500,
  perPerson: undefined,
  perNight: undefined,
  totalGuests: 2,
  nights: 1,
  calculation: "(7500 + 0 × 1 kişi) × 1 gece",
  finalRoomPrice: 7500
}

✨ [EXTRA PRICE DEBUG] {
  extraName: "Kahvaltı (Kişi Başı)",
  basePrice: 150,
  priceType: "per-person",
  totalGuests: 2,
  nights: 1,
  calculation: "150 × 2 kişi",
  extraPrice: 300
}

✨ [EXTRA PRICE DEBUG] {
  extraName: "Akşam Yemeği (Kişi Başı)",
  basePrice: 300,
  priceType: "per-person",
  totalGuests: 2,
  nights: 1,
  calculation: "300 × 2 kişi",
  extraPrice: 600
}

🎯 [TOTAL PRICE] {
  roomPrice: 7500,
  extrasTotal: 900,
  totalPrice: 8400,
  nights: 1,
  guests: 2
}
```

3. **Fiyatı Kontrol Et:** UI'da gösterilen fiyat console'dakiyle aynı mı?

---

## ⚠️ BULUNAN HATALAR

### HATA 1: perNight mantığı yanlış
**Sebep:** `else` bloğunda çarpma yapılıyordu
```typescript
// ❌ YANLIŞ
if (nights > 1 && rules.perNight) {
  total = total + (rules.perNight * (nights - 1));
} else {
  total = total * nights; // ❌ perNight varken de çarpıyordu!
}
```

**Düzeltme:**
```typescript
// ✅ DOĞRU
if (rules.perNight) {
  if (nights > 1) {
    total = total + (rules.perNight * (nights - 1));
  }
} else {
  total = total * nights;
}
```

---

## 📊 TEST SONUÇLARI

| Test | Beklenen | Gerçek | Durum |
|------|----------|--------|-------|
| Test 1 | 3000₺ | ___₺ | ⏳ |
| Test 2 | 6000₺ | ___₺ | ⏳ |
| Test 3 | 6500₺ | ___₺ | ⏳ |
| Test 4 | 14000₺ | ___₺ | ⏳ |
| Test 5 | 500₺ | ___₺ | ⏳ |
| Test 6 | 450₺ | ___₺ | ⏳ |
| Test 7 | 300₺ | ___₺ | ⏳ |
| Test 8 | 1200₺ | ___₺ | ⏳ |
| Test 9 | 8400₺ | ___₺ | ⏳ |

---

## ✅ ONAY

- [ ] Tüm testler başarılı
- [ ] Console logları kontrol edildi
- [ ] UI fiyatları doğru
- [ ] Backend fiyatları doğru (Cloud Function deploy edildiğinde)
- [ ] Bu dosya silinebilir

---

**Tarih:** 2026-07-09  
**Durum:** 🔴 KRİTİK FİX YAPILDI - TEST BEKLENİYOR
