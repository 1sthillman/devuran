// Check real data in Firestore
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkData() {
  console.log('🔍 Checking Real Data in Firestore...\n');

  try {
    // Get STHILLMAN business
    const salonsSnapshot = await db.collection('salons')
      .where('name', '==', 'STHILLMAN')
      .get();

    if (salonsSnapshot.empty) {
      console.log('❌ STHILLMAN business not found!');
      console.log('\n📋 All businesses:');
      const allSalons = await db.collection('salons').get();
      allSalons.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.name} (ID: ${doc.id})`);
      });
      process.exit(1);
    }

    const salonDoc = salonsSnapshot.docs[0];
    const salon = salonDoc.data();
    const businessId = salonDoc.id;

    console.log(`✅ Found Business: ${salon.name}`);
    console.log(`   ID: ${businessId}`);
    console.log(`   Owner: ${salon.ownerId}\n`);

    // Get reservations
    console.log('📅 Checking Reservations Collection:');
    const reservationsSnapshot = await db.collection('reservations')
      .where('businessId', '==', businessId)
      .get();

    console.log(`   Total: ${reservationsSnapshot.size} reservations\n`);

    if (reservationsSnapshot.size === 0) {
      console.log('⚠️  No reservations found for this business!');
      console.log('\n🔍 Checking all reservations in database:');
      const allReservations = await db.collection('reservations').limit(10).get();
      console.log(`   Total reservations in DB: ${allReservations.size}`);
      
      allReservations.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   Reservation ${index + 1}:`);
        console.log(`     ID: ${doc.id}`);
        console.log(`     businessId: ${data.businessId}`);
        console.log(`     businessName: ${data.businessName}`);
        console.log(`     status: ${data.status}`);
        console.log(`     date: ${data.date || data.eventDate || data.checkIn || 'N/A'}`);
      });
    } else {
      // Analyze reservations
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7);

      let todayCount = 0;
      let weekCount = 0;
      let monthRevenue = 0;
      let totalRevenue = 0;

      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);

      console.log('📊 Reservation Details:\n');

      reservationsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const resDate = data.date || data.eventDate || data.checkIn || data.deliveryDate || '';
        const price = data.pricing?.totalAmount || data.totalPrice || 0;
        
        console.log(`   ${index + 1}. ${data.userName || 'Unknown'}`);
        console.log(`      Date: ${resDate}`);
        console.log(`      Status: ${data.status}`);
        console.log(`      Price: ${price} TL`);
        console.log(`      Services: ${data.services?.map(s => s.name).join(', ') || 'N/A'}`);

        // Count today
        if (resDate === today && (data.status === 'confirmed' || data.status === 'pending')) {
          todayCount++;
        }

        // Count week
        if (resDate) {
          const appDate = new Date(resDate);
          if (appDate >= weekStart && appDate <= weekEnd && 
              (data.status === 'confirmed' || data.status === 'pending')) {
            weekCount++;
          }
        }

        // Calculate month revenue
        if (resDate.startsWith(currentMonth) && 
            (data.status === 'completed' || data.status === 'confirmed')) {
          monthRevenue += price;
        }

        // Total revenue
        if (data.status === 'completed' || data.status === 'confirmed') {
          totalRevenue += price;
        }

        console.log('');
      });

      console.log('\n📈 Statistics:');
      console.log(`   Today's Reservations: ${todayCount}`);
      console.log(`   This Week: ${weekCount}`);
      console.log(`   This Month Revenue: ${monthRevenue.toLocaleString('tr-TR')} TL`);
      console.log(`   Total Revenue: ${totalRevenue.toLocaleString('tr-TR')} TL`);
    }

    // Check appointments collection (old system)
    console.log('\n\n📅 Checking Appointments Collection (old):');
    const appointmentsSnapshot = await db.collection('appointments')
      .where('salonId', '==', businessId)
      .get();
    console.log(`   Total: ${appointmentsSnapshot.size} appointments`);

    if (appointmentsSnapshot.size > 0) {
      console.log('   ⚠️  Old appointments collection still has data!');
    }

    console.log('\n✅ Data check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
