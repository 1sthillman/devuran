# Takvim Düzeltmesi - Personel Seçimi Gerekli ✅

## Sorun
Takvimde tüm günler kırmızı çapraz görünüyordu çünkü:
- Personel seçilmeden availability kontrolü yapılıyordu
- Personel olmadan slot bulunamıyordu
- Bu yüzden tüm günler "dolu" olarak işaretleniyordu

## Çözüm
Availability kontrolü **sadece personel seçildikten sonra** yapılıyor.

### Değişiklikler

#### 1. SlotBookingWizard.tsx
```tsx
// ÖNCE (HATALI):
<ModernCalendar
  businessId={salon.id}  // Her zaman kontrol yapıyordu
  staffId={selectedStaffId || undefined}
/>

// SONRA (DOĞRU):
<ModernCalendar
  businessId={selectedStaffId ? salon.id : undefined}  // Personel varsa kontrol yap
  staffId={selectedStaffId || undefined}
/>
```

#### 2. ModernCalendar.tsx
```tsx
// Availability kontrolü sadece businessId VE staffId varsa
useEffect(() => {
  if (businessId && staffId) {
    checkMonthAvailability();
  } else {
    setAvailabilityMap(new Map());  // Temizle
  }
}, [currentMonth, currentYear, businessId, serviceDuration, staffId]);
```

#### 3. Gün Disabled Mantığı
```tsx
// Personel seçilmemişse availability kontrolü yapma
const shouldCheckAvailability = businessId !== undefined && staffId !== undefined;

isDisabled: isPast || isClosed || isBeforeMin || isAfterMax || 
  (shouldCheckAvailability && !hasAvailability)
```

#### 4. Görsel Feedback
```tsx
// Kırmızı çapraz sadece personel seçiliyse göster
day.isDisabled && !day.hasAvailability && businessId && staffId && 
  'text-red-400/60 bg-red-500/5 border border-red-500/20'
```

## Akış

### 1. Hizmet Seçimi
- Kullanıcı hizmet seçer
- "Devam Et" butonuna tıklar
- Personel adımına geçer

### 2. Personel Seçimi (Opsiyonel)
- **Personel YOK** → Tarih adımına geç, takvim normal
- **Personel VAR** → Tarih adımına geç, availability kontrolü başla

### 3. Tarih Seçimi
#### Personel Seçilmemişse:
- Tüm günler normal (seçilebilir)
- Sadece geçmiş ve kapalı günler disabled
- Kırmızı çapraz YOK

#### Personel Seçiliyse:
- Availability kontrolü yapılır
- Müsait günler → Normal
- Dolu günler → Kırmızı çapraz
- Kapalı günler → Gri çizgili

### 4. Saat Seçimi
- Seçilen güne göre müsait saatler gösterilir
- Personel seçiliyse → o personelin müsait saatleri
- Personel seçilmemişse → tüm personellerin müsait saatleri

## Mantık

### Personel Seçilmemiş
```
Hizmet Seç → Personel Atla → Tarih Seç (tüm günler normal) → Saat Seç (herhangi bir personel)
```

### Personel Seçilmiş
```
Hizmet Seç → Personel Seç → Tarih Seç (availability kontrolü) → Saat Seç (seçili personel)
```

## Avantajlar

✅ **Esneklik** - Personel seçmek opsiyonel
✅ **Performans** - Gereksiz API çağrısı yok
✅ **UX** - Kullanıcı personel seçmeden de randevu alabilir
✅ **Akıllı** - Personel seçilince dolu günler gösterilir
✅ **Hızlı** - Personel seçilmezse anında tarih seçilebilir

## Test Senaryoları

### Senaryo 1: Personel Seçmeden
1. Hizmet seç (Saç Kesim)
2. Personel adımını atla (Devam Et)
3. Takvimi aç
4. **Sonuç**: Tüm günler normal, kırmızı çapraz YOK
5. Tarih seç
6. Saat seç → Tüm personellerin müsait saatleri

### Senaryo 2: Personel Seçerek
1. Hizmet seç (Saç Kesim)
2. Personel seç (SEDAT)
3. Takvimi aç
4. **Sonuç**: Dolu günler kırmızı çapraz
5. Müsait gün seç
6. Saat seç → SEDAT'ın müsait saatleri

## Sonuç

Artık takvim akıllı çalışıyor:
- Personel seçilmemişse → Normal takvim
- Personel seçiliyse → Availability kontrolü + kırmızı çapraz

Bu sayede kullanıcı deneyimi iyileşti ve gereksiz API çağrıları önlendi.
