# 🧪 WIZARD SYSTEM TEST PLANI

**Durum:** ✅ READY FOR TESTING  
**Test Coverage:** Critical Paths

---

## 📋 MANUEL TEST SENARYOLARI

### Test 1: Business Creation Flow (Slot-based)

**Kategori:** Kuaför  
**Beklenen Wizard:** SlotBookingWizard

**Adımlar:**
1. Yeni kullanıcı kaydı (owner role)
2. Email doğrulama bekle
3. `/business/setup` sayfasına git
4. "Kuaför" kategorisini seç
5. Dashboard'a redirect edildiğini doğrula
6. URL: `/dashboard?show_setup=true&user_category=hairdresser`
7. BusinessSetupWizard'ın açıldığını doğrula
8. Adımları tamamla:
   - Basic Info (name, description, address)
   - Services (preset services visible)
   - Working Hours
   - Media Upload
9. "Kaydet" butonuna tıkla
10. Dashboard'ın yüklendiğini doğrula
11. Staff modülünün görünür olduğunu doğrula

**Beklenen Sonuç:**
- ✅ Wizard açılır
- ✅ Preset services yüklenir
- ✅ Salon oluşturulur
- ✅ User profile'a salonId yazılır
- ✅ Dashboard gösterilir
- ✅ Staff modülü aktif

---

### Test 2: Business Creation Flow (Nightly-based)

**Kategori:** Otel  
**Beklenen Wizard:** NightlyBookingWizard

**Adımlar:**
1. `/business/setup` → "Otel" seç
2. Wizard açıldığını doğrula
3. Room/unit presets yüklendiğini kontrol et
4. Nightly pricing ayarlarını doğrula
5. Check-in/check-out times ayarlarını kontrol et
6. Kaydet ve dashboard'a git

**Beklenen Sonuç:**
- ✅ Nightly-specific presets yüklenir
- ✅ Room management gösterilir
- ✅ Calendar view aktif

---

### Test 3: Business Creation Flow (Project-based)

**Kategori:** Düğün Organizasyonu  
**Beklenen Wizard:** ProjectBookingWizard

**Adımlar:**
1. `/business/setup` → "Düğün Organizasyonu" seç
2. Wizard açıldığını doğrula
3. Package-based services yüklendiğini kontrol et
4. Consultation settings kontrol et
5. Portfolio upload özelliğini test et
6. Kaydet ve dashboard'a git

**Beklenen Sonuç:**
- ✅ Project-based presets yüklenir
- ✅ Staff modülü GİZLİ (staffManagement: false)
- ✅ Consultation mode aktif

---

### Test 4: Business Creation Flow (Consultation)

**Kategori:** Psikolojik Danışmanlık  
**Beklenen Wizard:** ProjectBookingWizard (consultation mode)

**Adımlar:**
1. `/business/setup` → "Psikolojik Danışmanlık" seç
2. Consultation-specific ayarları kontrol et
3. Session duration presets doğrula
4. Online/offline meeting options kontrol et

**Beklenen Sonuç:**
- ✅ Consultation presets yüklenir
- ✅ Session-based booking aktif
- ✅ Video call integration ready

---

### Test 5: Booking Wizard Routing (Customer Side)

**Senaryo:** Müşteri işletme detay sayfasından randevu oluşturma

**Adımlar:**
1. Kuaför işletmesi aç (`bookingType: 'slot'`)
2. "Randevu Al" butonuna tıkla
3. `/booking/:salonId` sayfasına git
4. `SlotBookingWizard` yüklendiğini doğrula
5. Service seç → Date seç → Time slot seç → Confirm

**Beklenen Sonuç:**
- ✅ Doğru wizard yüklenir (SlotBookingWizard)
- ✅ Hizmetler listelenir
- ✅ Müsait saatler gösterilir
- ✅ Randevu oluşturulur

---

### Test 6: Dashboard Module Visibility

**Test 6.1: Kuaför (staffManagement: true)**
```
Visible Modules:
- ✅ Overview
- ✅ Appointments (Randevular)
- ✅ Services
- ✅ Staff (Personel)
- ✅ Settings
- ❌ Restaurant (hidden)
```

