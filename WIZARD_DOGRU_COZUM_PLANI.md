# 🎯 WIZARD STANDARDIZASYON - DOĞRU ÇÖZÜM PLANI

## 📋 HER WIZARD'IN AMACINA GÖRE ANALİZ

### ✅ SlotBookingWizard (RANDEVU) - MEVCUT DURUM İYİ
**Amaç:** Kuaför, berber, güzellik merkezi randevuları
**Mevcut Form Alanları:**
- ✅ Hizmet seçimi
- ✅ Personel seçimi
- ✅ Tarih seçimi (ModernCalendar)
- ✅ SAAT SEÇİMİ (TimeSlotGrid) - **DOĞRU, KALMALI**
- ✅ İsim, telefon, email, notlar
- ✅ Adres + GPS konum desteği
- ✅ Kapora bilgisi

**YAPILACAK:** HİÇBİR ŞEY ✅ MÜKEMMEL

---

### ⚠️ DailyRentalWizard (MEKAN KİRALAMA) - EKSİKLER VAR
**Amaç:** Düğün salonu, toplantı salonu, etkinlik alanı kiralama
**Mevcut Form Alanları:**
- ✅ Tarih seçimi
- ✅ Etkinlik tipi (Düğün, nişan, doğum günü...)
- ✅ Misafir sayısı
- ✅ Paket seçimi
- ✅ İsim, telefon, email, notlar
- ❌ **ETKİNLİK BAŞLANGIÇ SAATİ YOK**
- ❌ **ETKİNLİK ADRESİ YOK** (Eğer dış mekan ise önemli)

**YAPILACAK EKLEMELER:**
```typescript
1. Etkinlik Başlangıç Saati
   - Input type="time" veya select
   - Örnek: "18:00", "19:00", "20:00"
   - Step 1'de tarihten sonra eklenecek

2. Etkinlik Adresi (Opsiyonel)
   - Sadece mekan işletmede değilse
   - Input + GPS butonu
   - Step 3'te (iletişim bilgilerinde)
```

---

### ⚠️ NightlyBookingWizard (KONAKLAMA) - SABİT SAATLER YETERLİ
**Amaç:** Otel, pansiyon, butik otel rezervasyonu
**Mevcut Form Alanları:**
- ✅ Check-in tarihi
- ✅ Check-out tarihi
- ✅ Gece sayısı otomatik hesaplama
- ✅ Yetişkin + çocuk sayısı
- ✅ Oda tipi seçimi
- ✅ Ek hizmetler
- ✅ İsim, telefon, email, özel istekler
- ⚠️ **CHECK-IN/OUT SAATİ YOK**

**YAPILACAK EKLEMELER:**
```typescript
1. Check-in/Check-out Saatleri
   - Sabit bilgi olarak gösterilecek (14:00 / 11:00)
   - Değiştirilemez, sadece bilgi amaçlı
   - "Özel Saatler" için notlara yazabilirler
   
   <div className="info-badge">
     <Clock /> Check-in: 14:00 | Check-out: 11:00
   </div>
```

---

### ⚠️ ProjectBookingWizard (ORGANİZASYON) - EKSİKLER VAR
**Amaç:** Düğün, nişan organizasyonu (3+ ay önceden)
**Mevcut Form Alanları:**
- ✅ Etkinlik tipi
- ✅ Etkinlik tarihi (90 gün önceden)
- ✅ Misafir sayısı
- ✅ Bütçe aralığı
- ✅ Paket seçimi
- ✅ İsim, telefon, email, notlar
- ❌ **ETKİNLİK BAŞLANGIÇ SAATİ YOK**
- ❌ **ETKİNLİK ADRESİ YOK**

**YAPILACAK EKLEMELER:**
```typescript
1. Etkinlik Başlangıç Saati
   - Select veya input type="time"
   - Step 1'de eklenecek
   
2. Etkinlik Adresi
   - Input + GPS butonu
   - Step 4'te (iletişim kısmında)
```

---

### ✅ OrderBookingWizard (SİPARİŞ) - REFERANS ALINICAK
**Amaç:** Yemek, pasta, ürün siparişi
**Mevcut Form Alanları:**
- ✅ Ürün seçimi + miktar
- ✅ Teslimat tarihi
- ✅ **TESLİMAT SAATİ** (AppleTimePicker) ✅
- ✅ **TESLİMAT ADRESİ** (Input + GPS) ✅
- ✅ İsim, telefon, email, notlar
- ✅ Toplam tutar

**YAPILACAK:** HİÇBİR ŞEY ✅ ÖRNEK ALINACAK

---

## 🔧 DETAYLI UYGULAMA

### A. DailyRentalWizard Güncellemeleri

#### 1. Etkinlik Başlangıç Saati (Step 1)
```typescript
// Step 1'de misafir sayısından sonra ekle
<div>
  <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">
    Etkinlik Başlangıç Saati
  </h4>
  <input
    type="time"
    value={eventStartTime}
    onChange={(e) => setEventStartTime(e.target.value)}
    className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] outline-none focus:border-purple-500/50"
  />
</div>
```

