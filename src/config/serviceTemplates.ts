import type { CategoryId } from './categories';

export interface ServiceTemplate {
  name: string;
  description?: string;
  duration: number; // dakika veya gece/saat
  price: number;
  category: string;
  gender?: 'male' | 'female' | 'all';
}

export const SERVICE_TEMPLATES: Record<CategoryId, ServiceTemplate[]> = {
  // Güzellik & Bakım
  'kuafor': [
    { name: 'Saç Kesimi (Kadın)', duration: 45, price: 300, category: 'Saç Kesimi', gender: 'female' },
    { name: 'Saç Kesimi (Erkek)', duration: 30, price: 200, category: 'Saç Kesimi', gender: 'male' },
    { name: 'Saç Kesimi (Çocuk)', duration: 25, price: 150, category: 'Saç Kesimi', gender: 'all' },
    { name: 'Saç Boyama (Röfle)', duration: 120, price: 800, category: 'Saç Boyama', gender: 'all' },
    { name: 'Saç Boyama (Balyaj)', duration: 180, price: 1200, category: 'Saç Boyama', gender: 'all' },
    { name: 'Saç Boyama (Ombre)', duration: 150, price: 1000, category: 'Saç Boyama', gender: 'all' },
    { name: 'Saç Boyama (Tam Boya)', duration: 90, price: 600, category: 'Saç Boyama', gender: 'all' },
    { name: 'Keratin Bakımı', duration: 180, price: 1500, category: 'Saç Bakımı', gender: 'all' },
    { name: 'Botox Bakımı', duration: 120, price: 1200, category: 'Saç Bakımı', gender: 'all' },
    { name: 'Protein Bakımı', duration: 90, price: 800, category: 'Saç Bakımı', gender: 'all' },
    { name: 'Fön', duration: 30, price: 200, category: 'Fön & Maşa', gender: 'all' },
    { name: 'Maşa', duration: 45, price: 250, category: 'Fön & Maşa', gender: 'all' },
    { name: 'Saç Uzatma (Kaynak)', duration: 240, price: 3000, category: 'Saç Uzatma', gender: 'all' },
    { name: 'Perma', duration: 120, price: 1000, category: 'Perma & Düzleştirme', gender: 'all' },
    { name: 'Brezilya Fönü', duration: 180, price: 1500, category: 'Perma & Düzleştirme', gender: 'all' },
  ],

  'berber': [
    { name: 'Saç Kesimi', duration: 30, price: 150, category: 'Saç Kesimi', gender: 'male' },
    { name: 'Sakal Kesimi', duration: 20, price: 100, category: 'Sakal', gender: 'male' },
    { name: 'Sakal Şekillendirme', duration: 25, price: 120, category: 'Sakal', gender: 'male' },
    { name: 'Ustura Tıraş', duration: 30, price: 150, category: 'Tıraş', gender: 'male' },
    { name: 'Saç + Sakal', duration: 45, price: 200, category: 'Kombin', gender: 'male' },
    { name: 'Saç + Tıraş', duration: 50, price: 250, category: 'Kombin', gender: 'male' },
    { name: 'Cilt Bakımı', duration: 45, price: 200, category: 'Bakım', gender: 'male' },
    { name: 'Kaş Düzenleme', duration: 15, price: 50, category: 'Kaş', gender: 'male' },
    { name: 'Bıyık Kesimi', duration: 10, price: 40, category: 'Bıyık', gender: 'male' },
  ],

  'guzellik': [
    { name: 'Klasik Cilt Bakımı', duration: 60, price: 400, category: 'Cilt Bakımı', gender: 'all' },
    { name: 'Medikal Cilt Bakımı', duration: 90, price: 800, category: 'Cilt Bakımı', gender: 'all' },
    { name: 'Anti-aging Bakım', duration: 75, price: 600, category: 'Cilt Bakımı', gender: 'all' },
    { name: 'İpek Epilasyon (Yüz)', duration: 20, price: 150, category: 'Epilasyon', gender: 'all' },
    { name: 'İpek Epilasyon (Bacak)', duration: 30, price: 200, category: 'Epilasyon', gender: 'all' },
    { name: 'Ağda (Tam Bacak)', duration: 45, price: 250, category: 'Epilasyon', gender: 'all' },
    { name: 'Lazer Epilasyon (Yüz)', duration: 15, price: 300, category: 'Epilasyon', gender: 'all' },
    { name: 'Lazer Epilasyon (Bacak)', duration: 30, price: 600, category: 'Epilasyon', gender: 'all' },
    { name: 'İsveç Masajı', duration: 60, price: 500, category: 'Masaj', gender: 'all' },
    { name: 'Aromaterapi Masajı', duration: 75, price: 600, category: 'Masaj', gender: 'all' },
    { name: 'Taş Masajı', duration: 90, price: 700, category: 'Masaj', gender: 'all' },
    { name: 'Refleksoloji', duration: 45, price: 400, category: 'Masaj', gender: 'all' },
    { name: 'Günlük Makyaj', duration: 45, price: 400, category: 'Makyaj', gender: 'all' },
    { name: 'Gece Makyajı', duration: 60, price: 600, category: 'Makyaj', gender: 'all' },
    { name: 'Gelin Makyajı', duration: 90, price: 1200, category: 'Makyaj', gender: 'female' },
    { name: 'Kirpik Lifting', duration: 60, price: 400, category: 'Kirpik', gender: 'all' },
    { name: 'Kirpik Perma', duration: 45, price: 350, category: 'Kirpik', gender: 'all' },
    { name: 'Takma Kirpik', duration: 30, price: 300, category: 'Kirpik', gender: 'all' },
    { name: 'Kaş Laminasyonu', duration: 45, price: 400, category: 'Kaş', gender: 'all' },
    { name: 'Microblading', duration: 120, price: 2000, category: 'Kaş', gender: 'all' },
  ],

  'tirnak': [
    { name: 'Klasik Manikür', duration: 45, price: 200, category: 'Manikür', gender: 'all' },
    { name: 'Spa Manikür', duration: 60, price: 300, category: 'Manikür', gender: 'all' },
    { name: 'Parafin Manikür', duration: 75, price: 400, category: 'Manikür', gender: 'all' },
    { name: 'Klasik Pedikür', duration: 60, price: 250, category: 'Pedikür', gender: 'all' },
    { name: 'Spa Pedikür', duration: 75, price: 350, category: 'Pedikür', gender: 'all' },
    { name: 'Medikal Pedikür', duration: 90, price: 500, category: 'Pedikür', gender: 'all' },
    { name: 'Jel Tırnak', duration: 90, price: 400, category: 'Protez Tırnak', gender: 'all' },
    { name: 'Akrilik Tırnak', duration: 120, price: 500, category: 'Protez Tırnak', gender: 'all' },
    { name: 'Nail Art (Basit)', duration: 30, price: 150, category: 'Nail Art', gender: 'all' },
    { name: 'Nail Art (Detaylı)', duration: 60, price: 300, category: 'Nail Art', gender: 'all' },
    { name: 'Kalıcı Oje', duration: 45, price: 250, category: 'Kalıcı Oje', gender: 'all' },
    { name: 'Tırnak Tamiri', duration: 20, price: 100, category: 'Tamir', gender: 'all' },
  ],

  // Konaklama
  'bungalov': [
    { name: 'Standart Bungalov (2 Kişi)', duration: 1440, price: 1500, category: 'Konaklama' },
    { name: 'Aile Bungalov (4 Kişi)', duration: 1440, price: 2500, category: 'Konaklama' },
    { name: 'Lüks Bungalov (Jakuzi, Şömine)', duration: 1440, price: 3500, category: 'Konaklama' },
    { name: 'Grup Bungalov (6-8 Kişi)', duration: 1440, price: 4500, category: 'Konaklama' },
    { name: 'Kahvaltı (Kişi Başı)', duration: 0, price: 150, category: 'Ek Hizmet' },
    { name: 'Akşam Yemeği (Kişi Başı)', duration: 0, price: 300, category: 'Ek Hizmet' },
    { name: 'Mangal Alanı', duration: 0, price: 200, category: 'Ek Hizmet' },
    { name: 'Bisiklet Kiralama', duration: 0, price: 100, category: 'Ek Hizmet' },
  ],

  'otel': [
    { name: 'Standart Oda (Tek Kişi)', duration: 1440, price: 800, category: 'Oda' },
    { name: 'Standart Oda (Çift Kişi)', duration: 1440, price: 1200, category: 'Oda' },
    { name: 'Superior Oda', duration: 1440, price: 1800, category: 'Oda' },
    { name: 'Deluxe Oda', duration: 1440, price: 2500, category: 'Oda' },
    { name: 'Junior Suite', duration: 1440, price: 3500, category: 'Oda' },
    { name: 'Suite', duration: 1440, price: 5000, category: 'Oda' },
    { name: 'Kahvaltı', duration: 0, price: 200, category: 'Ek Hizmet' },
    { name: 'Yarım Pansiyon', duration: 0, price: 400, category: 'Ek Hizmet' },
    { name: 'Tam Pansiyon', duration: 0, price: 600, category: 'Ek Hizmet' },
    { name: 'Her Şey Dahil', duration: 0, price: 1000, category: 'Ek Hizmet' },
    { name: 'Spa Kullanımı', duration: 0, price: 300, category: 'Ek Hizmet' },
    { name: 'Havuz Kullanımı', duration: 0, price: 150, category: 'Ek Hizmet' },
    { name: 'Havaalanı Transferi', duration: 0, price: 500, category: 'Ek Hizmet' },
  ],

  'villa': [
    { name: 'Ekonomik Villa (2-4 Kişi)', duration: 1440, price: 3000, category: 'Villa' },
    { name: 'Standart Villa (4-6 Kişi)', duration: 1440, price: 5000, category: 'Villa' },
    { name: 'Lüks Villa (6-8 Kişi, Özel Havuz)', duration: 1440, price: 8000, category: 'Villa' },
    { name: 'Ultra Lüks Villa (8-12 Kişi, Özel Havuz, Jakuzi, Sauna)', duration: 1440, price: 15000, category: 'Villa' },
    { name: 'Günlük Temizlik', duration: 0, price: 500, category: 'Ek Hizmet' },
    { name: 'Özel Aşçı', duration: 0, price: 1500, category: 'Ek Hizmet' },
    { name: 'Havuz Bakımı', duration: 0, price: 300, category: 'Ek Hizmet' },
    { name: 'Transfer Hizmeti', duration: 0, price: 800, category: 'Ek Hizmet' },
  ],

  'kamp-alani': [
    { name: 'Çadır Alanı (Kişi Başı)', duration: 1440, price: 200, category: 'Alan' },
    { name: 'Karavan Alanı (Elektrik + Su)', duration: 1440, price: 400, category: 'Alan' },
    { name: 'Bungalow Çadır (Hazır Kurulu)', duration: 1440, price: 800, category: 'Alan' },
    { name: 'Duş & WC Kullanımı', duration: 0, price: 50, category: 'Ek Hizmet' },
    { name: 'Elektrik Bağlantısı', duration: 0, price: 100, category: 'Ek Hizmet' },
    { name: 'Mangal Alanı', duration: 0, price: 150, category: 'Ek Hizmet' },
    { name: 'Kamp Malzemesi Kiralama', duration: 0, price: 300, category: 'Ek Hizmet' },
  ],

  // Etkinlik & Organizasyon
  'dugun-organizasyon': [
    { name: 'Ekonomik Paket (100-150 Kişi)', duration: 480, price: 50000, category: 'Paket' },
    { name: 'Standart Paket (150-250 Kişi)', duration: 480, price: 100000, category: 'Paket' },
    { name: 'Premium Paket (250-400 Kişi)', duration: 480, price: 200000, category: 'Paket' },
    { name: 'VIP Paket (400+ Kişi)', duration: 480, price: 400000, category: 'Paket' },
    { name: 'Fotoğraf Hizmeti', duration: 0, price: 10000, category: 'Ek Hizmet' },
    { name: 'Video Çekimi', duration: 0, price: 15000, category: 'Ek Hizmet' },
    { name: 'Canlı Müzik', duration: 0, price: 20000, category: 'Ek Hizmet' },
    { name: 'DJ Hizmeti', duration: 0, price: 8000, category: 'Ek Hizmet' },
    { name: 'Çiçek Süsleme', duration: 0, price: 12000, category: 'Ek Hizmet' },
    { name: 'Davetiye Tasarımı', duration: 0, price: 3000, category: 'Ek Hizmet' },
    { name: 'Nikah Şekeri', duration: 0, price: 5000, category: 'Ek Hizmet' },
  ],

  'nisan-organizasyon': [
    { name: 'Mini Paket (50-75 Kişi)', duration: 240, price: 15000, category: 'Paket' },
    { name: 'Standart Paket (75-150 Kişi)', duration: 300, price: 30000, category: 'Paket' },
    { name: 'Premium Paket (150-250 Kişi)', duration: 360, price: 60000, category: 'Paket' },
    { name: 'Fotoğraf Hizmeti', duration: 0, price: 5000, category: 'Ek Hizmet' },
    { name: 'Video Çekimi', duration: 0, price: 8000, category: 'Ek Hizmet' },
    { name: 'Müzik (DJ)', duration: 0, price: 5000, category: 'Ek Hizmet' },
    { name: 'Çiçek Süsleme', duration: 0, price: 5000, category: 'Ek Hizmet' },
    { name: 'İkram Servisi', duration: 0, price: 3000, category: 'Ek Hizmet' },
  ],

  'evlilik-teklifi': [
    { name: 'Romantik Paket (Restoran/Sahil)', duration: 120, price: 5000, category: 'Paket' },
    { name: 'Sürpriz Paket (Özel Mekan, Dekorasyon)', duration: 180, price: 10000, category: 'Paket' },
    { name: 'Lüks Paket (Helikopter, Tekne, Özel Lokasyon)', duration: 240, price: 25000, category: 'Paket' },
    { name: 'Fotoğraf Hizmeti', duration: 0, price: 3000, category: 'Ek Hizmet' },
    { name: 'Video Çekimi', duration: 0, price: 5000, category: 'Ek Hizmet' },
    { name: 'Canlı Müzik', duration: 0, price: 4000, category: 'Ek Hizmet' },
    { name: 'Çiçek Süsleme', duration: 0, price: 2000, category: 'Ek Hizmet' },
    { name: 'Işık Gösterisi', duration: 0, price: 3000, category: 'Ek Hizmet' },
  ],

  'dogum-gunu': [
    { name: 'Çocuk Partisi (Animasyon, Oyun, Pasta)', duration: 180, price: 3000, category: 'Paket' },
    { name: 'Yetişkin Partisi (Mekan, İkram, Müzik)', duration: 240, price: 8000, category: 'Paket' },
    { name: 'Sürpriz Parti (Organizasyon, Dekorasyon)', duration: 300, price: 12000, category: 'Paket' },
    { name: 'Animatör', duration: 0, price: 1500, category: 'Ek Hizmet' },
    { name: 'Palyaço', duration: 0, price: 1000, category: 'Ek Hizmet' },
    { name: 'Müzik (DJ)', duration: 0, price: 2000, category: 'Ek Hizmet' },
    { name: 'Özel Pasta', duration: 0, price: 800, category: 'Ek Hizmet' },
    { name: 'Balon Süsleme', duration: 0, price: 500, category: 'Ek Hizmet' },
  ],

  'kurumsal-etkinlik': [
    { name: 'Toplantı Organizasyonu', duration: 240, price: 10000, category: 'Paket' },
    { name: 'Konferans & Seminer', duration: 480, price: 25000, category: 'Paket' },
    { name: 'Lansman & Tanıtım', duration: 360, price: 40000, category: 'Paket' },
    { name: 'Team Building', duration: 480, price: 20000, category: 'Paket' },
    { name: 'Yılbaşı & Özel Günler', duration: 360, price: 50000, category: 'Paket' },
    { name: 'Ses Sistemi', duration: 0, price: 3000, category: 'Ek Hizmet' },
    { name: 'Projeksiyon', duration: 0, price: 2000, category: 'Ek Hizmet' },
    { name: 'Catering', duration: 0, price: 15000, category: 'Ek Hizmet' },
    { name: 'Fotoğraf', duration: 0, price: 5000, category: 'Ek Hizmet' },
    { name: 'Video', duration: 0, price: 8000, category: 'Ek Hizmet' },
  ],

  // Mekan & Salon
  'dugun-salonu': [
    { name: 'Sadece Mekan (Boş Salon)', duration: 480, price: 20000, category: 'Paket' },
    { name: 'Mekan + Catering (Yemek Dahil)', duration: 480, price: 50000, category: 'Paket' },
    { name: 'Full Paket (Dekorasyon, Müzik, Servis Dahil)', duration: 480, price: 100000, category: 'Paket' },
    { name: 'Dekorasyon', duration: 0, price: 15000, category: 'Ek Hizmet' },
    { name: 'Ses Sistemi', duration: 0, price: 5000, category: 'Ek Hizmet' },
    { name: 'Işık Show', duration: 0, price: 8000, category: 'Ek Hizmet' },
    { name: 'Vale Hizmeti', duration: 0, price: 3000, category: 'Ek Hizmet' },
    { name: 'Güvenlik', duration: 0, price: 4000, category: 'Ek Hizmet' },
  ],

  'etkinlik-alani': [
    { name: 'Toplantı Salonu (10-50 Kişi)', duration: 240, price: 3000, category: 'Salon' },
    { name: 'Konferans Salonu (50-200 Kişi)', duration: 480, price: 8000, category: 'Salon' },
    { name: 'Açık Alan (Bahçe, Teras)', duration: 360, price: 5000, category: 'Alan' },
    { name: 'Çok Amaçlı Salon', duration: 480, price: 10000, category: 'Salon' },
    { name: 'Ses Sistemi', duration: 0, price: 2000, category: 'Ek Hizmet' },
    { name: 'Projeksiyon', duration: 0, price: 1500, category: 'Ek Hizmet' },
    { name: 'Catering', duration: 0, price: 5000, category: 'Ek Hizmet' },
    { name: 'Dekorasyon', duration: 0, price: 3000, category: 'Ek Hizmet' },
  ],

  // Fotoğraf & Video
  'fotograf': [
    { name: 'Düğün Çekimi (Gün Boyu, Albüm)', duration: 480, price: 8000, category: 'Düğün' },
    { name: 'Nişan/Söz Çekimi', duration: 240, price: 4000, category: 'Etkinlik' },
    { name: 'Bebek & Hamile Çekimi', duration: 120, price: 2000, category: 'Özel' },
    { name: 'Aile Çekimi', duration: 90, price: 1500, category: 'Özel' },
    { name: 'Bireysel Portre', duration: 60, price: 1000, category: 'Portre' },
    { name: 'Ürün Çekimi (E-ticaret)', duration: 120, price: 2500, category: 'Ticari' },
    { name: 'Dış Mekan Çekimi', duration: 180, price: 3000, category: 'Özel' },
    { name: 'Stüdyo Çekimi', duration: 120, price: 2000, category: 'Stüdyo' },
    { name: 'Temel Paket (2 saat, 50 fotoğraf)', duration: 120, price: 2000, category: 'Paket' },
    { name: 'Standart Paket (4 saat, 100 fotoğraf)', duration: 240, price: 4000, category: 'Paket' },
    { name: 'Premium Paket (8 saat, 200 fotoğraf, Albüm)', duration: 480, price: 8000, category: 'Paket' },
  ],

  'video-produksiyon': [
    { name: 'Düğün Videosu (Klip)', duration: 480, price: 10000, category: 'Düğün' },
    { name: 'Düğün Videosu (Belgesel)', duration: 480, price: 15000, category: 'Düğün' },
    { name: 'Tanıtım Filmi (Kurumsal)', duration: 240, price: 12000, category: 'Kurumsal' },
    { name: 'Reklam Çekimi', duration: 360, price: 20000, category: 'Ticari' },
    { name: 'Etkinlik Videosu', duration: 300, price: 8000, category: 'Etkinlik' },
    { name: 'Müzik Klibi', duration: 480, price: 25000, category: 'Müzik' },
    { name: 'Temel Paket (4 saat çekim, 5 dk klip)', duration: 240, price: 8000, category: 'Paket' },
    { name: 'Standart Paket (8 saat, 10 dk klip + belgesel)', duration: 480, price: 15000, category: 'Paket' },
    { name: 'Premium Paket (Full gün, 15 dk klip + belgesel + drone)', duration: 600, price: 25000, category: 'Paket' },
  ],

  'drone-cekim': [
    { name: 'Düğün Drone Çekimi', duration: 120, price: 3000, category: 'Düğün' },
    { name: 'Gayrimenkul Çekimi', duration: 60, price: 2000, category: 'Ticari' },
    { name: 'Etkinlik Havadan Çekim', duration: 90, price: 2500, category: 'Etkinlik' },
    { name: 'Doğa & Manzara', duration: 120, price: 3000, category: 'Özel' },
    { name: 'Tanıtım Filmi', duration: 180, price: 5000, category: 'Kurumsal' },
    { name: 'Temel Paket (30 dk, 10 fotoğraf + 2 dk video)', duration: 30, price: 2000, category: 'Paket' },
    { name: 'Standart Paket (1 saat, 20 fotoğraf + 5 dk video)', duration: 60, price: 3500, category: 'Paket' },
    { name: 'Premium Paket (2 saat, 40 fotoğraf + 10 dk video)', duration: 120, price: 6000, category: 'Paket' },
  ],

  // Yemek & İkram
  'catering': [
    { name: 'Açık Büfe (Soğuk) - Kişi Başı', duration: 0, price: 150, category: 'Açık Büfe' },
    { name: 'Açık Büfe (Sıcak) - Kişi Başı', duration: 0, price: 250, category: 'Açık Büfe' },
    { name: 'Oturmalı Yemek (Servis) - Kişi Başı', duration: 0, price: 400, category: 'Oturmalı' },
    { name: 'Kokteyl İkramı - Kişi Başı', duration: 0, price: 200, category: 'Kokteyl' },
    { name: 'Kahvaltı Organizasyonu - Kişi Başı', duration: 0, price: 100, category: 'Kahvaltı' },
    { name: 'Ekonomik Paket (150 TL/kişi)', duration: 0, price: 150, category: 'Paket' },
    { name: 'Standart Paket (250 TL/kişi)', duration: 0, price: 250, category: 'Paket' },
    { name: 'Premium Paket (400 TL/kişi)', duration: 0, price: 400, category: 'Paket' },
    { name: 'Lüks Paket (600+ TL/kişi)', duration: 0, price: 600, category: 'Paket' },
    { name: 'Servis Elemanı', duration: 0, price: 1000, category: 'Ek Hizmet' },
    { name: 'Masa Düzeni', duration: 0, price: 2000, category: 'Ek Hizmet' },
    { name: 'Dekorasyon', duration: 0, price: 3000, category: 'Ek Hizmet' },
  ],

  'pasta-tatli': [
    { name: 'Düğün Pastası (3 Kat)', duration: 0, price: 2000, category: 'Düğün Pastası' },
    { name: 'Düğün Pastası (5 Kat)', duration: 0, price: 3500, category: 'Düğün Pastası' },
    { name: 'Düğün Pastası (7 Kat)', duration: 0, price: 5000, category: 'Düğün Pastası' },
    { name: 'Doğum Günü Pastası (1 kg)', duration: 0, price: 400, category: 'Doğum Günü' },
    { name: 'Doğum Günü Pastası (2 kg)', duration: 0, price: 700, category: 'Doğum Günü' },
    { name: 'Özel Gün Pastası', duration: 0, price: 600, category: 'Özel' },
    { name: 'Cupcake (12 adet)', duration: 0, price: 300, category: 'Mini Tatlı' },
    { name: 'Mini Tatlılar (50 adet)', duration: 0, price: 800, category: 'Mini Tatlı' },
    { name: 'Tatlı Masası (Candy Bar)', duration: 0, price: 3000, category: 'Tatlı Masası' },
  ],

  'kahve-ikram': [
    { name: 'Mobil Kahve Arabası (50 kişi)', duration: 240, price: 1500, category: 'Mobil Kahve' },
    { name: 'Mobil Kahve Arabası (100 kişi)', duration: 240, price: 2500, category: 'Mobil Kahve' },
    { name: 'Mobil Kahve Arabası (200 kişi)', duration: 240, price: 4000, category: 'Mobil Kahve' },
    { name: 'Barista Hizmeti (Saatlik)', duration: 60, price: 500, category: 'Barista' },
    { name: 'Özel Kahve İkramı', duration: 180, price: 2000, category: 'Özel' },
    { name: 'Çay & Kahve Servisi', duration: 240, price: 1000, category: 'Servis' },
  ],
};

// Helper fonksiyonlar
export function getServiceTemplates(categoryId: CategoryId): ServiceTemplate[] {
  return SERVICE_TEMPLATES[categoryId] || [];
}

export function hasServiceTemplates(categoryId: CategoryId): boolean {
  return SERVICE_TEMPLATES[categoryId] && SERVICE_TEMPLATES[categoryId].length > 0;
}
