# 🛡️ Güvenli Deployment Planı

## ⚠️ KRİTİK: Mevcut Sistem Korunacak!

`ruloposs` projesi aktif bir production sistemi. Mevcut collections:
- `appointments` - Randevu sistemi
- `orders`, `menuItems`, `tables` - Restoran/QR menü
- `staff`, `services`, `queue` - Kuaför/salon
- `subscriptions` - Abonelik sistemi

**HİÇBİR MEVCUT COLLECTION'A DOKUNMAYACAĞIZ!**

---

## ✅ Güvenli Yaklaşım

### 1. Yeni Collections (Google Maps Entegrasyonu)

Google Maps entegrasyonu için SADECE yeni collections:

```
google_integrations      ← YENİ
google_locations         ← YENİ
google_audit_logs        ← YENİ
appointment_url_mappings ← YENİ
google_oauth_tokens      ← YENİ (encrypted)
```

**Mevcut collections'a DOKUNMAYACAK!**

---

### 2. Firestore Rules - Merge Yaklaşımı

Mevcut rules'ları koruyarak yeni rules ekleyeceğiz:

**firestore.rules güncellenecek:**
- Mevcut rules korunacak
- Sadece yeni Google collections için rules eklenecek

---

### 3. Firestore Indexes - Ekleme Yaklaşımı

**firestore.indexes.json:**
- Mevcut 23 index KORUNACAK
- Google entegrasyonu için 12 yeni index EKLENECEK
- Toplam: 35 index

---

### 4. Functions - Yeni Endpoints

**Firebase Functions:**
- Yeni API endpoints: `/api/v1/google/*`
- Mevcut sistemle çakışmayacak
- Tamamen izole

---

## 🔒 Güvenlik Kontrolleri

### Deploy Öncesi Kontrol

```bash
# 1. Mevcut indexes backup
npx firebase firestore:indexes > firestore.indexes.backup.json

# 2. Dry run (test)
# Firebase'de dry-run yok ama manual kontrol yapacağız

# 3. Sadece yeni indexes deploy et
npx firebase deploy --only firestore:indexes

# 4. Functions deploy (Blaze plan sonrası)
npx firebase deploy --only functions
```

### Deploy Sonrası Kontrol

```bash
# Mevcut sistemin çalıştığını doğrula
# - appointments collection erişilebilir mi?
# - orders collection erişilebilir mi?
# - Mevcut indexes çalışıyor mu?
```

---

## 📊 Deployment Aşamaları

### Aşama 1: Firestore Indexes (GÜVENLİ) ✅
```bash
npx firebase deploy --only firestore:indexes
```
**Risk:** Düşük - Sadece yeni indexler ekler

### Aşama 2: Firestore Rules (DİKKATLİ) ⚠️
```bash
npx firebase deploy --only firestore:rules
```
**Risk:** Orta - Mevcut rules'ları etkiler
**Önlem:** Rules merge edilmeli, test edilmeli

### Aşama 3: Functions (Blaze Plan Sonrası) 🔥
```bash
npx firebase deploy --only functions
```
**Risk:** Düşük - Yeni functions ekler, mevcut sisteme dokunmaz

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Firestore Rules Dikkat!

Şu anki `firestore.rules` dosyası Google entegrasyonu için yazılmış.
**Mevcut rules'larla MERGE EDİLMELİ!**

**Yapılacak:**
```bash
# Önce mevcut rules'ları al
npx firebase firestore:rules > firestore.rules.production

# Manuel merge yap
# - Production rules
# - Google integration rules
# - Birleştir
```

### 2. Indexes Merge

`firestore.indexes.json` dosyası:
- Şu anda: 12 Google integration index
- Production: 23 mevcut index
- **Birleştirilmeli:** 35 index toplam

### 3. Collection İsimleri

Google entegrasyonu collections:
- ✅ `google_*` prefix kullanır
- ✅ Mevcut collections'la çakışma YOK

---

## 🎯 ÖNERİLEN SIRA

### ŞUAN (Blaze Plan Öncesi)

1. ✅ Mevcut Firestore rules backup al
2. ✅ Mevcut indexes backup al
3. ✅ Rules merge yap
4. ✅ Indexes merge yap
5. ⏸️ Deploy BEKLEsin (Blaze plan gerekiyor)

### Blaze Plan Sonrası

1. Indexes deploy et
2. Rules deploy et (merge edilmiş)
3. Functions deploy et
4. Test et
5. Monitoring kur

---

## 📞 Rollback Planı

Eğer bir şey ters giderse:

### Indexes Rollback
```bash
npx firebase firestore:indexes --import firestore.indexes.backup.json
```

### Rules Rollback
```bash
npx firebase deploy --only firestore:rules
# (production rules dosyasından)
```

### Functions Rollback
Firebase Console → Functions → Version History → Rollback

---

## ✅ Sonuç

**Güvenli mi?** EVET, çünkü:
- ✅ Yeni collections kullanıyor
- ✅ Mevcut collections'a dokunmuyor
- ✅ Yeni API endpoints (/api/v1/google/*)
- ✅ İzole mimari
- ✅ Rollback planı var

**Tek Risk:** Firestore rules merge
**Çözüm:** Manuel kontrol ve test

---

## 📋 Action Items (ŞİMDİ)

1. [ ] Mevcut Firestore rules al
2. [ ] Rules merge yap
3. [ ] Mevcut indexes backup al
4. [ ] Indexes merge yap
5. [ ] Blaze plana geç
6. [ ] Deploy

---

**SONUÇ: Mevcut sistem BOZULMAYACAK!** 🛡️
