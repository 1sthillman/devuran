import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DistanceSalesAgreement() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Mesafeli Satış Sözleşmesi</h1>
          <p className="text-sm text-gray-400 mb-8">6502 Sayılı Tüketicinin Korunması Hakkında Kanun Uyarınca</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 1 - Taraflar</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">SATICI (Hizmet Sağlayıcı)</p>
                  <p className="text-sm">Ünvan: Devuran</p>
                  <p className="text-sm">Adres: Maslak, İstanbul</p>
                  <p className="text-sm">E-posta: adistoww@gmail.com</p>
                  <p className="text-sm">Telefon: +90 543 926 96 70</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">ALICI (Tüketici/Kullanıcı)</p>
                  <p className="text-sm">Sipariş/rezervasyon oluşturan kişi</p>
                  <p className="text-sm">Bilgiler sipariş sırasında alınır</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 2 - Sözleşme Konusu</h2>
              <p className="leading-relaxed">
                İşbu sözleşme, ALICI'nın SATICI'ya ait www.devuran.com internet sitesi üzerinden elektronik 
                ortamda siparişini verdiği/rezervasyon yaptığı hizmetin satışı ve teslimi ile ilgili olarak 
                6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği 
                hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 3 - Hizmet Bilgileri</h2>
              <p className="mb-3">Platform üzerinden sunulan hizmetler:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Online randevu ve rezervasyon hizmeti</li>
                <li>Ödeme aracılık hizmeti (iyzico altyapısı)</li>
                <li>İşletme-müşteri eşleştirme hizmeti</li>
                <li>Bildirim ve hatırlatma hizmetleri</li>
              </ul>
              <p className="mt-3 text-sm bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                <strong>Önemli:</strong> Asıl hizmet (kuaför, otel, restoran vb.) işletme tarafından sunulur. 
                Platform sadece aracılık ve yönetim hizmeti sağlar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 4 - Sözleşmenin Kurulması</h2>
              <p className="leading-relaxed mb-3">
                İşbu sözleşme, ALICI'nın www.devuran.com sitesinde yer alan ön bilgilendirme formunu ve 
                mesafeli satış sözleşmesini elektronik ortamda onaylaması ile kurulmuş sayılır.
              </p>
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-sm">✓ ALICI, sipariş/rezervasyon vermeden önce:</p>
                <ul className="text-sm space-y-1 ml-4 mt-2">
                  <li>• Hizmet bilgilerini okuyup anladığını</li>
                  <li>• Fiyat ve ödeme şartlarını kabul ettiğini</li>
                  <li>• İptal ve cayma hakkı hakkında bilgilendirildiğini</li>
                  <li>• Kullanım koşullarını ve gizlilik politikasını okuduğunu</li>
                </ul>
                <p className="text-sm mt-2">onaylar.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 5 - Ücret ve Ödeme</h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  Hizmet bedeli, sipariş/rezervasyon sırasında gösterilen tutardır. Ödemeler iyzico güvenli 
                  ödeme altyapısı üzerinden gerçekleştirilir.
                </p>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">Ödeme Yöntemleri:</p>
                  <ul className="text-sm space-y-1">
                    <li>✓ Kredi kartı (Visa, Mastercard)</li>
                    <li>✓ Banka kartı</li>
                    <li>✓ 3D Secure güvenli ödeme</li>
                  </ul>
                </div>
                <p className="text-sm text-yellow-200">
                  <strong>Güvenlik:</strong> Kart bilgileri platform sunucularında saklanmaz, 
                  tüm işlemler PCI-DSS sertifikalı iyzico üzerinden gerçekleştirilir.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 6 - Cayma Hakkı</h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  ALICI, 6502 sayılı Tüketicinin Korunması Hakkında Kanun'un 48. maddesi hükmü gereğince, 
                  hizmetin sunulmasından önce, 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai 
                  şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">Cayma Hakkının İstisnaları:</p>
                  <p className="text-sm mb-2">Aşağıdaki durumlarda cayma hakkı kullanılamaz:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Belirli bir tarihte veya dönemde yapılması gereken hizmetler 
                        (randevu, otel rezervasyonu vb.)</li>
                    <li>• ALICI'nın onayı ile hizmet ifasına başlanmış ise</li>
                    <li>• Dijital içerik ve hizmetlerin teslimatı başlamışsa</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">Cayma Hakkının Kullanımı:</p>
                  <p className="text-sm">E-posta: adistoww@gmail.com</p>
                  <p className="text-sm">Telefon: +90 543 926 96 70</p>
                  <p className="text-sm mt-2">İade işlemleri 14 gün içinde gerçekleştirilir.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 7 - İptal ve İade Koşulları</h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  İptal koşulları işletmeler tarafından belirlenir. Her işletmenin farklı iptal politikası 
                  olabilir. İptal talebiniz rezervasyon detayları sayfasından veya müşteri hizmetleri 
                  üzerinden yapılabilir.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                    <p className="font-semibold text-white mb-2">Ücretsiz İptal</p>
                    <p className="text-sm">İşletme politikasına göre belirli süre öncesi iptaller 
                    ücretsizdir (genellikle 24-48 saat).</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
                    <p className="font-semibold text-white mb-2">Geç İptal</p>
                    <p className="text-sm">Son dakika iptallerde işletme ceza/kesinti uygulayabilir.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 8 - Teslimat</h2>
              <p className="leading-relaxed">
                Hizmet, rezervasyon sırasında belirlenen tarih ve saatte işletme lokasyonunda veya 
                belirtilen adreste (teslimat hizmetlerinde) sunulur. Gecikme durumunda işletme sorumludur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 9 - Tarafların Yükümlülükleri</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">SATICI Yükümlülükleri:</p>
                  <ul className="text-sm space-y-1">
                    <li>✓ Platform güvenliğini sağlamak</li>
                    <li>✓ Doğru bilgilendirme yapmak</li>
                    <li>✓ Ödeme güvenliğini sağlamak</li>
                    <li>✓ Müşteri destek hizmeti sunmak</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold text-white mb-2">ALICI Yükümlülükleri:</p>
                  <ul className="text-sm space-y-1">
                    <li>✓ Doğru bilgi vermek</li>
                    <li>✓ Ödeme yükümlülüğünü yerine getirmek</li>
                    <li>✓ Randevu saatine uymak</li>
                    <li>✓ İptal kurallarına uymak</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 10 - Uyuşmazlık Çözümü</h2>
              <p className="leading-relaxed mb-3">
                İşbu sözleşmeden doğabilecek uyuşmazlıklarda, her yıl Gümrük ve Ticaret Bakanlığı 
                tarafından belirlenen parasal sınırlar dahilinde tüketicinin yerleşim yerindeki veya 
                tüketici işleminin yapıldığı yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri 
                yetkilidir.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                <p className="text-sm">
                  <strong>İtiraz ve Şikayet:</strong> Tüketici Hakem Heyeti veya Tüketici Mahkemesine 
                  başvuru yapılabilir. Ayrıca platform üzerinden de şikayet bildirilebilir.
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-3">Madde 11 - Yürürlük</h2>
              <p className="leading-relaxed">
                İşbu sözleşme, ALICI tarafından sipariş/rezervasyon onaylandığı anda yürürlüğe girer. 
                ALICI, bu sözleşme hükümlerini okuduğunu, anladığını ve kabul ettiğini beyan eder.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm">Sözleşme Tarihi: 10 Temmuz 2026</p>
                <p className="text-sm">Platform: www.devuran.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
