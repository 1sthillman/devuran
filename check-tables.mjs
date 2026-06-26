import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config();

initializeApp({
  credential: {
    getAccessToken: () => Promise.resolve({ access_token: '', expires_in: 0 })
  },
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

const db = getFirestore();

console.log('📊 Masaları kontrol ediyorum...\n');

const tables = await db.collection('tables')
  .where('restaurantId', '==', 'nk5O1R45VhqxiB0FZTjr')
  .get();

console.log(`Toplam ${tables.size} masa bulundu:\n`);

tables.forEach(doc => {
  const data = doc.data();
  console.log(`✅ Masa ${data.tableNumber}`);
  console.log(`   QR: ${data.qrCode}`);
  console.log(`   URL: http://localhost:3000/restaurant/nk5O1R45VhqxiB0FZTjr/table/${data.qrCode}`);
  console.log('');
});

process.exit(0);