#### 2. Etkinlik Adresi (Step 3 - İletişim)
```typescript
// Step 3'te email'den sonra ekle
<div>
  <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">
    Etkinlik Adresi (Opsiyonel)
  </h4>
  <div className="flex items-center gap-2">
    <input
      type="text"
      value={eventAddress}
      onChange={(e) => setEventAddress(e.target.value)}
      placeholder="Tam adres..."
      className="flex-1 h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]..."
    />
    <button
      onClick={handleGetLocation}
      disabled={gettingLocation}
      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20..."
    >
      {gettingLocation ? <Loader2 className="animate-spin" /> : <MapPin />}
    </button>
  </div>
</div>
```

#### 3. State Eklemeleri
```typescript
const [eventStartTime, setEventStartTime] = useState<string>('18:00');
const [eventAddress, setEventAddress] = useState<string>('');
const [gpsLocation, setGpsLocation] = useState<{lat: number; lng: number} | null>(null);
const [gettingLocation, setGettingLocation] = useState(false);
```

#### 4. Submit'e Ekle
```typescript
setEventDetails({
  eventDate: selectedDate ? formatDateToString(selectedDate) : undefined,
  eventStartTime, // 🆕
  eventType: selectedEventType || 'other',
  capacity: guestCount,
  selectedPackage: selectedPkg,
  eventAddress, // 🆕
  gpsLocation, // 🆕
  totalPrice: selectedPkg.price
});
```

---

### B. NightlyBookingWizard Güncellemeleri

#### 1. Check-in/out Saat Bilgisi (Step 1)
```typescript
// Gece sayısı badge'inden sonra ekle
{nights > 0 && (
  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
    <div className="flex items-center justify-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-blue-400" />
        <span className="text-blue-300">
          <strong>Check-in:</strong> 14:00
        </span>
      </div>
      <div className="w-px h-4 bg-white/20" />
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-cyan-400" />
        <span className="text-cyan-300">
          <strong>Check-out:</strong> 11:00
        </span>
      </div>
    </div>
    <p className="text-xs text-center text-[var(--muted-lead)] mt-2">
      Özel saat talebi için lütfen notlar bölümünü kullanın
    </p>
  </div>
)}
```

#### 2. Submit'e Ekle
```typescript
setAccommodationDetails({
  checkIn: checkInDate ? formatDateToString(checkInDate) : undefined,
  checkInTime: '14:00', // 🆕 Sabit
  checkOut: checkOutDate ? formatDateToString(checkOutDate) : undefined,
  checkOutTime: '11:00', // 🆕 Sabit
  guests,
  roomType: selectedRoom?.id,
  selectedPackage: selectedRoom,
  extras: selectedExtras.map(id => extraServices.find(e => e.id === id)).filter(Boolean),
  totalPrice,
  specialRequests
});
```

---

### C. ProjectBookingWizard Güncellemeleri

#### 1. Etkinlik Başlangıç Saati (Step 1)
```typescript
// Etkinlik tarihi calendar'dan sonra ekle
<div>
  <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">
    Etkinlik Başlangıç Saati
  </h4>
  <input
    type="time"
    value={eventStartTime}
    onChange={(e) => setEventStartTime(e.target.value)}
    className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] outline-none focus:border-purple-500/50"
  />
</div>
```

#### 2. Etkinlik Adresi (Step 4 - İletişim)
```typescript
// Step 4'te notlardan önce ekle
<div>
  <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">
    Etkinlik Adresi
  </h4>
  <div className="flex items-center gap-2">
    <input
      type="text"
      value={eventAddress}
      onChange={(e) => setEventAddress(e.target.value)}
      placeholder="Etkinlik yapılacak adres..."
      className="flex-1 h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]..."
    />
    <button onClick={handleGetLocation} disabled={gettingLocation} className="w-12 h-12 rounded-2xl...">
      {gettingLocation ? <Loader2 className="animate-spin" /> : <MapPin />}
    </button>
  </div>
</div>
```

#### 3. State Eklemeleri
```typescript
const [eventStartTime, setEventStartTime] = useState<string>('18:00');
const [eventAddress, setEventAddress] = useState<string>('');
const [gpsLocation, setGpsLocation] = useState<{lat: number; lng: number} | null>(null);
const [gettingLocation, setGettingLocation] = useState(false);
```

#### 4. Submit'e Ekle
```typescript
setEventDetails({
  eventDate: localEventDate,
  eventStartTime, // 🆕
  eventType: localEventType,
  guestCount: localGuestCount,
  budget: localBudget,
  selectedPackage: localPackage,
  eventAddress, // 🆕
  gpsLocation // 🆕
});
```

---

## 📊 İŞLETME PANELİ - RANDEVU DETAYLARI

### Tüm Wizard'lardan Gelen Bilgilerin Gösterimi

