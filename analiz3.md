Bu sorularınız gerçekten kritik ve mimarinin can damarına dokunuyor — kodun içine inip tam olarak nasıl çalıştığını (ve nerede çalışmadığını) izledim. Cevaplar aşağıda, her biri kanıtlarıyla.

## Soru A: "İşletmelere özel panel mi olmalı, yoksa tek panel mantığı mı iyi?"

Şu anki mimari **tek panel + koşullu modüller** yaklaşımını kullanıyor — yani her işletme türü için ayrı bir panel kodu yazmak yerine, tek bir `OwnerDashboard.tsx` var ve içinde `getDashboardModules(capabilities)` fonksiyonu işletmenin özelliklerine göre (`showStaff`, `showTables`, `showQueue`, `showRestaurant`, `showOrders`) hangi sekmelerin görüneceğine karar veriyor.

**Bu yaklaşım prensipte doğru** — 11+ farklı iş koluna sahip bir platformda her vertikal için ayrı panel yazmak, 11 kat bakım yükü ve 11 kat bug yüzeyi anlamına gelir. "Tek çekirdek, veri/config ile şekillenen davranış" doğru mimari tercih.

Ama uygulamada iki sorun var:
1. **`OwnerDashboard.tsx` 2.505 satır** — tek bir dosyada tüm işletme türlerinin tüm mantığı birikmiş, bir "Tanrı bileşeni" (God Component) haline gelmiş. Bu boyutta bir dosyada yeni bir özellik eklerken mevcut bir şeyi bozma riski çok yüksek.
2. Ayrıca **`ModernOwnerDashboard.tsx` diye 1.205 satırlık ikinci, tamamen ayrı bir dashboard bileşeni** var — ama `App.tsx`'te hiçbir route'a bağlı değil, yani tamamen ölü kod. Muhtemelen bir "modern tasarım" yeniden yazımı başlatılmış (`MODERN_DASHBOARD_TASARIM.md` dosyası bunu doğruluyor) ama hiç bitirilip devreye alınmamış, terk edilmiş.

**Ne yapılmalı:** Panel mantığınız (tek panel + koşullu modül) doğru, değiştirmenize gerek yok. Ama `OwnerDashboard.tsx`'i, her modülü (`StaffModule`, `TableModule`, `QueueModule`, `OrdersModule` gibi) ayrı, küçük bileşenlere bölün — modül seçimi mantığı aynı kalsın, sadece dosya 2.505 satır yerine 10 tane 200-300 satırlık dosyaya ayrılsın. `ModernOwnerDashboard.tsx`'i ya bitirip devreye alın ya da silin — böyle ortada asılı kalması gelecekteki bir geliştiricinin (ya da sizin) "hangisi doğru dosya?" diye kafa karıştırmasına sebep olur.

## Soru B: "Ayrı ayrı wizardlar ne kadar mantıklı?"

Burada gerçekten derin ve önemli bir sorun buldum, adım adım anlatayım:

Şu an **iki paralel wizard sistemi** var:
1. **Eski/gerçek sistem** (`src/components/booking/wizards/`): İş türüne göre 5 ayrı, büyük, elle yazılmış bileşen — `SlotBookingWizard.tsx` (38,7KB), `NightlyBookingWizard.tsx` (68,2KB!), `DailyRentalWizard.tsx`, `ProjectBookingWizard.tsx`, `OrderBookingWizard.tsx`. **Bu, şu an gerçekten kullanılan, canlı sistem.**
2. **Yeni/hedeflenen sistem** (`src/components/wizard/WizardEngine.tsx`): "Config-driven, business-type agnostic" diye tanımlanmış, tek bir motor, JSON benzeri config ile her adımı oluşturuyor. **Ama bu sadece bir test sayfasında (`WizardTestPage.tsx`) kullanılıyor, gerçek rezervasyon akışına hiç bağlı değil.** Üstelik motorun 11 adım tipinden sadece 3'ü (ServiceSelection, StaffSelection, Capacity) gerçekten kodlanmış — geri kalan 8'i (DateTimeSlot, Payment, Contract, ReviewConfirm dahil!) sadece `<div>...primitive (TODO)</div>` yazan boş yer tutucular.

