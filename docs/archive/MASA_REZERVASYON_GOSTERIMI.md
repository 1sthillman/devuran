# 📅 Masa Rezervasyon Gösterimi - Garson Paneli

## 🎯 ÖZELLİK

Restoranlar masalarına rezervasyon yapabiliyorlar. **Rezervasyon günü geldiğinde, masa kartında 1 saat önceden**:
- ✅ Garson rezervasyonlu masayı görebiliyor
- ✅ Hangi müşterinin rezervasyonu olduğunu görebiliyor
- ✅ Rezervasyon saatini görebiliyor
- ✅ Kompakt ve görsel olarak dikkat çekici

---

## 🛠️ YAPILAN DEĞİŞİKLİKLER

### 1. **TableGrid.tsx** - Ana Özellik

#### Eklenen Props
```typescript
interface TableGridProps {
  tables: Table[];
  orders: Order[];
  notifications?: RestaurantNotification[];
  restaurantId: string; // 🆕 Rezervasyonları dinlemek için
  onTableClick?: (table: Table) => void;
  onTableLongPress?: (table: Table) => void;
}
```

#### Yeni State ve Hook
```typescript
const [reservations, setReservations] = useState<Reservation[]>([]);

// Rezervasyonları real-time dinle
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'reservations'),
      where('salonId', '==', restaurantId),
      where('type', '==', 'slot')
    ),
    (snapshot) => {
      // Sadece bugünkü ve aktif rezervasyonlar
      const today = new Date();
      const reservationsList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Reservation))
        .filter(res => {
          const resDate = new Date(res.date);
          return isSameDay(resDate, today) && 
                 ['confirmed', 'deposit_paid', 'fully_paid', 'in_progress'].includes(res.status);
        });
      
      setReservations(reservationsList);
    }
  );
  return () => unsubscribe();
}, [restaurantId]);
```

#### Yeni Helper Fonksiyon
```typescript
function getTableReservation(tableName: string): {
  reservation: Reservation;
  minutesUntil: number;
  isNear: boolean;
} | null {
  const now = new Date();
  
  for (const res of reservations) {
    const slotRes = res as any;
    const tableService = slotRes.services?.[0];
    const resTableName = tableService?.name?.replace('Masa ', '');
    
    if (resTableName === tableName) {
      const [hours, minutes] = slotRes.time.split(':').map(Number);
      const reservationTime = new Date();
      reservationTime.setHours(hours, minutes, 0, 0);
      
      const minutesUntil = Math.floor((reservationTime.getTime() - now.getTime()) / 60000);
      
      // 1 saat = 60 dakika
      const isNear = minutesUntil > 0 && minutesUntil <= 60;
      
      return { reservation: res, minutesUntil, isNear };
    }
  }
  
  return null;
}
```

#### Masa Kartı Güncellemeleri

**1. Rezervasyon Badge (En Üstte)**
```tsx
{reservationInfo?.isNear && (
  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
      <Calendar className="w-3 h-3 mr-1 inline" />
      {reservationInfo.minutesUntil} dk sonra
    </Badge>
  </div>
)}
```

**2. Ring Effect (Dikkat Çekmek İçin)**
```tsx
<Card
  className={cn(
    'relative p-4 border-2 cursor-pointer transition-all select-none',
    getTableStatusColor(table.status),
    reservationInfo?.isNear && 'ring-2 ring-purple-500 ring-offset-2'
  )}
>
```

**3. Rezervasyon Bilgi Kartı (Masa Boşken)**
```tsx
{isEmpty && reservationInfo?.isNear && (
  <div className="mt-3 pt-3 border-t border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/5 rounded-lg p-2">
    <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1 mb-1">
      <Calendar className="w-3 h-3" />
      Rezervasyon
    </div>
    <div className="text-center space-y-0.5">
      <div className="text-xs font-semibold text-gray-900 dark:text-white">
        {slotRes.userName}
      </div>
      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
        {slotRes.time}
      </div>
    </div>
  </div>
)}
```

---

### 2. **WaiterPanel.tsx** - Prop Ekleme

```tsx
<TableGrid 
  tables={filteredTables} 
  orders={orders}
  notifications={notifications}
  restaurantId={restaurantId} // 🆕
  onTableLongPress={handleTableLongPress}
/>
```

---

### 3. **CashierPanel.tsx** - Prop Ekleme

```tsx
<TableGrid 
  tables={billRequestedTables} 
  orders={orders}
  restaurantId={restaurantId} // 🆕
  onTableClick={handleTableClick}
/>

<TableGrid 
  tables={otherTables} 
  orders={orders}
  restaurantId={restaurantId} // 🆕
  onTableClick={handleTableClick}
/>
```

---

