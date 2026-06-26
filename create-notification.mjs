// 🔥 TEST BİLDİRİMİ OLUŞTUR - Node.js Script
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

console.log('🔥 ========== TEST BİLDİRİMİ OLUŞTURULUYOR ==========\n');

try {
  // Firebase config
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
  
  console.log('📡 Firebase bağlanılıyor...');
  console.log('Project ID:', firebaseConfig.projectId);
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('✅ Firebase bağlantısı başarılı!\n');
  
  // Bildirim verisi
  const notificationData = {
    restaurantId: "nk5O1R45VhqxiB0FZTjr",
    type: "coal_request",
    message: "Masa TEST - KÖZ İSTİYOR (NPX Script Test)",
    tableId: "KOaUdLOdBopxBgejDN0O",
    tableName: "TEST",
    isRead: false,
    createdAt: serverTimestamp()
  };
  
  console.log('📝 Bildirim verisi:');
  console.log(JSON.stringify(notificationData, null, 2));
  console.log('');
  
  // Firebase'e yaz
  console.log('📤 Firestore\'a yazılıyor...');
  const docRef = await addDoc(collection(db, 'restaurantNotifications'), notificationData);
  
  console.log('\n✅ ========== BAŞARILI! ==========');
  console.log('🆔 Notification ID:', docRef.id);
  console.log('📍 Koleksiyon: restaurantNotifications');
  console.log('📊 Restaurant ID:', notificationData.restaurantId);
  console.log('🪑 Table: ', notificationData.tableName);
  console.log('🔥 Type:', notificationData.type);
  console.log('\n🎯 ŞİMDİ GARSON PANELİNİ KONTROL ET!\n');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ ========== HATA! ==========');
  console.error('Hata Kodu:', error.code || 'N/A');
  console.error('Hata Mesajı:', error.message);
  console.error('\nDetaylar:', error);
  process.exit(1);
}