**Test 6.2: Düğün Organizasyonu (staffManagement: false)**
```
Visible Modules:
- ✅ Overview
- ✅ Appointments (Projeler)
- ✅ Services
- ❌ Staff (hidden)
- ✅ Settings
- ❌ Restaurant (hidden)
```

**Test 6.3: Restoran (bookingType: 'restaurant')**
```
Visible Modules:
- ✅ Overview
- ✅ Restaurant (Masa/Sipariş Yönetimi)
- ✅ Services (Menu)
- ❌ Staff (hidden or different)
- ✅ Settings
```

---

### Test 7: Admin Panel Access

**Test 7.1: Regular Owner**
```typescript
user.role = 'owner'
user.customClaims = undefined
```
**Beklenen:** Super Admin panel GİZLİ

**Test 7.2: Super Admin**
```typescript
user.customClaims.admin = true
```
**Beklenen:** Super Admin panel ERİŞİLEBİLİR

**Test 7.3: Regular Customer**
```typescript
user.role = 'customer'
```
**Beklenen:** Dashboard ve Admin panel ERİŞİLEMEZ

---

## 🤖 OTOMATİK TEST ÖNERİLERİ

### Unit Tests

**bookingTypeResolver.test.ts**
```typescript
import { getDashboardModules, getBookingTerminology } from '@/utils/bookingTypeResolver';

describe('bookingTypeResolver', () => {
  test('slot-based shows staff module', () => {
    const modules = getDashboardModules({
      bookingType: 'slot',
      features: { staffManagement: true }
    });
    expect(modules.showStaff).toBe(true);
  });

  test('project-based hides staff module', () => {
    const modules = getDashboardModules({
      bookingType: 'project',
      features: { staffManagement: false }
    });
    expect(modules.showStaff).toBe(false);
  });

  test('terminology changes based on type', () => {
    const slotTerm = getBookingTerminology({ bookingType: 'slot' });
    expect(slotTerm.plural).toBe('Randevular');

    const projectTerm = getBookingTerminology({ bookingType: 'project' });
    expect(projectTerm.plural).toBe('Projeler');
  });
});
```

**businessPresets.test.ts**
```typescript
import { getBusinessPreset } from '@/config/businessPresets';

describe('businessPresets', () => {
  test('returns deep clone, not reference', () => {
    const preset1 = getBusinessPreset('hairdresser');
    const preset2 = getBusinessPreset('hairdresser');
    
    expect(preset1).toEqual(preset2);
    expect(preset1).not.toBe(preset2); // Different objects
    
    preset1.services[0].name = 'Modified';
    expect(preset2.services[0].name).not.toBe('Modified');
  });

  test('wedding category has project bookingType', () => {
    const preset = getBusinessPreset('wedding-planning');
    expect(preset.capabilities.bookingType).toBe('project');
  });

  test('hotel category has nightly bookingType', () => {
    const preset = getBusinessPreset('hotel');
    expect(preset.capabilities.bookingType).toBe('nightly');
  });
});
```

---

### Integration Tests

**businessCreationFlow.test.ts**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BusinessSetup } from '@/pages/BusinessSetup';

