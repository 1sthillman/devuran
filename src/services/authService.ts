import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { recordUserSession } from './sessionService';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: 'customer' | 'owner' | 'admin';
  salonId?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

const googleProvider = new GoogleAuthProvider();

// Detect if device is mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

export const authService = {
  // Register new user
  async register(email: string, password: string, displayName: string, role: 'customer' | 'owner' = 'customer', phone?: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        phone,
        role,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Record session
      await recordUserSession(user.uid, 'email');

      return { user, profile: userProfile };
    } catch (error: any) {
      console.error('Error registering user:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Login with email and password
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user profile from Firestore
      const profile = await this.getUserProfile(user.uid);

      // Record session
      await recordUserSession(user.uid, 'email');

      return { user, profile };
    } catch (error: any) {
      console.error('Error logging in:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Login with Google
  async loginWithGoogle() {
    try {
      // Always use popup for better compatibility
      const result = await signInWithPopup(auth, googleProvider);
      return await this.processGoogleUser(result.user);
    } catch (error: any) {
      console.error('Error logging in with Google:', error);
      
      // If popup blocked, try redirect as fallback
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { pending: true };
        } catch (redirectError: any) {
          console.error('Redirect also failed:', redirectError);
          throw new Error(this.getErrorMessage(redirectError.code));
        }
      }
      
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Process Google user after sign in
  async processGoogleUser(user: FirebaseUser) {
    // Check if user profile exists
    let profile = await this.getUserProfile(user.uid);
    let isNewUser = false;

    // If not, create one
    if (!profile) {
      isNewUser = true;
      profile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || undefined,
        role: 'customer',
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), profile);
    }

    // Record session
    await recordUserSession(user.uid, 'google');

    return { user, profile, isNewUser };
  },

  // Check for redirect result (call on app init)
  async checkRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        return await this.processGoogleUser(result.user);
      }
      return null;
    } catch (error: any) {
      console.error('Error checking redirect result:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>) {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Update Firebase Auth profile if displayName or photoURL changed
      if (auth.currentUser && (updates.displayName || updates.photoURL)) {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Send password reset email
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Auth state observer
  onAuthStateChange(callback: (user: FirebaseUser | null, profile: UserProfile | null) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await this.getUserProfile(user.uid);
        callback(user, profile);
      } else {
        callback(null, null);
      }
    });
  },

  // Export isMobileDevice for use in components
  isMobileDevice,

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Error message helper
  getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda',
      'auth/invalid-email': 'Geçersiz e-posta adresi',
      'auth/operation-not-allowed': 'İşlem izin verilmiyor',
      'auth/weak-password': 'Şifre çok zayıf (en az 6 karakter)',
      'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
      'auth/user-not-found': 'Kullanıcı bulunamadı',
      'auth/wrong-password': 'Hatalı şifre',
      'auth/too-many-requests': 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin',
      'auth/network-request-failed': 'Ağ bağlantısı hatası',
      'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı',
    };

    return errorMessages[errorCode] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  },
};
