import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Gizlilik Politikası</h1>
          <p className="text-sm text-gray-400 mb-8">Son Güncelleme: 10 Temmuz 2026</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Genel Bilgiler</h2>
              <p className="leading-relaxed">
                Bu gizlilik politikası, Devuran platformu ("Platform", "Biz", "Bize") tarafından kullanıcılarının 
                ("Kullanıcı", "Siz") kişisel verilerinin toplanması, işlenmesi, saklanması ve korunması ile ilgili 
                uygulamaları açıklamaktadır. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında 
                bilgilendirme yükümlülüğümüzü yerine getirmek amacıyla hazırlanmıştır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Veri Sorumlusu</h2>
              <p className="leading-relaxed mb-2">
                Kişisel verilerinizin işlenmesinden sorumlu veri sorumlusu Devuran'dır.
              </p>
              <div className="bg-white/5 p-4 rounded-xl">
                <p><strong>İletişim:</strong> adistoww@gmail.com</p>
                <p><strong>Telefon:</strong> +90 543 926 96 70</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Toplanan Kişisel Veriler</h2>
              <p className="mb-3">Platform üzerinde aşağıdaki kişisel verileriniz toplanmaktadır:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
                <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
                <li><strong>Müşteri İşlem Bilgileri:</strong> Randevu geçmişi, rezervasyon bilgileri, tercihler</li>
                <li><strong>Finansal Bilgiler:</strong> Ödeme işlemleri (PayTR güvenli ödeme altyapısı üzerinden)</li>
                <li><strong>Konum Bilgileri:</strong> İşletme adresi (işletme sahipleri için), teslimat adresi (sipariş hizmetlerinde)</li>
                <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, çerez bilgileri</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Kişisel Verilerin İşlenme Amaçları</h2>
              <p className="mb-3">Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Randevu ve rezervasyon işlemlerinin gerçekleştirilmesi</li>
                <li>Müşteri ilişkileri yönetimi ve müşteri memnuniyetinin sağlanması</li>
                <li>Ödeme işlemlerinin güvenli şekilde gerçekleştirilmesi</li>
                <li>İletişim ve bilgilendirme hizmetlerinin sunulması</li>
                <li>Platform güvenliğinin sağlanması</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>İstatistiksel analiz ve hizmet iyileştirme çalışmaları</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Kişisel Verilerin Aktarımı</h2>
              <p className="mb-3">Kişisel verileriniz aşağıdaki durumlarda üçüncü kişilerle paylaşılabilir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Ödeme Kuruluşları:</strong> PayTR ve diğer ödeme hizmeti sağlayıcıları (PCI-DSS uyumlu)</li>
                <li><strong>İşletmeler:</strong> Randevu aldığınız işletmelerle (sadece hizmet sunumu için gerekli bilgiler)</li>
                <li><strong>Bulut Hizmet Sağlayıcıları:</strong> Firebase/Google Cloud Platform (veri barındırma)</li>
                <li><strong>Yasal Yükümlülükler:</strong> Mahkeme, savcılık, kolluk kuvvetleri gibi yetkili merciler</li>
              </ul>
              <p className="mt-3">
                Verileriniz yurt dışına (Google Cloud sunucularına) aktarılmaktadır. Bu aktarım, yeterli 
                korumayı sağlayan ülkelere veya KVKK'nın öngördüğü güvenlik tedbirleriyle yapılmaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Kişisel Verilerin Saklanması ve Güvenliği</h2>
              <p className="leading-relaxed mb-3">
                Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve yasal saklama sürelerine 
                uygun olarak saklanmaktadır. Verilerinizin güvenliği için:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SSL/TLS şifreleme protokolleri kullanılmaktadır</li>
                <li>Firebase güvenlik kuralları ile erişim kontrolü yapılmaktadır</li>
                <li>Düzenli güvenlik testleri ve güncellemeleri uygulanmaktadır</li>
                <li>Şifreler hash'lenerek saklanmaktadır</li>
                <li>Ödeme bilgileri platform sunucularında saklanmamaktadır</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. KVKK Kapsamındaki Haklarınız</h2>
              <p className="mb-3">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                <li>Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
                <li>Düzeltme, silme ve yok edilme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize 
                    bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
              </ul>
              <p className="mt-4 bg-white/5 p-4 rounded-xl">
                <strong>Başvuru:</strong> Haklarınızı kullanmak için adistoww@gmail.com adresine yazılı olarak 
                başvurabilirsiniz. Başvurularınız 30 gün içinde yanıtlanacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Çerezler (Cookies)</h2>
              <p className="leading-relaxed">
                Platform, kullanıcı deneyimini iyileştirmek ve analiz yapmak amacıyla çerez teknolojisi 
                kullanmaktadır. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz. Ancak çerezleri 
                devre dışı bırakmanız durumunda Platform'un bazı özelliklerini kullanamayabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Politika Değişiklikleri</h2>
              <p className="leading-relaxed">
                Bu gizlilik politikası gerektiğinde güncellenebilir. Yapılan değişiklikler Platform üzerinde 
                yayınlandığı tarihte yürürlüğe girer. Önemli değişiklikler e-posta yoluyla bildirilecektir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. İletişim</h2>
              <p className="leading-relaxed">
                Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="bg-white/5 p-4 rounded-xl mt-3">
                <p><strong>E-posta:</strong> adistoww@gmail.com</p>
                <p><strong>Telefon:</strong> +90 543 926 96 70</p>
                <p><strong>Adres:</strong> Maslak, İstanbul</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
