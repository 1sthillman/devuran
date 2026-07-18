# Dinamik Wizard Motoru — Entegrasyon Rehberi

Bu paket **hiçbir yeni bağımlılık gerektirmez** — `framer-motion`, `lucide-react`, `sonner`
zaten projenizde var, aynı importları kullandım. Tasarım dili (obsidian-card,
mor→pembe gradyan, `--chrome-white` / `--muted-lead` / `--void` CSS değişkenleri,
`rounded-3xl`, sticky footer) `BusinessSetupWizard.tsx` ile birebir aynı — göz
kullanıcıya "farklı bir sistem" gibi gelmeyecek.

## Dosyalar

```
src/types/wizardSchema.ts              → Şema tipleri + validasyon yardımcıları
src/services/wizardSchemaService.ts    → Firestore CRUD
src/components/wizard/DynamicWizardRunner.tsx  → Herhangi bir şemayı çalıştırır
src/components/wizard/WizardBuilder.tsx        → Owner'ın adım/soru tasarladığı ekran
```

`@/lib/firebase` importunu kendi Firebase init dosyanıza göre düzenleyin.

---

## 1) Önce kritik bug'ı düzeltin (bağımsız, hemen yapılmalı)

`OwnerDashboard.tsx` içinde `BusinessSetupWizard` **3 yerde** render ediliyor,
2 tanesi aynı `showSalonSetup` koşuluyla aynı anda açılabiliyor. Tek instance'a indirin:

```tsx
// ❌ SİLİN — ana return'ün başındaki bu blok (satır ~1020 civarı, 
//    "{/* Salon Setup/Edit Modal */}" yorumuyla başlayan, "<div className="flex flex-col lg:flex-row gap-6">" 
//    hemen altındaki ikinci kopya)

// ❌ SİLİN — dosyanın sonundaki, ServiceForm'dan hemen önceki üçüncü kopya

// ✅ TUTUN — sadece `if (!user?.salonId || !salon)` early-return'ünün İÇİNDEKİ
//    ilk kopyayı tutun; salon zaten varken owner "Düzenle"ye bastığında da
//    çalışması için onu component'in en dış seviyesine, return'ün en başına taşıyın:

return (
  <>
    {showSalonSetup && user && (
      <BusinessSetupWizard
        salon={salon || undefined}
        currentUserId={user.uid}
        userBusinessCategory={user.businessCategory}
        onSave={async (salonData) => { /* mevcut kod */ }}
        onClose={() => setShowSalonSetup(false)}
      />
    )}
    {/* ...component'in geri kalanı, TEK bir showSalonSetup bloğu daha olmayacak şekilde... */}
  </>
);
```

Ayrıca `{(!user?.salonId || !salon) ? (...) : (<>...</>)}` ternary'sini kaldırın
— component zaten yukarıda erken `return` ettiği için bu kod hiç çalışmıyor, kafa karıştırıyor.

---

## 2) Settings sekmesine "Wizard'larım" kartı ekleyin

`OwnerDashboard.tsx` → SETTINGS bölümüne, mevcut kartların (İşletme Bilgileri,
Randevu Sistemi, ...) yanına yeni bir collapsible kart:

```tsx
// State'e ekleyin:
const [showWizardBuilder, setShowWizardBuilder] = useState<'setup_extra' | 'booking' | null>(null);
const [expandedSettings, setExpandedSettings] = useState({
  // ...mevcutlar
  customWizards: false,
});

// SETTINGS içine, "Çalışma Saatleri" kartından sonra:
<motion.div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
  <button
    onClick={() => setExpandedSettings(p => ({ ...p, customWizards: !p.customWizards }))}
    className="w-full p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/[0.08] flex items-center justify-center">
        <Layers size={20} className="text-violet-400" />
      </div>
      <div className="text-left">
        <h3 className="font-heading font-semibold text-base text-[var(--chrome-white)]">
          Özel Formlar ve Adımlar
        </h3>
        <p className="text-xs text-[var(--muted-lead)] mt-0.5">
          Profil sihirbazınıza veya rezervasyon akışına kendi sorularınızı ekleyin
        </p>
      </div>
    </div>
    <ChevronDown size={20} className="text-[var(--muted-lead)]" />
  </button>

  {expandedSettings.customWizards && (
    <div className="px-6 pb-6 border-t border-white/[0.08] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={() => setShowWizardBuilder('booking')}
        className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/40 text-left transition-all"
      >
        <p className="font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1">
          Rezervasyon Sorularım
        </p>
        <p className="text-xs text-[var(--muted-lead)]">
          Müşteri randevu alırken sorulacak özel sorular
        </p>
      </button>
      <button
        onClick={() => setShowWizardBuilder('setup_extra')}
        className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/40 text-left transition-all"
      >
        <p className="font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1">
          Profil Sihirbazı Ek Adımları
        </p>
        <p className="text-xs text-[var(--muted-lead)]">
          "İşletmeyi Düzenle" sihirbazına eklenecek ekstra sorular
        </p>
      </button>
    </div>
  )}
</motion.div>

{showWizardBuilder && salon && (
  <WizardBuilder
    salonId={salon.id}
    kind={showWizardBuilder}
    onClose={() => setShowWizardBuilder(null)}
  />
)}
```