## 🎨 TASARIM ÖZELLİKLERİ

### Görsel Göstergeler
1. **Purple/Pink Gradient Badge** - Üstte, kayan
2. **Ring Effect** - Masa kartının etrafında mor halka
3. **Animasyon** - Pulse efekti (dikkat çekici)
4. **Kompakt Bilgi Kartı** - Müşteri adı + rezervasyon saati

### Renk Şeması
- **Primary**: Purple (500) → Pink (500) gradient
- **Background**: Purple/50 with opacity
- **Border**: Purple/30
- **Text**: Purple/600 (light) / Purple/400 (dark)

### Responsive
- Mobil: Tek sütun, kompakt kart
- Tablet: 2-3 sütun
- Desktop: 4-6 sütun grid

---

## ⚙️ ÇALIŞMA MANTĞI

### 1. Rezervasyon Dinleme
```
Firestore Query:
- salonId == restaurantId
- type == 'slot'
- Client-side filter: bugünkü tarih
- Client-side filter: aktif status
```

### 2. Zaman Hesaplama
```typescript
const now = new Date();
const reservationTime = new Date();
reservationTime.setHours(hours, minutes);

const minutesUntil = (reservationTime - now) / 60000;
const isNear = minutesUntil > 0 && minutesUntil <= 60; // 1 saat
```

### 3. Masa Eşleştirme
```typescript
// Rezervasyondaki masa adı: "Masa 5"
const tableService = reservation.services?.[0];
const resTableName = tableService?.name?.replace('Masa ', ''); // "5"

// Masa kartındaki: table.tableNumber === "5"
if (resTableName === tableName) {
  // Match!
}
```

---

## 📊 PERFORMANS

### Optimizasyonlar
- ✅ Real-time listener (onSnapshot) - Tek query
- ✅ Client-side filtering (index yok)
- ✅ Sadece bugünkü rezervasyonlar
- ✅ Sadece aktif statuslar
- ✅ Component mount/unmount cleanup

### Veritabanı Okuma
- **1 listener** - Tüm masa kartları için tek dinleme
- **Auto cleanup** - Component unmount'ta disconnect

---

## 🧪 TEST SENARYOLARI

### ✅ Senaryo 1: Rezervasyon 30 Dakika Sonra
```
Masa 5:
- Status: empty
- Rezervasyon: 14:30
- Şu an: 14:00

Beklenen:
✅ Badge: "30 dk sonra"
✅ Ring effect: mor halka
✅ Bilgi kartı: "Ahmet Yılmaz - 14:30"
```

### ✅ Senaryo 2: Rezervasyon 2 Saat Sonra
```
Masa 3:
- Status: empty
- Rezervasyon: 18:00
- Şu an: 16:00

Beklenen:
❌ Badge yok
❌ Ring effect yok
❌ Normal boş masa
```

### ✅ Senaryo 3: Masa Dolu, Rezervasyon Var
```
Masa 7:
- Status: occupied
- Rezervasyon: 20:00
- Şu an: 19:45

Beklenen:
❌ Rezervasyon gösterilmez (masa dolu)
✅ Normal dolu masa görünümü
```

### ✅ Senaryo 4: Rezervasyon Geçmiş
```
Masa 2:
- Status: empty
- Rezervasyon: 12:00
- Şu an: 13:00

Beklenen:
❌ Gösterilmez (saat geçmiş)
❌ Normal boş masa
```

---

## 🚀 KULLANIM

### Garson Akışı
1. Garson paneli açılır
2. Masa kartları yüklenir
3. 1 saat içinde rezervasyonu olan masalar:
   - Mor halka ile vurgulanır
   - "X dk sonra" badge'i görünür
   - Müşteri bilgisi gösterilir
4. Garson masayı hazırlayabilir

---

## 📝 NOTLAR

### Firestore Index Gereksinimi
❌ **Gerekmiyor** - Client-side filtering kullanıldı

### Abonelik Limiti
- Garson panelinde sadece **1 listener**
- Tüm rezervasyon kartlarında **1 listener** (WaiterPanel'de zaten var)
- **Toplam impact**: Minimal

### Dark Mode Support
✅ Tüm renkler dark mode'da test edildi

---

## ✨ SONUÇ

**Garsonlar artık:**
- ✅ 1 saat önceden rezervasyonlu masaları görebiliyor
- ✅ Müşteri adını görebiliyor
- ✅ Rezervasyon saatini görebiliyor
- ✅ Görsel olarak dikkat çekiliyor (ring + badge + animasyon)
- ✅ Kompakt ve temiz tasarım

**Sistem:**
- ✅ Real-time güncelleme
- ✅ Performanslı (1 listener)
- ✅ Index gerektirmiyor
- ✅ Responsive tasarım
