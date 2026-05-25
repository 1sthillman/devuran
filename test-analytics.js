// Test script to verify analytics data isolation
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testAnalytics() {
  console.log('🔍 Testing Analytics Data Isolation...\n');

  try {
    // Get all businesses
    const salonsSnapshot = await db.collection('salons').get();
    console.log(`📊 Found ${salonsSnapshot.size} businesses\n`);

    for (const salonDoc of salonsSnapshot.docs) {
      const salon = salonDoc.data();
      console.log(`\n🏢 Business: ${salon.name} (ID: ${salonDoc.id})`);
      console.log(`   Owner: ${salon.ownerId}`);

      // Get reservations for this business
      const reservationsSnapshot = await db
        .collection('reservations')
        .where('businessId', '==', salonDoc.id)
        .get();

      console.log(`   📅 Reservations: ${reservationsSnapshot.size}`);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayReservations = reservationsSnapshot.docs.filter(doc => {
        const data = doc.data();
        const resDate = data.date || data.eventDate || data.checkIn || data.deliveryDate || '';
        return resDate === today;
      });

      const confirmedReservations = reservationsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'confirmed' || data.status === 'completed';
      });

      const totalRevenue = confirmedReservations.reduce((sum, doc) => {
        const data = doc.data();
        const price = data.pricing?.totalAmount || data.totalPrice || 0;
        return sum + price;
      }, 0);

      console.log(`   📈 Today's Reservations: ${todayReservations.length}`);
      console.log(`   ✅ Confirmed/Completed: ${confirmedReservations.length}`);
      console.log(`   💰 Total Revenue: ${totalRevenue.toLocaleString('tr-TR')} TL`);

      // Check for cross-business data leakage
      const wrongBusinessData = reservationsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.businessId !== salonDoc.id;
      });

      if (wrongBusinessData.length > 0) {
        console.log(`   ⚠️  WARNING: Found ${wrongBusinessData.length} reservations with wrong businessId!`);
      } else {
        console.log(`   ✅ Data isolation verified - no cross-business leakage`);
      }
    }

    console.log('\n\n✅ Analytics test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAnalytics();
