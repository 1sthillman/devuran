import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Kullanım Koşulları</h1>
          <p className="text-sm text-gray-400 mb-8">Son Güncelleme: 10 Temmuz 2026</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Hizmetin Kapsamı</h2>
              <p className="leading-relaxed">
                Devuran ("Platform", "Biz"), kullanıcılarına ("Kullanıcı", "Siz") online randevu, rezervasyon 
                ve ödeme hizmetleri sunan bir platformdur. Bu kullanım koşulları, Platform'un kullanımı ile 
                ilgili hak ve yükümlülüklerinizi düzenlemektedir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Taraflar</h2>
              <div className="space-y-3">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold mb-2">Platform Sahibi:</p>
                  <p>Devuran</p>
                  <p>E-posta: adistoww@gmail.com</p>
                  <p>Telefon: +90 543 926 96 70</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="font-semibold mb-2">Kullanıcılar:</p>
                  <p>Platform'a kayıt olan tüm gerçek ve tüzel kişiler</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Üyelik ve Hesap Güvenliği</h2>
              <p className="mb-3">Platform'u kullanmak için üyelik oluşturmanız gerekmektedir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>18 yaşından büyük olmalısınız (veya veli/vasi onayı almalısınız)</li>
                <li>Kayıt sırasında doğru ve güncel bilgiler vermelisiniz</li>
                <li>Hesap güvenliğiniz sizin sorumluluğunuzdadır</li>
                <li>Şifrenizi kimseyle paylaşmamalısınız</li>
                <li>Hesabınızdan yapılan tüm işlemlerden siz sorumlusunuz</li>
                <li>Yetkisiz erişim durumunda derhal bize bildirmelisiniz</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Randevu ve Rezervasyon Kuralları</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-white mb-2">4.1. Randevu Oluşturma</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Randevular işletmelerin çalışma saatleri içinde alınabilir</li>
                    <li>Bazı hizmetler için ön ödeme veya kapora gerekebilir</li>
                    <li>Fiyatlandırma işletmeler tarafından belirlenir</li>
                    <li>Platform sadece aracılık hizmeti sunar</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">4.2. İptal ve Değişiklik</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>İptal koşulları işletme bazında değişiklik gösterebilir</li>
                    <li>Son dakika iptalleri ücretlendirilebilir</li>
                    <li>İade işlemleri işletmenin iptal politikasına tabidir</li>
                    <li>Platform, işletme politikalarından sorumlu değildir</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Ödeme ve Faturalandırma</h2>
              <p className="mb-3">Ödeme işlemleri PayTR güvenli ödeme altyapısı üzerinden gerçekleştirilir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kredi kartı bilgileri Platform sunucularında saklanmaz (PCI-DSS uyumlu)</li>
                <li>Tüm ödemeler 3D Secure ile güvence altındadır</li>
                <li>İşlem onayından sonra iptal/iade işlemleri işletme politikalarına tabidir</li>
                <li>Hatalı ödeme durumunda adistoww@gmail.com ile iletişime geçin</li>
                <li>Fiyatlar işletmeler tarafından belirlenir ve güncellenebilir</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. İşletme Sahipleri İçin Özel Koşullar</h2>
              <p className="mb-3">İşletme hesabı açan kullanıcılar ek yükümlülükleri kabul eder:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Doğru Bilgi:</strong> İşletme bilgileri, hizmetler ve fiyatlar güncel ve doğru olmalıdır</li>
                <li><strong>Hizmet Kalitesi:</strong> Platform üzerinden alınan randevular için kaliteli hizmet sunulmalıdır</li>
                <li><strong>İptal Politikası:</strong> Açık ve adil bir iptal politikası belirlenmeli ve uygulanmalıdır</li>
                <li><strong>İletişim:</strong> Müşteri sorularına makul sürede cevap verilmelidir</li>
                <li><strong>Yasal Yükümlülükler:</strong> İşletme ruhsatı, vergi kaydı gibi yasal zorunluluklar yerine getirilmelidir</li>
                <li><strong>Komisyon:</strong> Platform hizmet bedeli olarak işlem üzerinden komisyon alabilir</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Yasak Davranışlar</h2>
              <p className="mb-3">Aşağıdaki davranışlar kesinlikle yasaktır ve hesap kapatma sebebidir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sahte bilgi veya kimlik kullanma</li>
                <li>Sistem güvenliğini tehdit eden eylemler (hacking, DDoS vb.)</li>
                <li>Diğer kullanıcıları rahatsız etme, taciz veya hakaret</li>
                <li>Spam veya istenmeyen ticari içerik gönderme</li>
                <li>Telif haklı içeriği izinsiz kullanma</li>
                <li>Platform'u yasadışı amaçlarla kullanma</li>
                <li>Birden fazla sahte hesap oluşturma</li>
                <li>Bot veya otomasyon araçları kullanma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Fikri Mülkiyet Hakları</h2>
              <p className="leading-relaxed">
                Platform'daki tüm içerik, tasarım, logo, yazılım ve diğer materyaller Devuran'ın veya 
                lisans sahiplerinin fikri mülkiyetidir. İzinsiz kullanım, kopyalama, dağıtım veya değiştirme 
                yasaktır ve yasal işlem başlatılmasına sebep olur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Sorumluluk Sınırlamaları</h2>
              <div className="space-y-3">
                <p className="font-semibold text-white">Platform, aşağıdaki durumlardan sorumlu değildir:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>İşletmelerin sunduğu hizmet kalitesi</li>
                  <li>İşletme-müşteri arasında çıkan anlaşmazlıklar</li>
                  <li>Kullanıcıların hatalı bilgi vermesi</li>
                  <li>Üçüncü taraf hizmetlerdeki aksaklıklar (ödeme, harita vb.)</li>
                  <li>İnternet kesintisi veya teknik arızalar</li>
                  <li>Kullanıcı cihaz ve ağ güvenliği</li>
                  <li>Force majeure (doğal afet, savaş, pandemi vb.)</li>
                </ul>
                <p className="mt-3 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-yellow-200">
                  <strong>Önemli:</strong> Platform "olduğu gibi" sunulmaktadır. Kesintisiz ve hatasız 
                  çalışma garantisi verilmemektedir.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Hesap Askıya Alma ve Kapatma</h2>
              <p className="mb-3">Platform, aşağıdaki durumlarda kullanıcı hesaplarını askıya alabilir veya kapatabilir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kullanım koşullarının ihlali</li>
                <li>Hileli veya kötü niyetli kullanım</li>
                <li>Diğer kullanıcılardan şikayetler</li>
                <li>Ödeme sorunları veya borçlar</li>
                <li>Yasal zorunluluklar</li>
                <li>Kullanıcının talebi</li>
              </ul>
              <p className="mt-3">
                Hesap kapatma durumunda kalan bakiyeler ve rezervasyonlar için iletişime geçilecektir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Kişisel Verilerin Korunması</h2>
              <p className="leading-relaxed">
                Kişisel verileriniz KVKK ve GDPR kapsamında korunmaktadır. Detaylı bilgi için 
                <a href="/privacy" className="text-[var(--liquid-chrome)] hover:underline ml-1">
                  Gizlilik Politikamızı
                </a> inceleyebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Değişiklikler</h2>
              <p className="leading-relaxed">
                Devuran, bu kullanım koşullarını önceden haber vermeksizin değiştirme hakkını saklı tutar. 
                Değişiklikler Platform'da yayınlandığı tarihte yürürlüğe girer. Önemli değişiklikler 
                e-posta ile bildirilecektir. Platform'u kullanmaya devam etmeniz, güncellenmiş koşulları 
                kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</h2>
              <p className="leading-relaxed mb-3">
                Bu sözleşme Türkiye Cumhuriyeti kanunlarına tabidir. Sözleşmeden doğabilecek 
                uyuşmazlıkların çözümünde İzmir Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
              <p className="bg-white/5 p-4 rounded-xl">
                Uyuşmazlıklar için öncelikle dostane çözüm aranacak, anlaşma sağlanamazsa yasal yollara 
                başvurulacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">14. İletişim</h2>
              <p className="leading-relaxed mb-3">
                Kullanım koşulları hakkında sorularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="bg-white/5 p-4 rounded-xl">
                <p><strong>E-posta:</strong> adistoww@gmail.com</p>
                <p><strong>Telefon:</strong> +90 543 926 96 70</p>
                <p><strong>Adres:</strong> Maslak, İstanbul</p>
                <p><strong>Destek:</strong> Pazartesi-Cuma 09:00-18:00</p>
              </div>
            </section>

            <section className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-3">15. Onay</h2>
              <p className="leading-relaxed">
                Platform'a üye olarak veya Platform'u kullanarak, bu kullanım koşullarını okuduğunuzu, 
                anladığınızı ve kabul ettiğinizi beyan edersiniz. Bu sözleşmenin elektronik ortamda 
                imzalanmış halinin yasal bağlayıcılığı kabul edilir.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