`WizardBuilder` kendi kaydetme mantığını (`wizardSchemaService.save`) zaten
içeriyor — owner burada adım ekler, alan tipini seçer (metin/sayı/tarih/
seçim/toggle/görsel/puanlama...), zorunlu mu işaretler, koşullu görünürlük
tanımlar ("X sorusu işaretlenirse Y'yi göster"), "Önizle" ile gerçek akışı
test eder, "Kaydet" ile Firestore'a yazar.

---

## 3) `setup_extra` şemasını Business Setup Wizard'a nasıl bağlarsınız

`BusinessSetupWizard.tsx` 6 sabit adımdan oluşuyor. Owner'ın eklediği ek
adımları **7. adım(lar)** olarak zincire eklemek için en temiz yol: wizard
tamamlandığında (`handleSubmit` içinde `onSave` çağrısından hemen sonra),
varsa aktif `setup_extra` şemasını `DynamicWizardRunner` ile ardışık açmak:

```tsx
// OwnerDashboard.tsx içinde, BusinessSetupWizard'ı render ederken:
const [extraSetupSchema, setExtraSetupSchema] = useState<WizardSchema | null>(null);
const [showExtraSetup, setShowExtraSetup] = useState(false);

useEffect(() => {
  if (salon?.id) {
    wizardSchemaService.listByKind(salon.id, 'setup_extra').then((schemas) => {
      setExtraSetupSchema(schemas.find((s) => s.isActive) || null);
    });
  }
}, [salon?.id]);

// BusinessSetupWizard'ın onSave'i içinde, mevcut kayıt işleminden SONRA:
onSave={async (salonData) => {
  await salonsService.update(salon.id, salonData); // mevcut kod
  await loadData();
  setShowSalonSetup(false);
  if (extraSetupSchema) setShowExtraSetup(true); // ek adımları aç
}}

{showExtraSetup && extraSetupSchema && (
  <DynamicWizardRunner
    schema={extraSetupSchema}
    onComplete={async (answers) => {
      await salonsService.update(salon.id, { extraProfileAnswers: answers });
      setShowExtraSetup(false);
      await loadData();
    }}
    onClose={() => setShowExtraSetup(false)}
  />
)}
```

Bu sayede **platform genelindeki 6 adım hiç bozulmuyor** (her işletme için
aynı temel akış korunuyor — tutarlılık), owner'ın eklediği özel sorular ayrı
ve opsiyonel bir uzantı olarak devam ediyor.

---

## 4) `booking` şemasını müşteri rezervasyon akışına bağlama

Müşteri tarafındaki randevu/rezervasyon formunuz bu paylaşılan dosyalarda yok,
ama entegrasyon noktası aynı prensip: müşteri "Randevu Al" butonuna bastığında,
o işletmenin aktif `booking` şemasını çekip `DynamicWizardRunner`'ı açın,
`onComplete`'te cevapları mevcut rezervasyon kaydına (`reservationService.create`)
ek bir `customAnswers` alanı olarak ekleyin:

```tsx
const schemas = await wizardSchemaService.listByKind(salonId, 'booking');
const activeSchema = schemas.find((s) => s.isActive);

{activeSchema && (
  <DynamicWizardRunner
    schema={activeSchema}
    onComplete={async (answers) => {
      await reservationService.create({ ...baseReservationData, customAnswers: answers });
      await wizardResponseService.submit({
        schemaId: activeSchema.id, businessId: salonId, kind: 'booking',
        answers, submittedAt: Date.now(),
      });
    }}
    onClose={() => setShowBookingWizard(false)}
  />
)}
```

Şema yoksa (owner hiç form tasarlamadıysa) mevcut standart rezervasyon
formunuz olduğu gibi çalışmaya devam eder — **hiçbir şeyi kırmaz**, tamamen
opsiyonel bir katman.

---

## 5) Önerilen küçük iyileştirme: 6. adımı wizard'dan çıkarın

İlk incelemede belirttiğim gibi, `ReservationSettings` (kapora + banka)
tamamen opsiyonel alanlar. Onboarding'i 6 yerine **5 zorunlu adıma**
indirmek için `BusinessSetupWizard.tsx`'te `STEP_META`'dan 6. adımı kaldırıp
bu ekranı doğrudan Settings sekmesindeki "Ödeme Ayarları" kartına taşıyabilirsiniz
(zaten orada `PaymentSettingsForm` var — kapora ayarlarını da oraya ekleyin).
Sonuç: yeni işletme sahibi 5 adımda profilini tamamlar, kapora/banka gibi
"sonra da eklenebilir" ayarlarla oyalanmaz → tamamlanma oranı artar.

---

## Özet — ne kazandınız

- **Tek motor, iki kullanım**: aynı `WizardSchema` / `DynamicWizardRunner` / `WizardBuilder`
  hem işletmenin kendi profilini genişletmesi hem müşteriye özel form sorması için çalışıyor.
- **Sıfır yeni bağımlılık**, mevcut tasarım diliyle birebir uyumlu, mobil-first.
- **Var olan akışı kırmıyor**: şema yoksa sistem eskisi gibi davranır.
- **Koşullu mantık** (`visibleIf`) sayesinde formlar gereksiz uzamıyor —
  "Masa mı istiyorsunuz?" → evet ise "Kaç kişi?" gibi akıllı dallanma kurulabiliyor.
- Bulunan **3 gerçek bug** (duplicate wizard render, ölü kod, migration modal çakışması)
  ayrı ayrı, bağımsız olarak düzeltilebilir şekilde yukarıda listelendi.
