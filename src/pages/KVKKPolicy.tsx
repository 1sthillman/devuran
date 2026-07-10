import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KVKKPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--deep-space)] via-[var(--obsidian-rim)] to-[var(--deep-space)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--liquid-chrome)] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Geri Dön</span>
        </button>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">KVKK Aydınlatma Metni</h1>
          <p className="text-sm text-gray-400 mb-2">Kişisel Verilerin Korunması Kanunu</p>
          <p className="text-sm text-gray-400 mb-8">Son Güncelleme: 10 Temmuz 2026</p>

          <div className="space-y-6 text-gray-300">
            <section className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-3">Veri Sorumlusu</h2>
              <p className="leading-relaxed mb-3">
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz 
                veri sorumlusu sıfatıyla Devuran tarafından aşağıda açıklanan kapsamda işlenebilecektir.
              </p>
              <div className="bg-white/5 p-4 rounded-xl">
                <p><strong>Devuran</strong></p>
                <p>E-posta: adistoww@gmail.com</p>
                <p>Telefon: +90 543 926 96 70</p>
                <p>Adres: Maslak, İstanbul</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. İşlenen Kişisel Veriler</h2>
              <p className="mb-3">Platform kullanımı sırasında aşağıdaki kişisel verileriniz işlenmektedir:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <h3 className="font-semibold text-white mb-2">Kimlik Bilgileri</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Ad, soyad</li>
                    <li>• Doğum tarihi (opsiyonel)</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <h3 className="font-semibold text-white mb-2">İletişim Bilgileri</h3>
                  <ul className="text-sm space-y-1">
                    <li>• E-posta adresi</li>
                    <li>• Telefon numarası</li>
                    <li>• Adres (teslimat için)</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <h3 className="font-semibold text-white mb-2">İşlem Bilgileri</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Randevu/rezervasyon geçmişi</li>
                    <li>• Hizmet tercihleri</li>
                    <li>• İptal kayıtları</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <h3 className="font-semibold text-white mb-2">Finansal Bilgiler</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Ödeme bilgileri (PayTR üzerinden)</li>
                    <li>• Fatura bilgileri</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Kişisel Verilerin İşlenme Amaçları</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Randevu ve rezervasyon hizmetlerinin sunulması</li>
                <li>Müşteri ilişkileri yönetimi</li>
                <li>Ödeme işlemlerinin güvenli şekilde gerçekleştirilmesi</li>
                <li>Platform güvenliğinin sağlanması</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>İstatistiksel analiz ve hizmet iyileştirme</li>
                <li>Müşteri memnuniyeti ve şikayet yönetimi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Kişisel Verilerin Aktarımı</h2>
              <p className="mb-3">Kişisel verileriniz aşağıdaki kategorilerdeki alıcılara aktarılabilir:</p>
              <div className="space-y-3">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">Ödeme Hizmeti Sağlayıcıları</p>
                  <p className="text-sm">PayTR ve diğer PCI-DSS sertifikalı ödeme kuruluşları</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">İşletmeler</p>
                  <p className="text-sm">Randevu aldığınız işletmelerle (sadece hizmet sunumu için gerekli bilgiler)</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">Teknoloji Sağlayıcıları</p>
                  <p className="text-sm">Google Cloud Platform / Firebase (veri barındırma ve yedekleme)</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">Yasal Merciler</p>
                  <p className="text-sm">Mahkeme kararı veya yasal zorunluluk halinde yetkili kamu kurum ve kuruluşları</p>
                </div>
              </div>
            </section>

            <section className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-3">4. KVKK Kapsamındaki Haklarınız</h2>
              <p className="mb-3">KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm">✓ Kişisel verilerinizin işlenip işlenmediğini öğrenme</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm">✓ İşlenmişse buna ilişkin bilgi talep etme</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm">✓ İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm">✓ Yurt içi/dışı aktarılan üçüncü kişileri bilme</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm">✓ Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm">✓ KVKK'da öngörülen şartlarda silinmesini/yok edilmesini isteme</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm">✓ Aktarılan 3. kişilere düzeltme/silme işleminin bildirilmesini isteme</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-sm">✓ Otomatik sistemlerle analiz sonucu aleyhte sonuç çıkmasına itiraz etme</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Başvuru Yöntemi</h2>
              <p className="mb-3">Haklarınızı kullanmak için aşağıdaki yöntemlerle başvurabilirsiniz:</p>
              <div className="bg-white/5 p-6 rounded-xl space-y-4">
                <div>
                  <p className="font-semibold text-white mb-2">E-posta ile Başvuru:</p>
                  <p className="text-sm">
                    <a href="mailto:adistoww@gmail.com" className="text-[var(--liquid-chrome)] hover:underline">
                      adistoww@gmail.com
                    </a> adresine "KVKK Başvurusu" konulu e-posta gönderin
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-2">Yazılı Başvuru:</p>
                  <p className="text-sm">Maslak, İstanbul adresine ıslak imzalı dilekçe ile başvurun</p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm text-yellow-200">
                    <strong>Önemli:</strong> Başvurularınız kimlik teyidi sonrası en geç 30 gün içinde 
                    ücretsiz olarak yanıtlanacaktır.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Veri Güvenliği</h2>
              <p className="mb-3">Kişisel verilerinizin güvenliği için aldığımız önlemler:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SSL/TLS şifreleme ile veri iletimi</li>
                <li>Firebase güvenlik kuralları ile erişim kontrolü</li>
                <li>Şifrelerin hash'lenerek saklanması</li>
                <li>Düzenli güvenlik testleri ve güncellemeleri</li>
                <li>Kart bilgilerinin sunucuda saklanmaması (PCI-DSS uyumlu PayTR kullanımı)</li>
                <li>Yetkilendirme ve rol bazlı erişim kontrolü</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Saklama Süreleri</h2>
              <p className="leading-relaxed">
                Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen 
                saklama süreleri dahilinde muhafaza edilecektir. Yasal saklama yükümlülüğü bulunmayan veya 
                işleme amacı ortadan kalkan veriler silinir, yok edilir veya anonim hale getirilir.
              </p>
            </section>

            <section className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-3">İletişim</h2>
              <p className="mb-3">KVKK ile ilgili sorularınız için:</p>
              <div className="bg-white/5 p-4 rounded-xl">
                <p><strong>E-posta:</strong> adistoww@gmail.com</p>
                <p><strong>Telefon:</strong> +90 543 926 96 70</p>
                <p><strong>Adres:</strong> Maslak, İstanbul</p>
                <p><strong>Yanıt Süresi:</strong> En geç 30 gün</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
