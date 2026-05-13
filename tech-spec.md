# RANDEVU — Teknik Spesifikasyon

## Bagimliliklar

### Uretim Bagimliliklari (Runtime)

| Paket | Versiyon | Amac |
|---|---|---|
| `react` | ^18.2.0 | UI kutuphanesi |
| `react-dom` | ^18.2.0 | React DOM renderer |
| `react-router-dom` | ^6.21.0 | Sayfa yonlendirme, SPA routing |
| `zustand` | ^4.4.7 | Global state yonetimi (auth, booking, UI) |
| `framer-motion` | ^10.16.16 | Bilesen animasyonlari, sayfa gecisleri, gesture'lar |
| `gsap` | ^3.12.3 | Scroll-triggered animasyonlar, timeline, Splitting entegrasyonu |
| `lenis` | ^1.1.0 | Smooth scroll (inertia-based) |
| `splitting` | ^1.0.6 | Karakter-seviyesinde text split (Cinematic Text Reveal) |
| `lucide-react` | ^0.294.0 | Ikona kutuphanesi (211+ ikon kullaniliyor) |
| `@radix-ui/react-dialog` | ^1.0.5 | Modal/Bottom Sheet erisilebilirlik altyapisi |
| `@radix-ui/react-tabs` | ^1.0.4 | Tab bileseni altyapisi (filtreler, dashboard) |
| `@radix-ui/react-accordion` | ^1.1.2 | Servis kategorileri accordion |
| `@radix-ui/react-slot` | ^1.0.2 | shadcn/ui Slot bileseni |
| `class-variance-authority` | ^0.7.0 | Bilesen varyantlari (shadcn) |
| `clsx` | ^2.0.0 | Kosullu class birlestirme |
| `tailwind-merge` | ^2.2.0 | Tailwind class catismasi cozumu |

### Gelistirme Bagimliliklari

| Paket | Versiyon | Amac |
|---|---|---|
| `typescript` | ^5.3.0 | Tip guvenligi |
| `vite` | ^5.0.0 | Build araci |
| `@vitejs/plugin-react` | ^4.2.0 | React Vite plugin |
| `tailwindcss` | ^3.4.0 | CSS framework |
| `autoprefixer` | ^10.4.16 | CSS prefix otomasyon |
| `postcss` | ^8.4.32 | CSS isleme |

## Bilesen Envanteri

### shadcn/ui Bilesenleri (Hazir)

| Bilesen | Kullanim Yeri | Notlar |
|---|---|---|
| `dialog` | Modal altyapisi (randevu iptal, personel duzenleme) | Radix Dialog uzerine |
| `tabs` | Filtre tablari (Yaklasan/Gecmis randevular), Dashboard sekme | Radix Tabs uzerine |
| `accordion` | Servis kategorileri (Salon Detay, Booking Step 1) | Radix Accordion uzerine |
| `input` | Form inputlari (login, booking confirm, dashboard) | Stil override edilecek |
| `textarea` | Not alani (booking confirm) | Stil override edilecek |
| `badge` | Kategori etiketleri, durum rozetleri | Stil override edilecek |

### Ozel Bilesenler

#### Layout Bilesenleri

| Bilesen | Props | Amac |
|---|---|---|
| `AppShell` | `children` | Ana uygulama kabigi — lenis scroll wrapper |
| `LiquidNav` | `activeTab`, `user` | Ust navigasyon (liquid glass efekt) |
| `BottomNav` | `activeTab` | Mobil alt navigasyon (5 sekme) |
| `Sidebar` | `activeItem`, `items` | Dashboard yan menusu (desktop) |
| `PageTransition` | `children` | Sayfa gecis sarici (framer-motion AnimatePresence) |

#### UI Bilesenleri

