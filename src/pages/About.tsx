import { ArrowLeft, Users, Target, Award, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Hakkımızda</h1>
          <p className="text-sm text-gray-400 mb-8">Devuran - Online Randevu ve Rezervasyon Platformu</p>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Biz Kimiz?</h2>
              <p className="leading-relaxed mb-4">
                Devuran, Türkiye'nin önde gelen online randevu ve rezervasyon platformudur. Müşteriler ile 
                işletmeleri bir araya getirerek, randevu alma sürecini hızlı, kolay ve güvenli hale getiriyoruz.
              </p>
              <p className="leading-relaxed">
                2026 yılında kurulan platformumuz, kuaför, güzellik merkezi, otel, restoran, etkinlik mekanları 
                ve daha birçok sektörde hizmet veren işletmelere dijital çözümler sunmaktadır.
              </p>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Target size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Misyonumuz</h3>
                <p className="text-sm leading-relaxed">
                  İşletmelerin dijital dönüşümüne öncülük ederek, müşteri memnuniyetini en üst seviyeye 
                  çıkarmak ve randevu süreçlerini optimize etmek.
                </p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Award size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Vizyonumuz</h3>
                <p className="text-sm leading-relaxed">
                  Türkiye'nin en güvenilir ve kullanıcı dostu randevu platformu olarak, her sektörde 
                  standart haline gelmek.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Ne Yapıyoruz?</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20">
                  <h4 className="font-semibold text-white mb-2">Randevu Yönetimi</h4>
                  <p className="text-sm">Online randevu alma, iptal ve değiştirme işlemleri</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 rounded-xl border border-blue-500/20">
                  <h4 className="font-semibold text-white mb-2">Rezervasyon Sistemi</h4>
                  <p className="text-sm">Otel, restoran ve etkinlik rezervasyonları</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 rounded-xl border border-emerald-500/20">
                  <h4 className="font-semibold text-white mb-2">Güvenli Ödeme</h4>
                  <p className="text-sm">iyzico altyapısıyla güvenli online ödeme</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Neden Devuran?</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                  <Shield size={20} className="text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Güvenli ve Şeffaf</h4>
                    <p className="text-sm">KVKK uyumlu, SSL güvenliği ve güvenli ödeme altyapısı</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                  <Users size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Kullanıcı Dostu</h4>
                    <p className="text-sm">Modern arayüz ve kolay kullanım</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                  <Award size={20} className="text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">7/24 Destek</h4>
                    <p className="text-sm">Müşteri memnuniyeti odaklı destek ekibi</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 p-6 rounded-2xl border border-purple-500/20">
              <h2 className="text-2xl font-semibold text-white mb-4">İletişim Bilgilerimiz</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">E-posta</p>
                  <a href="mailto:adistoww@gmail.com" className="text-[var(--liquid-chrome)] hover:underline">
                    adistoww@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Telefon</p>
                  <a href="tel:+905439269670" className="text-[var(--liquid-chrome)] hover:underline">
                    +90 543 926 96 70
                  </a>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Adres</p>
                  <p className="text-white">Maslak, İstanbul</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Çalışma Saatleri</p>
                  <p className="text-white">Pazartesi-Cuma: 09:00-18:00</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Yasal Bilgiler</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/privacy')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all"
                >
                  Gizlilik Politikası
                </button>
                <button
                  onClick={() => navigate('/terms')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all"
                >
                  Kullanım Koşulları
                </button>
                <button
                  onClick={() => navigate('/kvkk')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all"
                >
                  KVKK Aydınlatma Metni
                </button>
                <button
                  onClick={() => navigate('/mesafeli-satis')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all"
                >
                  Mesafeli Satış Sözleşmesi
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
