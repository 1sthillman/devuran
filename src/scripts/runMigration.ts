/**
 * Migration Runner Script
 * Node.js compatible version
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Set required env vars for Firebase
process.env.VITE_FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;
process.env.VITE_FIREBASE_AUTH_DOMAIN = process.env.VITE_FIREBASE_AUTH_DOMAIN;
process.env.VITE_FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
process.env.VITE_FIREBASE_STORAGE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET;
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
process.env.VITE_FIREBASE_APP_ID = process.env.VITE_FIREBASE_APP_ID;

// Now import and run migration
import('./migrateImagesToR2.js').then(async (module) => {
  console.log('🔄 Starting migration...\n');
  const result = await module.runMigration();
  
  if (result.success) {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } else {
    console.error('\n❌ Migration failed:', result.error);
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Failed to load migration module:', error);
  process.exit(1);
});