| Bilesen | Props | Amac |
|---|---|---|
| `ObsidianCard` | `children`, `className`, `hover?` | Ana kart yuzeyi (bg, border, shadow, hover) |
| `LiquidGlass` | `children`, `className`, `blur?` | Glassmorphism panel yuzeyi |
| `LiquidPill` | `children`, `active?`, `onClick` | Glassmorphism chip/badge |
| `ChromaticButton` | `children`, `onClick`, `disabled?`, `loading?`, `variant` | Krom shimmer buton (CTA) |
| `GhostButton` | `children`, `onClick`, `icon?` | Ikincil buton (liquid glass) |
| `ObsidianInput` | `label`, `placeholder`, `type`, `value`, `onChange` | Form input (obsidian tema) |
| `StatusBadge` | `status: 'upcoming' \| 'confirmed' \| 'completed' \| 'cancelled'` | Durum rozeti |
| `StarRating` | `score`, `size?`, `fill?` | Yildiz degerlendirme |
| `SkeletonCard` | `count?` | YUKLENIYOR iskelet karti |
| `Toast` | `message`, `type`, `onDismiss` | Bildirim toast |
| `BottomSheet` | `children`, `isOpen`, `onClose` | Mobil alt panel (swipe-to-dismiss) |
| `ImageViewer` | `images`, `currentIndex`, `isOpen`, `onClose` | Tam ekran galeri goruntuleyici |

#### Salon Bilesenleri

| Bilesen | Props | Amac |
|---|---|---|
| `SalonCard` | `salon`, `variant: 'full' \| 'compact'` | Salon karti (anasayfa) |
| `SalonHero` | `salon` | Salon detay ust gorsel bolumu |
| `ServiceCard` | `service`, `selected?`, `onSelect` | Hizmet secim karti |
| `ServiceAccordion` | `category`, `services`, `selectedIds`, `onToggle` | Hizmet kategorisi accordion |
| `StaffCard` | `staff`, `selected?`, `onSelect`, `variant` | Personel karti |
| `StaffSelector` | `staff`, `selectedId`, `onSelect` | Personel secim satiri |
| `GalleryGrid` | `images` | Masonry galeri izgarasi |
| `ReviewCard` | `review` | Yorum karti |
| `SalonMap` | `coordinates`, `address` | Statik harita (dark tema) |

#### Booking Bilesenleri

| Bilesen | Props | Amac |
|---|---|---|
| `BookingWizard` | `salon`, `step`, `onStepChange` | 4 asamali rezervasyon sarici |
| `ProgressBar` | `currentStep`, `steps` | Asama ilerleme cubugu |
| `ServiceSelector` | `categories`, `selected`, `onToggle` | Asama 1: Hizmet secimi |
| `StaffSelectorStep` | `staff`, `selectedId`, `onSelect` | Asama 2: Personel secimi |
| `CalendarPicker` | `selectedDate`, `onSelect`, `availableDates` | Asama 3: Takvim |
| `TimeSlotGrid` | `slots`, `selectedTime`, `onSelect` | Asama 3: Saat slotlari |
| `BookingConfirm` | `booking`, `onConfirm` | Asama 4: Onay formu |
| `BookingSuccess` | `booking`, `onNavigate` | Basari ekrani |
| `FloatingSummary` | `selectedCount`, `totalPrice`, `onContinue` | Mobil alt ozet cubugu |

#### Dashboard Bilesenleri

