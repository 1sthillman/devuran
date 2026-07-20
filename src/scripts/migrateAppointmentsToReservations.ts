/**
 * 🔄 APPOINTMENTS → RESERVATIONS MIGRATION SCRIPT
 * 
 * Bu script eski 'appointments' koleksiyonundaki verileri
 * yeni 'reservations' koleksiyonuna taşır.
 * 
 * ⚠️ UYARI: Production'da çalıştırmadan önce backup alın!
 * 
 * Kullanım:
 * npm run migrate:appointments
 * 
 * @date 2026-07-20
 */

import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';

interface AppointmentData {
  id: string;
  salonId: string;
  userId: string;
  date: string;
  startTime: string;
  status: string;
  [key: string]: any;
}

async function migrateAppointmentsToReservations() {
  console.log('🔄 Migration başlıyor...');
  console.log('📋 Appointments koleksiyonu okunuyor...');

  try {
    // 1. Tüm appointments'ları oku
    const appointmentsRef = collection(db, 'appointments');
    const snapshot = await getDocs(appointmentsRef);
    
    if (snapshot.empty) {
      console.log('✅ Appointments koleksiyonu boş - migration gerekmiyor');
      return;
    }

    console.log(`📊 ${snapshot.size} adet appointment bulundu`);

    // 2. Rezervasyonları grupla (batch işlem için)
    const batches: any[][] = [];
    let currentBatch: any[] = [];
    
    snapshot.forEach((docSnap) => {
      const appointment = { id: docSnap.id, ...docSnap.data() } as AppointmentData;
      
      // Reservations formatına dönüştür
      const reservation = {
        ...appointment,
        type: 'slot', // Appointments hep slot bazlıdır
        businessId: appointment.salonId, // businessId'ye dönüştür
        createdAt: appointment.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _migratedFrom: 'appointments', // Migration tracking
        _migrationDate: new Date().toISOString()
      };

      currentBatch.push(reservation);

      // Firestore batch limiti: 500
      if (currentBatch.length === 500) {
        batches.push([...currentBatch]);
        currentBatch = [];
      }
    });

    // Son batch'i ekle
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    console.log(`📦 ${batches.length} batch işlem hazırlandı`);

    // 3. Batch write işlemleri
    let migratedCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = writeBatch(db);
      const batchData = batches[i];

      console.log(`⏳ Batch ${i + 1}/${batches.length} işleniyor...`);

      batchData.forEach((reservation) => {
        const reservationRef = doc(db, 'reservations', reservation.id);
        batch.set(reservationRef, reservation, { merge: true });
      });

      await batch.commit();
      migratedCount += batchData.length;
      
      console.log(`✅ Batch ${i + 1} tamamlandı (${migratedCount}/${snapshot.size})`);
    }

    console.log('');
    console.log('✅ MIGRATION TAMAMLANDI!');
    console.log(`📊 Toplam ${migratedCount} appointment → reservation'a dönüştürüldü`);
    console.log('');
    console.log('⚠️ SONRAKİ ADIMLAR:');
    console.log('1. Reservations koleksiyonunu kontrol edin');
    console.log('2. OwnerDashboard ve firebaseService kodlarını güncelleyin');
    console.log('3. Appointments koleksiyonunu arşivleyin (silmeyin henüz!)');
    console.log('4. Test tamamlandıktan sonra appointments koleksiyonunu silin');

  } catch (error) {
    console.error('❌ Migration hatası:', error);
    throw error;
  }
}

// Script çalıştır
migrateAppointmentsToReservations()
  .then(() => {
    console.log('✅ Script tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script başarısız:', error);
    process.exit(1);
  });
