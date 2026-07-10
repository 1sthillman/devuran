import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo ve Hakkında */}
          <div>
            <h3 className="font-bold text-lg text-white mb-3">Devuran</h3>
            <p className="text-sm text-gray-400">
              Online randevu ve rezervasyon sistemi ile işletmenizi dijitalleştirin.
            </p>
          </div>

          {/* Yasal */}
          <div>
            <h4 className="font-semibold text-white mb-3">Yasal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-400 hover:text-[var(--liquid-chrome)] transition-colors"
                >
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-400 hover:text-[var(--liquid-chrome)] transition-colors"
                >
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-400 hover:text-[var(--liquid-chrome)] transition-colors"
                >
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link 
                  to="/kvkk" 
                  className="text-gray-400 hover:text-[var(--liquid-chrome)] transition-colors"
                >
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link 
                  to="/mesafeli-satis" 
                  className="text-gray-400 hover:text-[var(--liquid-chrome)] transition-colors"
                >
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h4 className="font-semibold text-white mb-3">İletişim</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>E-posta: adistoww@gmail.com</li>
              <li>Telefon: +90 543 926 96 70</li>
              <li>Adres: Maslak, İstanbul</li>
              <li>Destek: Pazartesi-Cuma 09:00-18:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-400 mb-3">Güvenli Ödeme Altyapısı</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <img 
                src="/iyzico-logo.svg" 
                alt="iyzico ile Öde" 
                className="h-8 opacity-80 hover:opacity-100 transition-opacity"
              />
              <div className="flex gap-2">
                <div className="bg-white px-3 py-2 rounded">
                  <span className="text-blue-600 font-bold text-sm">VISA</span>
                </div>
                <div className="bg-white px-3 py-2 rounded">
                  <span className="text-red-600 font-bold text-sm">MasterCard</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-gray-400">
            <p>© {currentYear} Devuran. Tüm hakları saklıdır.</p>
            <p className="mt-2 text-xs">
              Ödeme güvenliği{' '}
              <a 
                href="https://www.iyzico.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--liquid-chrome)] hover:underline"
              >
                iyzico
              </a>
              {' '}tarafından sağlanmaktadır. SSL güvenli bağlantı.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