describe('Business Creation Flow', () => {
  test('selecting hairdresser redirects to dashboard', async () => {
    render(<BusinessSetup />);
    
    const hairdresserCard = screen.getByText('Kuaför');
    fireEvent.click(hairdresserCard);
    
    await waitFor(() => {
      expect(window.location.href).toContain('/dashboard?show_setup=true');
    });
  });

  test('wizard opens automatically with query param', async () => {
    const { container } = render(
      <OwnerDashboard />,
      { initialEntries: ['/dashboard?show_setup=true&user_category=hairdresser'] }
    );
    
    await waitFor(() => {
      expect(screen.getByText('İşletme Bilgileri')).toBeInTheDocument();
    });
  });
});
```

---

### E2E Tests (Cypress/Playwright)

**business-creation.spec.ts**
```typescript
describe('Business Creation E2E', () => {
  it('completes full wizard flow', () => {
    cy.visit('/business/setup');
    
    // Select category
    cy.contains('Kuaför').click();
    
    // Wait for redirect
    cy.url().should('include', '/dashboard?show_setup=true');
    
    // Wizard should open
    cy.contains('İşletme Bilgileri').should('be.visible');
    
    // Fill basic info
    cy.get('input[name="name"]').type('Test Kuaför');
    cy.get('textarea[name="description"]').type('Test açıklama');
    cy.get('input[name="address"]').type('Test adres');
    cy.contains('İleri').click();
    
    // Services step
    cy.contains('Hizmetler').should('be.visible');
    cy.contains('Saç Kesimi').should('be.visible'); // Preset
    cy.contains('İleri').click();
    
    // Working hours
    cy.contains('Çalışma Saatleri').should('be.visible');
    cy.contains('İleri').click();
    
    // Media
    cy.contains('Görseller').should('be.visible');
    cy.contains('Kaydet').click();
    
    // Dashboard should load
    cy.url().should('eq', '/dashboard');
    cy.contains('Personel').should('be.visible'); // Staff module visible
  });
});
```

---

## 🔍 PERFORMANS TESTLERİ

### Lighthouse Metrikleri

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

**Critical Pages:**
- `/` (Home)
- `/business/setup` (Business Setup)
- `/dashboard` (Owner Dashboard)
- `/booking/:id` (Booking Wizard)

### Bundle Size Monitoring

```bash
# Build and analyze
npm run build
npx vite-bundle-visualizer

# Check dashboard bundle
# Target: < 250KB gzipped
```

---

## 📊 TEST SONUÇLARI TABLOSU

| Test ID | Test Adı | Durum | Son Çalıştırma |
|---------|----------|-------|----------------|
| T1 | Business Creation (Slot) | ⏳ Pending | - |
| T2 | Business Creation (Nightly) | ⏳ Pending | - |
| T3 | Business Creation (Project) | ⏳ Pending | - |
| T4 | Business Creation (Consultation) | ⏳ Pending | - |
| T5 | Booking Wizard Routing | ⏳ Pending | - |
| T6 | Dashboard Module Visibility | ⏳ Pending | - |
| T7 | Admin Panel Access | ⏳ Pending | - |

---

## 🎯 HATA RAPORLAMA

### Bug Report Template

```markdown
## Bug Raporu

**Test ID:** T1  
**Test Adı:** Business Creation (Slot)  
**Durum:** ❌ Failed  
**Tarih:** 2026-07-20

### Açıklama
Wizard açıldıktan sonra preset services yüklenmiyor.

### Adımlar
1. Kuaför kategorisi seç
2. Dashboard'a redirect ediliyor ✅
3. Wizard açılıyor ✅
4. Services step'e git ❌ Boş liste

### Beklenen
Preset services (Saç Kesimi, Boyama, vb.) görünmeli

### Gerçekleşen
Boş services listesi

### Console Errors
```
Error: Cannot read property 'services' of undefined
```

### Screenshots
[Ekran görüntüsü ekle]

### Önem Derecesi
🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

### Assign
@developer-name
```

---

## ✅ TEST TAMAMLAMA KRİTERLERİ

### Minimum Requirements
- [x] TypeScript compile (0 error)
- [x] Build success (0 error)
- [ ] T1-T4 passed (business creation)
- [ ] T5 passed (booking routing)
- [ ] T6 passed (module visibility)
- [ ] T7 passed (admin access)

### Nice to Have
- [ ] Unit tests written (coverage > 80%)
- [ ] Integration tests written
- [ ] E2E tests written (critical paths)
- [ ] Performance tests passed
- [ ] Accessibility audit passed

---

## 📝 NOTES

### Known Issues
- [ ] WizardEngine.tsx unused (cleanup needed)
- [ ] BUSINESS_PRESETS and CATEGORY_PRESETS duplication
- [ ] Custom User type casting (type safety improvement)

### Future Improvements
- [ ] Add loading skeletons for wizard steps
- [ ] Implement wizard progress save (localStorage)
- [ ] Add wizard step validation before navigation
- [ ] Create wizard analytics tracking
- [ ] Add wizard A/B testing framework

---

**Test Planı Hazırlayan:** Kiro AI Assistant  
**Tarih:** 2026-07-20  
**Versiyon:** 1.0  
**Durum:** ✅ READY FOR EXECUTION
