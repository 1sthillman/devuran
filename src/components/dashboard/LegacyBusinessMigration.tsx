/**
 * ============================================================================
 * ESKİ İŞLETMELERİ YENİ SİSTEME GEÇİŞ ARACI
 * ============================================================================
 * 
 * Capabilities olmayan eski işletmeleri otomatik günceller
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';
import { migrateToCapabilities } from '@/utils/capabilitiesUpdater';
import { validateSalon } from '@/utils/businessSetupValidator';
import { salonsService, servicesService } from '@/services/firebaseService';
import type { Salon } from '@/types';

interface Props {
  salon: Salon;
  onMigrationComplete: () => void;
}

export function LegacyBusinessMigration({ salon, onMigrationComplete }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleMigrate = async () => {
    setIsMigrating(true);
    setErrorMessage('');
    
    try {
      // Eski salonu yeni sisteme geçir (eksik alanları otomatik doldurur)
      const migratedSalon = migrateToCapabilities(salon);
      
      // Validasyon yap
      const validation = validateSalon(migratedSalon);
      
      if (!validation.isValid) {
        console.error('Migration validation failed:', validation.errors);
        const errorMsg = validation.errors.join(', ');
        setErrorMessage(errorMsg);
        throw new Error(`Validasyon hatası: ${errorMsg}`);
      }

      // ✅ HİZMETLERİ MİGRATE ET (salon.services array -> services collection)
      const anySalon = salon as any;
      let servicesMigrated = 0;
      
      if (anySalon.services && Array.isArray(anySalon.services) && anySalon.services.length > 0) {
        console.log(`📦 ${anySalon.services.length} hizmet services collection'a taşınıyor...`);
        
        // Önce services collection'da zaten varlar mı kontrol et
        const existingServices = await servicesService.getBySalon(salon.id);
        const existingIds = new Set(existingServices.map(s => s.id));
        
        for (const service of anySalon.services) {
          // Eğer bu hizmet zaten collection'da varsa atla
          if (existingIds.has(service.id)) {
            console.log(`⏭️ Hizmet zaten var, atlanıyor: ${service.name}`);
            continue;
          }
          
          try {
            // Service'i collection'a ekle
            await servicesService.create({
              ...service,
              salonId: salon.id,
              isActive: service.isActive !== false // Default true
            });
            servicesMigrated++;
            console.log(`✅ Hizmet taşındı: ${service.name}`);
          } catch (serviceError) {
            console.error(`❌ Hizmet taşınırken hata (${service.name}):`, serviceError);
            // Tek bir hizmetin hatası tüm migration'ı durdurmasın
          }
        }
        
        console.log(`✅ Toplam ${servicesMigrated} hizmet başarıyla taşındı`);
      }

      // Firebase'e kaydet - hem capabilities hem de eksik alanları güncelle
      await salonsService.update(salon.id, {
        capabilities: migratedSalon.capabilities,
        description: migratedSalon.description,
        phone: migratedSalon.phone,
        address: migratedSalon.address,
        workingHours: migratedSalon.workingHours
      });

      setMigrationResult('success');
      
      // 2 saniye sonra modal'ı kapat ve sayfayı yenile
      setTimeout(() => {
        setIsOpen(false);
        onMigrationComplete();
      }, 2000);
      
    } catch (error: any) {
      console.error('Migration error:', error);
      setMigrationResult('error');
      if (!errorMessage) {
        setErrorMessage(error?.message || 'Bilinmeyen bir hata oluştu');
      }
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    // Session'da "skip" işaretle (bugün tekrar gösterme)
    sessionStorage.setItem(`migration_skipped_${salon.id}`, Date.now().toString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Yeni Sistem</h2>
            </div>
            <p className="text-white/90 text-sm">
              İşletmeniz eski sistemi kullanıyor
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {migrationResult === 'success' ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Başarılı! 🎉
                </h3>
                <p className="text-gray-600">
                  İşletmeniz yeni sisteme geçirildi
                </p>
              </motion.div>
            ) : migrationResult === 'error' ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Hata Oluştu
                </h3>
                <p className="text-gray-600 mb-2">
                  Geçiş sırasında bir sorun oluştu
                </p>
                {errorMessage && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">
                    {errorMessage}
                  </p>
                )}
                <button
                  onClick={handleMigrate}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Akıllı Özellikler</p>
                      <p className="text-sm text-gray-600">
                        İşletmeniz otomatik olarak tüm yeni özelliklere kavuşacak
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Gelişmiş Panel</p>
                      <p className="text-sm text-gray-600">
                        Dashboard'unuz işletmenize özel olarak optimize edilecek
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Hizmetleriniz Korunuyor</p>
                      <p className="text-sm text-gray-600">
                        Tüm hizmet, masa ve ürünleriniz otomatik taşınacak
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-600">
                    ⚡ Bu işlem birkaç saniye sürer ve tamamen otomatiktir.
                    Hiçbir şey yapmanıza gerek yok.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    disabled={isMigrating}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    Daha Sonra
                  </button>
                  <button
                    onClick={handleMigrate}
                    disabled={isMigrating}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Geçiriliyor...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Yeni Sisteme Geç
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
