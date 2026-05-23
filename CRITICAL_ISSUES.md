# ❌ KRİTİK SORUNLAR - MOCK VERİ ANALİZİ

## Tespit Edilen Sorunlar

### 1. ProjectBookingWizard (Düğün Organizasyonu)
**Dosya**: `src/components/booking/wizards/ProjectBookingWizard.tsx`
**Sorun**: Paketler hardcoded (satır 11-34)
```typescript
const packages = [
  { id: 'basic', name: 'Temel Paket', price: 15000, ... },
  { id: 'standard', name: 'Standart Paket', price: 35000, ... },
  ...
];
```
**Etki**: Tüm düğün organizasyonu işletmeleri aynı paketleri görüyor!

### 2. DailyRentalWizard (Düğün Salonu)
**Dosya**: `src/components/booking/wizards/DailyRentalWizard.tsx`
**Sorun**: Paketler hardcoded (satır 32-50)
```typescript
const packages = [
  { id: 'basic', name: 'Temel Paket', price: 15000, ... },
  ...
];
```
**Etki**: Tüm düğün salonları aynı paketleri görüyor!

### 3. OrderBookingWizard (Catering)
**Dosya**: `src/components/booking/wizards/OrderBookingWizard.tsx`
**Sorun**: Menüler hardcoded (satır 6-24)
```typescript
const menuItems = {
  catering: [...],
  'pasta-tatli': [...],
  'kahve-ikram': [...]
};
```
**Etki**: Tüm catering işletmeleri aynı menüleri görüyor!

## Çözüm

Tüm wizard'ları `servicesService.getBySalon()` kullanarak işletmenin kendi hizmetlerinden çekmeli.

**Örnek**: NightlyBookingWizard'da yaptığımız gibi:
```typescript
const [services, setServices] = useState<Service[]>([]);

useEffect(() => {
  if (salon?.id) {
    loadServices();
  }
}, [salon?.id]);

const loadServices = async () => {
  const services = await servicesService.getBySalon(salon!.id);
  setServices(services);
};
```

## Aciliyet: YÜKSEK
Bu sorunlar çözülmeden sistem **gerçekten çalışmıyor**!
