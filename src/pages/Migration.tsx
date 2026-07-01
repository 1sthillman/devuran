import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storageService } from '@/services/storageService';
import { motion } from 'framer-motion';
import { Play, Square, Trash2, AlertCircle, CheckCircle, Clock, TrendingDown } from 'lucide-react';

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  savedBytes: number;
  currentItem: string;
}

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export function Migration() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<MigrationStats>({
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    savedBytes: 0,
    currentItem: '',
  });

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      time: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setLogs((prev) => [...prev, entry]);
  };

  const isBase64 = (str: string): boolean => {
    return typeof str === 'string' && str.startsWith('data:image/');
  };

  const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const migrateSalons = async () => {
    addLog('📦 SALON GÖRSELLERİ MİGRATE EDİLİYOR...', 'info');
    const snapshot = await getDocs(collection(db, 'salons'));

    for (const salonDoc of snapshot.docs) {
      if (!isRunning) break;

      const salon = salonDoc.data();
      const salonId = salonDoc.id;
      const updates: any = {};
      let hasUpdates = false;

      setStats((prev) => ({ ...prev, currentItem: `Salon: ${salon.name || salonId}` }));
      addLog(`🏢 ${salon.name || salonId}`, 'info');

      // Logo
      if (salon.logo && isBase64(salon.logo)) {
        try {
          addLog('  📸 Logo migrate ediliyor...', 'info');
          const file = await base64ToFile(salon.logo, 'logo.jpg');
          const originalSize = file.size;

          const result = await storageService.uploadFile(file, {
            folder: `salons/${salonId}/logo`,
            compress: true,
          });

          updates.logo = result.url;
          hasUpdates = true;
          
          setStats((prev) => ({
            ...prev,
            migrated: prev.migrated + 1,
            savedBytes: prev.savedBytes + (originalSize - result.size),
          }));

          addLog(`    ✅ Logo: ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`, 'success');
        } catch (error: any) {
          addLog(`    ❌ Logo failed: ${error.message}`, 'error');
          setStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }
      }

      // Cover Image
      if (salon.coverImage && isBase64(salon.coverImage)) {
        try {
          addLog('  📸 Kapak görseli migrate ediliyor...', 'info');
          const file = await base64ToFile(salon.coverImage, 'cover.jpg');
          const originalSize = file.size;

          const result = await storageService.uploadFile(file, {
            folder: `salons/${salonId}/cover`,
            compress: true,
          });

          updates.coverImage = result.url;
          hasUpdates = true;

          setStats((prev) => ({
            ...prev,
            migrated: prev.migrated + 1,
            savedBytes: prev.savedBytes + (originalSize - result.size),
          }));

          addLog(`    ✅ Kapak: ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`, 'success');
        } catch (error: any) {
          addLog(`    ❌ Kapak failed: ${error.message}`, 'error');
          setStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }
      }

      // Gallery Images
      if (salon.galleryImages && Array.isArray(salon.galleryImages)) {
        const migratedGallery: string[] = [];

        for (let i = 0; i < salon.galleryImages.length; i++) {
          const img = salon.galleryImages[i];

          if (isBase64(img)) {
            try {
              addLog(`  📸 Galeri ${i + 1}/${salon.galleryImages.length} migrate ediliyor...`, 'info');
              const file = await base64ToFile(img, `gallery-${i + 1}.jpg`);
              const originalSize = file.size;

              const result = await storageService.uploadFile(file, {
                folder: `salons/${salonId}/gallery`,
                compress: true,
              });

              migratedGallery.push(result.url);

              setStats((prev) => ({
                ...prev,
                migrated: prev.migrated + 1,
                savedBytes: prev.savedBytes + (originalSize - result.size),
              }));

              addLog(`    ✅ Galeri ${i + 1}: ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`, 'success');
            } catch (error: any) {
              addLog(`    ❌ Galeri ${i + 1} failed: ${error.message}`, 'error');
              migratedGallery.push(img);
              setStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
            }
          } else {
            migratedGallery.push(img);
          }
        }

        if (migratedGallery.length > 0) {
          updates.galleryImages = migratedGallery;
          hasUpdates = true;
        }
      }

      // Update document
      if (hasUpdates) {
        await updateDoc(doc(db, 'salons', salonId), updates);
        addLog(`  ✅ Salon güncellendi`, 'success');
      } else {
        setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
        addLog(`  ⏭️ Atlandı (base64 yok)`, 'warning');
      }

      setStats((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const migrateMenuItems = async () => {
    addLog('\n🍔 MENÜ ÜRÜN GÖRSELLERİ MİGRATE EDİLİYOR...', 'info');
    const snapshot = await getDocs(collection(db, 'menuItems'));

    for (const itemDoc of snapshot.docs) {
      if (!isRunning) break;

      const item = itemDoc.data();
      const itemId = itemDoc.id;
      const salonId = item.salonId || item.restaurantId || 'unknown';

      setStats((prev) => ({ ...prev, currentItem: `Menu: ${item.name || itemId}` }));

      if (item.image && isBase64(item.image)) {
        try {
          addLog(`🍽️ ${item.name || itemId} (Salon: ${salonId})`, 'info');
          const file = await base64ToFile(item.image, `${itemId}.jpg`);
          const originalSize = file.size;

          const result = await storageService.uploadFile(file, {
            folder: `menu-items/${salonId}`,
            compress: true,
          });

          await updateDoc(doc(db, 'menuItems', itemId), { image: result.url });

          setStats((prev) => ({
            ...prev,
            migrated: prev.migrated + 1,
            savedBytes: prev.savedBytes + (originalSize - result.size),
          }));

          addLog(`  ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`, 'success');
        } catch (error: any) {
          addLog(`  ❌ Failed: ${error.message}`, 'error');
          setStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }
      } else {
        setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
      }

      setStats((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const migrateStaff = async () => {
    addLog('\n👤 PERSONEL FOTOĞRAFLARI MİGRATE EDİLİYOR...', 'info');
    const snapshot = await getDocs(collection(db, 'staff'));

    for (const staffDoc of snapshot.docs) {
      if (!isRunning) break;

      const staff = staffDoc.data();
      const staffId = staffDoc.id;
      const salonId = staff.salonId || 'unknown';

      setStats((prev) => ({ ...prev, currentItem: `Staff: ${staff.name || staffId}` }));

      if (staff.photo && isBase64(staff.photo)) {
        try {
          addLog(`👨‍💼 ${staff.name || staffId} (Salon: ${salonId})`, 'info');
          const file = await base64ToFile(staff.photo, `${staffId}.jpg`);
          const originalSize = file.size;

          const result = await storageService.uploadFile(file, {
            folder: `staff/${salonId}`,
            compress: true,
          });

          await updateDoc(doc(db, 'staff', staffId), { photo: result.url });

          setStats((prev) => ({
            ...prev,
            migrated: prev.migrated + 1,
            savedBytes: prev.savedBytes + (originalSize - result.size),
          }));

          addLog(`  ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`, 'success');
        } catch (error: any) {
          addLog(`  ❌ Failed: ${error.message}`, 'error');
          setStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }
      } else {
        setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
      }

      setStats((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const migrateServices = async () => {
    addLog('\n✂️ HİZMET GÖRSELLERİ MİGRATE EDİLİYOR...', 'info');
    const snapshot = await getDocs(collection(db, 'services'));

    for (const serviceDoc of snapshot.docs) {
      if (!isRunning) break;

      const service = serviceDoc.data();
      const serviceId = serviceDoc.id;
      const salonId = service.salonId || 'unknown';

      setStats((prev) => ({ ...prev, currentItem: `Service: ${service.name || serviceId}` }));

      if (service.image && isBase64(service.image)) {
        try {
          addLog(`✂️ ${service.name || serviceId} (Salon: ${salonId})`, 'info');
          const file = await base64ToFile(service.image, `${serviceId}.jpg`);
          const originalSize = file.size;

          const result = await storageService.uploadFile(file, {
            folder: `services/${salonId}`,
            compress: true,
          });

          await updateDoc(doc(db, 'services', serviceId), { image: result.url });

          setStats((prev) => ({
            ...prev,
            migrated: prev.migrated + 1,
            savedBytes: prev.savedBytes + (originalSize - result.size),
          }));

          addLog(`  ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`, 'success');
        } catch (error: any) {
          addLog(`  ❌ Failed: ${error.message}`, 'error');
          setStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }
      } else {
        setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
      }

      setStats((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const startMigration = async () => {
    setIsRunning(true);
    setStats({ total: 0, migrated: 0, skipped: 0, failed: 0, savedBytes: 0, currentItem: '' });
    setLogs([]);

    addLog('🚀 CLOUDFLARE R2 MIGRATION BAŞLIYOR...', 'info');
    addLog('🔒 Salon isolation aktif - Her işletme izole klasörlerde', 'info');

    const startTime = Date.now();

    try {
      await migrateSalons();
      await migrateMenuItems();
      await migrateStaff();
      await migrateServices();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      addLog('\n✅ MİGRATION TAMAMLANDI!', 'success');
      addLog(`⏱️ Süre: ${duration} saniye`, 'info');
      addLog(`💾 Tasarruf: ${(stats.savedBytes / 1024 / 1024).toFixed(2)} MB`, 'success');
    } catch (error: any) {
      addLog(`❌ HATA: ${error.message}`, 'error');
    }

    setIsRunning(false);
    setStats((prev) => ({ ...prev, currentItem: '' }));
  };

  const stopMigration = () => {
    setIsRunning(false);
    addLog('⏹️ Migration durduruldu', 'warning');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            🚀 Firestore → Cloudflare R2 Migration
          </h1>
          <p className="text-gray-300">Tüm base64 görselleri R2'ye taşıyın</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-300">Toplam</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-300">Migrate</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.migrated}</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-300">Atlandı</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{stats.skipped}</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-gray-300">Hata</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-gray-300">Tasarruf</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {(stats.savedBytes / 1024 / 1024).toFixed(2)} MB
            </div>
          </motion.div>
        </div>

        {/* Current Item */}
        {stats.currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-white font-medium">{stats.currentItem}</span>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={startMigration}
            disabled={isRunning}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Play className="w-5 h-5" />
            Migration Başlat
          </button>

          <button
            onClick={stopMigration}
            disabled={!isRunning}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Square className="w-5 h-5" />
            Durdur
          </button>

          <button
            onClick={() => setLogs([])}
            className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-4">📜 Migration Log</h3>
          <div className="h-96 overflow-y-auto space-y-1 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-400">Migration hazır. Başlatmak için butona tıklayın...</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`
                    ${log.type === 'success' ? 'text-green-400' : ''}
                    ${log.type === 'error' ? 'text-red-400' : ''}
                    ${log.type === 'warning' ? 'text-yellow-400' : ''}
                    ${log.type === 'info' ? 'text-blue-400' : ''}
                  `}
                >
                  [{log.time}] {log.message}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
