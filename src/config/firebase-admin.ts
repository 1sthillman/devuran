/**
 * Firebase Admin SDK Configuration
 * 
 * This is ONLY for Google Maps Integration backend services
 * Separate from client-side Firebase (src/lib/firebase.ts)
 * 
 * ⚠️ SECURITY: This file should NEVER be imported in frontend code
 * Use environment variables for credentials, never hardcode
 */

import * as admin from 'firebase-admin';

// Singleton instance to prevent multiple initializations
let firebaseAdmin: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK for backend services
 * Uses service account credentials from environment or default credentials
 */
export const initializeFirebaseAdmin = (): admin.app.App => {
  // Return existing instance if already initialized
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Check if Firebase Admin is already initialized (by other code)
    if (admin.apps.length > 0) {
      firebaseAdmin = admin.apps[0]!;
      console.log('✅ Firebase Admin already initialized');
      return firebaseAdmin;
    }

    // Initialize with service account (production) or default credentials (local)
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (serviceAccountPath) {
      // Production: Use service account JSON file
      const serviceAccount = require(serviceAccountPath);
      
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin initialized with service account');
    } else {
      // Development: Use application default credentials
      firebaseAdmin = admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin initialized with default credentials');
    }

    return firebaseAdmin;
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
};

/**
 * Get Firestore instance (backend)
 * Separate from client-side Firestore
 */
export const getAdminFirestore = (): admin.firestore.Firestore => {
  const app = initializeFirebaseAdmin();
  return admin.firestore(app);
};

/**
 * Get Auth instance (backend)
 */
export const getAdminAuth = (): admin.auth.Auth => {
  const app = initializeFirebaseAdmin();
  return admin.auth(app);
};

/**
 * Get Storage instance (backend)
 */
export const getAdminStorage = (): admin.storage.Storage => {
  const app = initializeFirebaseAdmin();
  return admin.storage(app);
};

// Export admin for direct access if needed
export { admin };