```typescript
// ReservationDetailsModal veya OwnerDashboard'da
<div className="reservation-details">
  {/* Ortak Bilgiler */}
  <InfoRow label="Müşteri" value={reservation.customerName} />
  <InfoRow label="Telefon" value={reservation.customerPhone} />
  <InfoRow label="Email" value={reservation.customerEmail} />
  
  {/* Wizard Tipine Göre */}
  {reservation.type === 'slot' && (
    <>
      <InfoRow label="Tarih" value={reservation.date} />
      <InfoRow label="Saat" value={reservation.time} />
      <InfoRow label="Hizmetler" value={reservation.services.join(', ')} />
      <InfoRow label="Personel" value={reservation.staffName} />
      {reservation.address && <InfoRow label="Adres" value={reservation.address} icon={<MapPin />} />}
      {reservation.location && <MapButton lat={reservation.location.lat} lng={reservation.location.lng} />}
    </>
  )}
  
  {reservation.type === 'daily' && (
    <>
      <InfoRow label="Etkinlik Tarihi" value={reservation.eventDate} />
      <InfoRow label="Başlangıç Saati" value={reservation.eventStartTime} icon={<Clock />} />
      <InfoRow label="Etkinlik Tipi" value={reservation.eventType} />
      <InfoRow label="Misafir Sayısı" value={reservation.guestCount} />
      <InfoRow label="Paket" value={reservation.packageName} />
      {reservation.eventAddress && <InfoRow label="Etkinlik Adresi" value={reservation.eventAddress} icon={<MapPin />} />}
    </>
  )}
  
  {reservation.type === 'nightly' && (
    <>
      <InfoRow label="Check-in" value={`${reservation.checkInDate} - ${reservation.checkInTime}`} />
      <InfoRow label="Check-out" value={`${reservation.checkOutDate} - ${reservation.checkOutTime}`} />
      <InfoRow label="Gece Sayısı" value={reservation.nights} />
      <InfoRow label="Misafirler" value={`${reservation.adults} yetişkin, ${reservation.children} çocuk`} />
      <InfoRow label="Oda" value={reservation.roomType} />
    </>
  )}
  
  {reservation.type === 'project' && (
    <>
      <InfoRow label="Etkinlik Tarihi" value={reservation.eventDate} />
      <InfoRow label="Başlangıç Saati" value={reservation.eventStartTime} icon={<Clock />} />
      <InfoRow label="Etkinlik Tipi" value={reservation.eventType} />
      <InfoRow label="Misafir Sayısı" value={reservation.guestCount} />
      <InfoRow label="Bütçe" value={`${reservation.budgetMin}₺ - ${reservation.budgetMax}₺`} />
      <InfoRow label="Paket" value={reservation.packageName} />
      {reservation.eventAddress && <InfoRow label="Etkinlik Adresi" value={reservation.eventAddress} icon={<MapPin />} />}
    </>
  )}
  
  {reservation.type === 'order' && (
    <>
      <InfoRow label="Teslimat Tarihi" value={reservation.deliveryDate} />
      <InfoRow label="Teslimat Saati" value={reservation.deliveryTime} icon={<Clock />} />
      <InfoRow label="Teslimat Adresi" value={reservation.deliveryAddress} icon={<MapPin />} />
      <InfoRow label="Ürünler" value={reservation.items.map(i => `${i.name} x${i.quantity}`).join(', ')} />
    </>
  )}
  
  {/* Ortak - Notlar */}
  {reservation.notes && (
    <InfoRow label="Notlar" value={reservation.notes} multiline />
  )}
  
  {/* Ortak - Tutar */}
  <InfoRow label="Toplam Tutar" value={`${reservation.totalPrice}₺`} highlight />
</div>
```

---

## ✅ BAŞARI KRİTERLERİ

1. ✅ Her wizard kendi amacına uygun çalışıyor
2. ✅ Gereksiz alan yok, eksik alan yok
3. ✅ Tüm bilgiler işletme panelinde görülebiliyor
4. ✅ GPS konum desteği uygun yerlerde var
5. ✅ Saat bilgisi her wizard'da mantıklı şekilde mevcut
6. ✅ Kullanıcı deneyimi akıcı ve anlaşılır
7. ✅ Mobil uyumlu
8. ✅ Form validasyonları çalışıyor

---

## 🎯 SONUÇ

**SlotBookingWizard:** ✅ Dokunulmayacak
**OrderBookingWizard:** ✅ Dokunulmayacak  
**DailyRentalWizard:** ⚠️ Saat + Adres eklenecek
**NightlyBookingWizard:** ⚠️ Sabit check-in/out saati gösterilecek
**ProjectBookingWizard:** ⚠️ Saat + Adres eklenecek

---

*Bu plan, her wizard'ın amacına uygun, gereksiz karmaşa yaratmadan, işletmelerin ihtiyacı olan TÜM bilgileri toplayan bir yapı sağlar.*