| Bilesen | Props | Amac |
|---|---|---|
| `StatsWidget` | `stats` | Istatistik kartlari (4'lu grid) |
| `AppointmentRow` | `appointment`, `onCancel`, `onReschedule` | Randevu zaman cizelgesi satiri |
| `CalendarView` | `appointments`, `selectedDate`, `onSelect` | Ay takvimi gorunumu |
| `ServiceRow` | `service`, `onEdit`, `onDelete`, `onToggle` | Hizmet yonetimi satiri |
| `StaffGrid` | `staff`, `onEdit`, `onDelete` | Personel kart izgarasi |

## Animasyon Implementasyon Plani

| Animasyon | Kutuphane | Yaklasim | Karmasiklik |
|---|---|---|---|
| **Obsidian Ambient Surface** | CSS keyframes | `body::before` (radial-gradient drift) + `body::after` (SVG noise texture). Saf CSS, JS gerektirmez. | **Dusuk** |
| **Chromatic Fluid Button** | CSS keyframes | `::before` (diagonal shimmer gradient) + `::after` (radial glow). `animation: chromaticShimmer 3s infinite`. Hover'da hizlanir. | **Dusuk** |
| **Cinematic Text Reveal** | GSAP + Splitting.js | Splitting ile karakterlere bolun, GSAP `fromTo` ile her karakteri `blur(12px)+opacity:0`'dan `blur(0)+opacity:1`'e stagger:0.04 ile gotur. IntersectionObserver ile tetiklenir. | **Yuksek** |
| **Liquid Morph Navigation** | CSS keyframes | `::before` pseudo-element ile `linear-gradient` border, `background` animasyonu 135deg -> 225deg -> 135deg. `-webkit-mask` ile border-only uygulanir. | **Orta** |
| **Page Transitions** | Framer Motion | `AnimatePresence` + `motion.div` ile `exit: { opacity:0, filter:blur(4px), scale:0.98 }` -> `enter: { opacity:1, filter:blur(0), scale:1 }`. 0.3s/0.4s sure. | **Orta** |
| **Smooth Scrolling** | Lenis | `new Lenis({ lerp: 0.08, smoothWheel: true })` GSAP ticker'a baglanir. `requestAnimationFrame` dongusu. | **Dusuk** |
| **Card Scroll Reveals** | Framer Motion | `whileInView` prop ile `initial={{ y:24, opacity:0 }}` -> `animate={{ y:0, opacity:1 }}`. `transition: { duration:0.5, staggerChildren:0.08 }`. | **Dusuk** |
| **Scroll Depth Gallery** | GSAP ScrollTrigger | Her `.gallery-item img` icin `yPercent: -8` -> `yPercent: 8`, `scale:1.15`, `scrub:true`. Container `overflow:hidden`. | **Orta** |
| **Booking Success** | Framer Motion | SVG stroke checkmark cizimi, ardindan confetti partikulleri (16 adet, rastgele aci/dusus). `animate={{ y:[0,-60,300], opacity:[1,1,0] }}`. | **Orta** |
| **Card Hover (universal)** | CSS transitions | `transition: all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)`. Hover: `translateY(-3px)`, border, shadow degisimi. | **Dusuk** |
| **Button Interactions** | CSS transitions | Hover: `scale(1.02)`. Active: `scale(0.96)`. Release: spring-back 0.3s. | **Dusuk** |
| **Input Focus** | CSS transitions | Border renk gecisi + `box-shadow: 0 0 0 3px rgba(255,255,255,0.06)`. | **Dusuk** |
| **Bottom Sheet (mobile)** | Framer Motion | `animate={{ y:0 }}` from `y:"100%"`. `type:"spring", damping:25, stiffness:300`. `drag:"y"` ile kapatma. | **Orta** |
| **Modal (desktop)** | Framer Motion | `scale:0.95, opacity:0` -> `scale:1, opacity:1`. Overlay: `rgba(0,0,0,0.7)` fade. | **Dusuk** |
| **Toast Notifications** | Framer Motion | `y:20, opacity:0` -> `y:0, opacity:1`. Auto-dismiss 3s sonra reverse. | **Dusuk** |
| **Image Loading** | CSS transitions | `opacity:0` -> `opacity:1` (0.4s) + `scale(1.02)` -> `scale(1)`. | **Dusuk** |

## State ve Mimari Plan

### State Yonetimi (Zustand)

**Auth Store** (`store/authStore.ts`):
- `user: User | null` — Oturum kullanicisi
- `isAuthenticated: boolean`
- `isOwner: boolean` — Rol kontrolu
- `login(credentials)`, `register(data)`, `logout()`, `setUser(user)`

**Booking Store** (`store/bookingStore.ts`):
- `salonId: string | null`
- `selectedServices: Service[]`
- `selectedStaffId: string | null`
- `selectedDate: string | null`
- `selectedTime: string | null`
- `customerInfo: { name, phone, notes }`
- `step: number (1-4)`
- `totalPrice: number`, `totalDuration: number`
- `addService(service)`, `removeService(serviceId)`, `selectStaff(id)`, `selectDateTime(date, time)`, `setCustomerInfo(info)`, `nextStep()`, `prevStep()`, `reset()`

**UI Store** (`store/uiStore.ts`):
- `toasts: Toast[]` — Aktif bildirimler
- `isBottomSheetOpen: boolean`
- `bottomSheetContent: ReactNode`
- `addToast(toast)`, `removeToast(id)`, `openBottomSheet(content)`, `closeBottomSheet()`

**Appointments Store** (`store/appointmentsStore.ts`):
- `appointments: Appointment[]`
- `filter: 'upcoming' | 'past'`
- `fetchAppointments()`, `cancelAppointment(id)`, `createAppointment(data)`

### Veri Akisi

```
AppShell (Lenis + PageTransition)
  ├── LiquidNav (authStore.user)
  ├── <Routes>
  │     ├── Home (salon listesi)
  │     ├── SalonDetail (salon + services + staff)
  │     ├── BookingWizard (bookingStore'u doldurur)
  │     ├── MyAppointments (appointmentsStore)
  │     ├── Login / Register (authStore)
  │     └── Dashboard (authStore.isOwner = true ise)
  │           ├── DashboardHome
  │           ├── CalendarView
  │           ├── Services
  │           └── Staff
  └── ToastContainer (uiStore.toasts)
```

### Routing Yapisi

| Rota | Sayfa | Koruma |
|---|---|---|
| `/` | Home | Yok |
| `/salon/:id` | SalonDetail | Yok |
| `/booking/:salonId` | BookingWizard | Auth gerektirir |
| `/appointments` | MyAppointments | Auth gerektirir |
| `/login` | Login | Auth'siz |
| `/register` | Register | Auth'siz |
| `/dashboard` | DashboardHome | Owner rol |
| `/dashboard/calendar` | CalendarView | Owner rol |
| `/dashboard/services` | Services | Owner rol |
| `/dashboard/staff` | Staff | Owner rol |

### Hook'lar

| Hook | Amac |
|---|---|
| `useAuth()` | authStore'dan kullanici bilgisi + login/logout fonksiyonlari |
| `useBooking()` | bookingStore'dan secimler + hesaplamalar |
| `useScrollReveal(ref, options)` | IntersectionObserver + framer-motion whileInView wrapper |
| `useCinematicText(ref, delay)` | Splitting + GSAP blur reveal tetikleyici |

## Dosya Yapisi

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Lenis + sayfa gecisleri
│   │   ├── LiquidNav.tsx         # Ust navigasyon (liquid glass)
│   │   ├── BottomNav.tsx         # Mobil alt navigasyon
│   │   ├── Sidebar.tsx           # Dashboard yan menusu
│   │   └── PageTransition.tsx    # Framer Motion AnimatePresence
│   ├── ui/
│   │   ├── ObsidianCard.tsx      # Kart yuzeyi
│   │   ├── LiquidGlass.tsx       # Glassmorphism panel
│   │   ├── LiquidPill.tsx        # Chip/badge
│   │   ├── ChromaticButton.tsx   # Krom shimmer CTA
│   │   ├── GhostButton.tsx       # Ikincil buton
│   │   ├── ObsidianInput.tsx     # Form input
│   │   ├── StatusBadge.tsx       # Durum rozeti
│   │   ├── StarRating.tsx        # Yildiz puanlama
│   │   ├── SkeletonCard.tsx      # Yukleme iskeleti
│   │   ├── Toast.tsx             # Bildirim
│   │   ├── ToastContainer.tsx    # Bildirim listesi
│   │   ├── BottomSheet.tsx       # Mobil alt panel
│   │   └── ImageViewer.tsx       # Tam ekran galeri
│   ├── salon/
│   │   ├── SalonCard.tsx         # Salon karti
│   │   ├── SalonHero.tsx         # Salon detay hero
│   │   ├── ServiceCard.tsx       # Hizmet karti
│   │   ├── ServiceAccordion.tsx  # Hizmet kategorisi
│   │   ├── StaffCard.tsx         # Personel karti
│   │   ├── StaffSelector.tsx     # Personel secim
│   │   ├── GalleryGrid.tsx       # Galeri izgarasi
│   │   ├── ReviewCard.tsx        # Yorum karti
│   │   └── SalonMap.tsx          # Harita
│   ├── booking/
│   │   ├── BookingWizard.tsx     # 4 asamali sarici
│   │   ├── ProgressBar.tsx       # Asama cubugu
│   │   ├── ServiceSelector.tsx   # Hizmet secim
│   │   ├── CalendarPicker.tsx    # Takvim
│   │   ├── TimeSlotGrid.tsx      # Saat slotlari
│   │   ├── BookingConfirm.tsx    # Onay formu
│   │   ├── BookingSuccess.tsx    # Basari ekrani
│   │   └── FloatingSummary.tsx   # Mobil alt ozet
│   ├── dashboard/
│   │   ├── StatsWidget.tsx       # Istatistik kartlari
│   │   ├── AppointmentRow.tsx    # Randevu satiri
│   │   ├── CalendarView.tsx      # Takvim gorunumu
│   │   ├── ServiceRow.tsx        # Hizmet yonetim satiri
│   │   └── StaffGrid.tsx         # Personel izgarasi
│   └── auth/
│       ├── LoginForm.tsx         # Giris formu
│       └── RegisterForm.tsx      # Kayit formu
├── pages/
│   ├── Home.tsx                  # Kesif sayfasi
│   ├── SalonDetail.tsx           # Salon detay
│   ├── Booking.tsx               # Booking wizard sayfasi
│   ├── Appointments.tsx          # Randevularim
│   ├── Login.tsx                 # Giris sayfasi
│   ├── Register.tsx              # Kayit sayfasi
│   └── Dashboard.tsx             # Dashboard ana
├── store/
│   ├── authStore.ts              # Auth state
│   ├── bookingStore.ts           # Booking state
│   ├── uiStore.ts                # UI state (toast, modal)
│   └── appointmentsStore.ts      # Randevular state
├── hooks/
│   ├── useAuth.ts                # Auth hook
│   ├── useBooking.ts             # Booking hook
│   ├── useScrollReveal.ts        # Scroll reveal hook
│   └── useCinematicText.ts       # Cinematic text hook
├── lib/
│   ├── utils.ts                  # cn() ve yardimcilar
│   └── data.ts                   # Sabit/mock veriler
├── types/
│   └── index.ts                  # TypeScript tanimlari
├── App.tsx                       # Router + AppShell
└── main.tsx                      # Entry point
```

## Renk ve Stil Notlari

- `cn()` fonksiyonu (lib/utils.ts) `clsx` + `tailwind-merge` birlesimi ile calisir. Tum bilesenlerde kosullu class'lar icin kullanilir.
- CSS Custom Properties (`:root`):
  - `--void: #030303`
  - `--slate-surface: #111111`
  - `--liquid-glass: rgba(255,255,255,0.03)`
  - `--obsidian-rim: rgba(255,255,255,0.08)`
  - `--liquid-chrome: rgba(255,255,255,0.12)`
  - `--silver-frost: #D0D0D0`
  - `--chrome-white: #F8F8F8`
  - `--muted-lead: #888888`
  - `--ash: #555555`
  - `--chrome-glow: rgba(240,240,240,0.15)`
  - `--success: #2DC24E`
  - `--warning: #E5A522`
  - `--error: #E5483E`