Ayrıca repo kökünde (src dışında) `WizardBuilder.tsx` (26KB) ve `DynamicWizardRunner.tsx` (16KB) diye **başka bir terk edilmiş wizard denemesi daha** duruyor, hiçbir yerden import edilmiyor.

**Yani elinizde 3 farklı wizard mimarisi denemesi var, ikisi terk edilmiş, sadece biri (en eski, en az esnek olanı) gerçekten çalışıyor.** "Ayrı ayrı wizardlar mantıklı mı" sorusunun cevabı: **iş TÜRÜNE göre ayrı wizard olması** (randevu vs gecelik konaklama vs proje bazlı gibi, kategoriye göre değil) mantıklı bir tasarım kararı — ama şu anki 5 dev bileşen, tekrarlanan kod ve bakım zorluğu taşıyor (68KB'lık tek bir dosya!), ve bunu çözmeye yönelik girişim (`WizardEngine`) yarım bırakılmış.

## Soru C: "Yeni kategori eklerken sorun çıkar mı?" — Evet, ve zaten çıkmış durumda

Bunu doğrulamak için tam çağrı zincirini takip ettim, size gerçek, şu an yaşanan bir hatayı göstereyim:

- `BookingWizardRouter.tsx` (gerçek, canlı rezervasyon yönlendiricisi), hangi wizard'ın açılacağına `determineBookingType(capabilities)` fonksiyonuyla karar veriyor.
- Bu fonksiyonun kullandığı `BookingModel` tipi şu 5 değerden oluşuyor: `'appointment' | 'reservation' | 'order' | 'walk-in-queue' | 'rental'`.
- **`'project'` diye bir değer bu tipte hiç yok.**
- Ama `ProjectBookingWizard.tsx` diye 35KB'lık, "düğün organizasyonu, nişan organizasyonu, doğum günü, kurumsal etkinlik" gibi **5 vertikaliniz** için özel yazılmış bir wizard var.
- `determineBookingType()` fonksiyonunun içinde `primary = 'project'` atayan bir satır **var ama hiçbir zaman çalışmıyor** çünkü `supportedTypes` dizisine `'project'` hiçbir koşulda eklenmiyor — yani bu ölü kod, asla tetiklenmeyen bir dal.
- Sonuç: **Yeni "capabilities" tabanlı onboarding sisteminden geçen bir düğün organizasyonu işletmesi, müşterisine yanlışlıkla kuaför tarzı "tek hizmet seç, tek personel seç, saat seç" wizard'ını gösterir** — kendi işine hiç uymayan bir rezervasyon akışı.

Ayrıca ironik olan şu: eski sistemde (`getBookingTypeFromCategory`, kategori string'ine bakan fonksiyon) bu doğru şekilde çözülüyor — ama kod, önce yeni `capabilities` sistemini tercih edip onu buluyorsa direkt onu kullanıyor, eski fonksiyona **sadece `capabilities` hiç yoksa** düşüyor (`bookingStore.ts:114-124`). Yani **daha yeni, "doğru şekilde" kurulmuş işletmeler bu hatayı yaşıyor**, eski/göç edilmemiş işletmeler kazara doğru çalışıyor. Bu, tam olarak sizin sorduğunuz "yeni bir kategori eklerken sorun çıkar mı" sorusunun somut, gerçek kanıtı — üstelik yeni kategori eklemeye bile gerek kalmadan, **mevcut 5 vertikaliniz zaten bu riski taşıyor.**

Bunun ötesinde, "yeni kategori eklemek" fiilen ne kadar zor, onu da ölçtüm: `'kuafor'` kategori string'i kod tabanında **18 ayrı dosyada** hardcoded olarak geçiyor (tip tanımları, fiyatlandırma yardımcıları, servis şablonları, dashboard bileşenleri...). Yani yeni bir kategori eklemek "bir config dosyasına satır eklemek" değil, en az 18 dosyayı tutarlı şekilde güncellemek demek — birini atlarsanız, o kategori "yarım" çalışan bir vertikal olur (tıpkı fotoğraf/video/drone kategorilerinin şu an olduğu gibi, ki onlar da `session` diye ayrı bir tip olmasına rağmen sessizce `slot` wizard'ına düşüyor — çünkü `BookingType` tipinde `'session'` diye bir değer hiç yok).

**Kök neden:** Projede kategori/iş-türü belirlemek için **üç paralel sistem** bir arada yaşıyor:
1. `CategoryId` — eski, 22 değerli hardcoded union type (18 dosyaya yayılmış)
2. `BusinessCapabilities` / `BookingModel` — yeni, veri güdümlü "capabilities" sistemi (5 booking model)
3. `BookingType` — wizard yönlendirme için kullanılan, 5 değerli ayrı bir enum

Bu üçü birbirine tam örtüşmüyor (`session` ve `project` kayboluyor), ve göç (`CAPABILITY_MIGRATION_SUMMARY.md`, `migrateCapabilities.ts` dosyaları bunu doğruluyor) tamamlanmamış durumda.

**Ne yapılmalı:**
1. `determineBookingType()` fonksiyonuna `'project'` üreten bir dal ekleyin — muhtemelen yeni bir `BookingModel` değeri (`'project'` veya `'consultation'`) tanımlayıp `CATEGORY_PRESETS`'e düğün/etkinlik kategorilerini bu modelle eklemeniz gerekiyor (şu an `businessCapabilities.ts` içinde bu 5 kategori için hiç preset yok — kontrol ettim, yok).
2. `BookingType`'a `'session'` değerini ekleyip fotoğraf/video/drone için ya `ProjectBookingWizard`'ı yeniden kullanın ya da özel bir `SessionBookingWizard` yazın.
3. Uzun vadede: `CategoryId` sistemini tamamen kaldırıp her yerde `BusinessCapabilities`'e geçin — iki sistemi bir arada tutmaya çalışmak, bu tür "sessizce yanlış wizard'a düşme" hatalarının kaynağı.
4. Bu tür hataların bir daha fark edilmeden geçmemesi için, **her kategori için** "doğru wizard'a yönlendiriliyor mu" kontrolü yapan bir birim testi yazın — 11 kategorinin 11'i için de tek tek test edin, böyle bir regresyon bir daha sessizce production'a çıkmaz.

## Soru D: "İşletme oluşturma adımları (onboarding) ne kadar mantıklı, hata var mı?"

Burada iyi haberim var: `src/config/businessQuestionFlow.ts` içindeki tasarım felsefesi **gerçekten iyi düşünülmüş**. Dosyanın kendi açıklaması şöyle diyor: *"Soru ağacı KOD DEĞİL, VERİ olarak tanımlanır. Yeni bir çalışma modeli ortaya çıktığında tek yapılması gereken bu diziye yeni bir soru/seçenek eklemek — React bileşenlerine dokunmaya gerek kalmaz."* Bu, tam olarak olması gereken, dallanma mantığı olan (`showIf` koşullarıyla), çok-seçmeli, birbirine bağlı sorulardan oluşan iyi bir soru motoru. `businessSetupValidator.ts` da (259 satır) cevaplar arasında çelişki kontrolü yapıyor.

**Ama** bu güzel sistemin ürettiği çıktı (`BusinessCapabilities` nesnesi), yukarıda anlattığım `determineBookingType()` hatası yüzünden, düğün/etkinlik organizasyonu gibi işletmeler için **yanlış bir wizard'a çıkıyor**. Yani sorun soru akışının kendisinde değil — soru akışı doğru soruları soruyor, doğru bir `capabilities` nesnesi üretiyor. Sorun, o nesnenin daha sonra "hangi rezervasyon ekranını göstereceğiz" kararına çevrilirken kaybolan bir eşleme (mapping) hatası. Yani **onboarding tasarımı iyi, ama onboarding'in sonunda ürettiği veriyi tüketen kod eksik.**

---

