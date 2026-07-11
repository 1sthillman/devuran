/**
 * ============================================================================
 * AKILLI ÖNERİ SİSTEMİ
 * ============================================================================
 * 
 * Kullanıcının seçimlerine göre akıllı öneriler sunar
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import type { BusinessSetupAnswer } from '@/types/businessSetup';

interface Recommendation {
  type: 'tip' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  actionable?: string;
}

interface Props {
  answers: BusinessSetupAnswer[];
  capabilities?: BusinessCapabilities;
  currentStep: number;
}

export function SmartRecommendations({ answers, capabilities, currentStep }: Props) {
  const recommendations = generateRecommendations(answers, capabilities, currentStep);

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {recommendations.map((rec, index) => (
          <motion.div
            key={`${rec.type}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`p-4 rounded-xl border-2 ${getRecommendationStyles(rec.type)}`}
          >
            <div className="flex items-start gap-3">
              {getRecommendationIcon(rec.type)}
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">
                  {rec.title}
                </p>
                <p className="text-xs opacity-90 leading-relaxed">
                  {rec.message}
                </p>
                {rec.actionable && (
                  <p className="text-xs font-semibold mt-2 opacity-80">
                    💡 {rec.actionable}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Önerileri üret
 */
function generateRecommendations(
  answers: BusinessSetupAnswer[],
  capabilities?: BusinessCapabilities,
  currentStep?: number
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Kategori seçimi
  const categoryType = answers.find(a => a.questionId === 'category_type')?.value;
  const presetCategory = answers.find(a => a.questionId === 'preset_category')?.value;
  const customCategory = answers.find(a => a.questionId === 'custom_category_name')?.value;

  if (currentStep === 2) {
    if (categoryType === 'preset' && presetCategory) {
      recs.push({
        type: 'success',
        title: 'Hızlı Kurulum',
        message: 'Seçtiğiniz kategori için otomatik ayarlar uygulanacak. İlerleyen adımlarda özelleştirebilirsiniz.',
      });
    } else if (categoryType === 'custom') {
      recs.push({
        type: 'tip',
        title: 'Özel Kategori',
        message: 'Kendi kategorinizi oluşturuyorsunuz. Sonraki adımlarda tüm özellikleri manuel olarak seçmeniz gerekecek.',
      });
    }
  }

  // Booking models
  const bookingModels = answers.find(a => a.questionId === 'booking_models')?.value as string[] | undefined;

  if (currentStep === 3 && bookingModels) {
    if (bookingModels.length > 2) {
      recs.push({
        type: 'warning',
        title: 'Çoklu Model Seçimi',
        message: 'Birden fazla rezervasyon modeli seçtiniz. Müşterileriniz rezervasyon yaparken model seçimi yapabilecek.',
      });
    }

    if (bookingModels.includes('appointment') && bookingModels.includes('walk-in-queue')) {
      recs.push({
        type: 'tip',
        title: 'Randevu + Kuyruk',
        message: 'Hem randevulu hem randevusuz müşteri kabul edeceksiniz. Kuyruk yönetimi panelinde aktif olacak.',
        actionable: 'Personel atayarak kuyruktaki müşterileri hızlıca organize edebilirsiniz'
      });
    }

    if (bookingModels.includes('reservation') && !bookingModels.includes('appointment')) {
      recs.push({
        type: 'info',
        title: 'Sadece Rezervasyon',
        message: 'Masa/oda rezervasyon sistemi kullanacaksınız. Sonraki adımda masa/oda tanımlamanız gerekecek.',
      });
    }

    if (bookingModels.includes('order')) {
      recs.push({
        type: 'info',
        title: 'Sipariş Sistemi',
        message: 'Ürün kataloğu ve sipariş yönetimi aktif olacak. Ürünlerinizi panelden ekleyebilirsiniz.',
      });
    }
  }

  // Capabilities bazlı öneriler
  if (capabilities) {
    // Personel + Masa çakışması
    if (capabilities.hasStaff && capabilities.hasTables) {
      recs.push({
        type: 'tip',
        title: 'Hem Personel Hem Masa',
        message: 'Personel ve masa sisteminiz var. Rezervasyonlarda hem personel hem de masa seçimi yapılabilir.',
        actionable: 'Restoran + Özel servis gibi hibrit modeller için idealdir'
      });
    }

    // Mobil + Fiziksel
    if (capabilities.isMobileService && capabilities.hasPhysicalLocation) {
      recs.push({
        type: 'success',
        title: 'Esnek Hizmet',
        message: 'Hem mekanda hem de müşteri adresinde hizmet vereceksiniz. Rezervasyon sırasında konum seçimi aktif olacak.',
      });
    }

    // Tarih aralığı + Kapora
    if (capabilities.isDateRangeBased && capabilities.requiresDeposit) {
      recs.push({
        type: 'info',
        title: 'Uzun Süreli Rezervasyon',
        message: 'Gecelik konaklama/kiralama için kapora sistemi aktif. Ödeme ayarlarından kapora oranını belirleyebilirsiniz.',
      });
    }

    // Otomatik onay uyarısı
    if (!capabilities.autoConfirmDefault) {
      recs.push({
        type: 'warning',
        title: 'Manuel Onay',
        message: 'Rezervasyonları manuel onaylamayı seçtiniz. Her rezervasyon için bildirim alacaksınız.',
        actionable: 'Rezervasyonlar "Beklemede" durumunda başlayacak ve onayınızı bekleyecek'
      });
    }

    // Teslimat sistemi
    if (capabilities.hasDelivery) {
      recs.push({
        type: 'tip',
        title: 'Teslimat Bölgeleri',
        message: 'Teslimat sisteminiz aktif. Panelden teslimat bölgelerinizi ve ücretlerini tanımlayabilirsiniz.',
      });
    }

    // Ürün kataloğu yoksa ama order var
    if (capabilities.bookingModels.includes('order') && !capabilities.hasProductCatalog) {
      recs.push({
        type: 'warning',
        title: 'Ürün Kataloğu Eksik',
        message: 'Sipariş modeli seçtiniz ama ürün kataloğu pasif. Lütfen önceki adıma dönüp "Ürün Kataloğu" seçeneğini aktif edin.',
      });
    }
  }

  return recs;
}

/**
 * Öneri tipine göre stil
 */
function getRecommendationStyles(type: Recommendation['type']): string {
  switch (type) {
    case 'tip':
      return 'bg-blue-50 border-blue-200 text-blue-900';
    case 'warning':
      return 'bg-amber-50 border-amber-200 text-amber-900';
    case 'success':
      return 'bg-green-50 border-green-200 text-green-900';
    case 'info':
      return 'bg-purple-50 border-purple-200 text-purple-900';
  }
}

/**
 * Öneri tipine göre ikon
 */
function getRecommendationIcon(type: Recommendation['type']) {
  const className = "w-5 h-5 flex-shrink-0 mt-0.5";
  
  switch (type) {
    case 'tip':
      return <Lightbulb className={`${className} text-blue-600`} />;
    case 'warning':
      return <AlertTriangle className={`${className} text-amber-600`} />;
    case 'success':
      return <CheckCircle2 className={`${className} text-green-600`} />;
    case 'info':
      return <Info className={`${className} text-purple-600`} />;
  }
}
