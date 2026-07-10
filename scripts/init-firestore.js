/**
 * Initialize Firestore with Sample Data
 * 
 * Creates initial collections and sample documents for testing.
 * Run: node scripts/init-firestore.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(process.cwd(), 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initFirestore() {
  console.log('🔥 Initializing Firestore...\n');

  try {
    // Create sample user
    console.log('👤 Creating sample user...');
    await db.collection('users').doc('sample-user-id').set({
      email: 'owner@example.com',
      displayName: 'Sample Business Owner',
      businessId: 'sample-business-id',
      roles: ['business_owner'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Sample user created\n');

    // Create sample business
    console.log('🏢 Creating sample business...');
    await db.collection('businesses').doc('sample-business-id').set({
      name: 'Sample Coffee Shop',
      description: 'A cozy coffee shop in the heart of the city',
      address: {
        street: 'Main Street 123',
        city: 'Istanbul',
        postalCode: '34000',
        country: 'TR',
      },
      phone: '+905551234567',
      email: 'info@samplecoffee.com',
      workingHours: [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isOpen: true },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '20:00', isOpen: true },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '20:00', isOpen: true },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '20:00', isOpen: true },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '22:00', isOpen: true },
        { dayOfWeek: 0, openTime: '10:00', closeTime: '18:00', isOpen: true },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Sample business created\n');

    // Create sample services
    console.log('☕ Creating sample services...');
    const services = [
      {
        businessId: 'sample-business-id',
        name: 'Espresso',
        description: 'Classic Italian espresso',
        duration: 15,
        price: 25,
        currency: 'TRY',
        category: 'coffee',
        isActive: true,
      },
      {
        businessId: 'sample-business-id',
        name: 'Cappuccino',
        description: 'Creamy cappuccino with milk foam',
        duration: 15,
        price: 35,
        currency: 'TRY',
        category: 'coffee',
        isActive: true,
      },
      {
        businessId: 'sample-business-id',
        name: 'Latte Art Workshop',
        description: '30-minute latte art training session',
        duration: 30,
        price: 150,
        currency: 'TRY',
        category: 'workshop',
        isActive: true,
      },
    ];

    for (const service of services) {
      await db.collection('services').add({
        ...service,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log('✅ Sample services created\n');

    // Create sample staff
    console.log('👨‍💼 Creating sample staff...');
    await db.collection('staff').add({
      businessId: 'sample-business-id',
      name: 'Barista John',
      email: 'john@samplecoffee.com',
      isActive: true,
      workingHours: [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '16:00' },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '16:00' },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '16:00' },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '16:00' },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '16:00' },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Sample staff created\n');

    // Create sample subscription
    console.log('💳 Creating sample subscription...');
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 14); // 14-day trial

    await db.collection('subscriptions').doc('sample-business-id').set({
      businessId: 'sample-business-id',
      packageName: 'Google Görünürlük (Deneme)',
      tier: 'stage1',
      status: 'trial',
      startDate: admin.firestore.Timestamp.fromDate(now),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      autoRenew: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Sample subscription created\n');

    console.log('🎉 Firestore initialization complete!\n');
    console.log('Sample credentials:');
    console.log('  Email: owner@example.com');
    console.log('  Business ID: sample-business-id');
    console.log('  User ID: sample-user-id');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create this user in Firebase Auth');
    console.log('2. Login with the user');
    console.log('3. Navigate to /integrations/google-maps');
    console.log('');

  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    process.exit(1);
  }

  process.exit(0);
}

initFirestore();
