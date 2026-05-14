import { create } from 'zustand';
import { authService, type UserProfile } from '@/services/authService';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, role: 'customer' | 'owner') => Promise<boolean>;
  googleSignIn: () => Promise<{ success: boolean; needsOnboarding?: boolean; user?: any; pending?: boolean }>;
  completeOnboarding: (phone: string, role: 'customer' | 'owner') => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initAuth: () => void;
  clearError: () => void;
}

const mapProfileToUser = (profile: UserProfile): User => ({
  uid: profile.uid,
  displayName: profile.displayName,
  email: profile.email,
  role: profile.role,
  salonId: profile.salonId,
  photoURL: profile.photoURL,
  phone: profile.phone || '',
  onboardingCompleted: profile.onboardingCompleted ?? true,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isOwner: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const { profile } = await authService.login(email, password);
      if (!profile) throw new Error('Login failed');
      const user = mapProfileToUser(profile);
      set({ 
        user, 
        isAuthenticated: true, 
        isOwner: user.role === 'owner' || user.role === 'admin',
        isLoading: false 
      });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  register: async (name: string, email: string, password: string, phone: string, role: 'customer' | 'owner' = 'customer') => {
    try {
      set({ isLoading: true, error: null });
      const { profile } = await authService.register(email, password, name, role, phone);
      const user = mapProfileToUser(profile);
      set({ 
        user, 
        isAuthenticated: true, 
        isOwner: role === 'owner',
        isLoading: false 
      });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  googleSignIn: async () => {
    try {
      set({ isLoading: true, error: null });
      const result = await authService.loginWithGoogle();
      
      // If pending (redirect on mobile), don't change loading state
      if (result.pending) {
        // Keep loading true, redirect is happening
        return { success: true, pending: true };
      }
      
      const { profile, isNewUser } = result;
      
      // Check if user needs onboarding (no phone number)
      if (isNewUser || !profile.phone || !profile.onboardingCompleted) {
        set({ isLoading: false });
        return { 
          success: true, 
          needsOnboarding: true, 
          user: profile 
        };
      }
      
      const user = mapProfileToUser(profile);
      set({ 
        user, 
        isAuthenticated: true, 
        isOwner: user.role === 'owner' || user.role === 'admin',
        isLoading: false 
      });
      return { success: true, needsOnboarding: false };
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return { success: false };
    }
  },

  completeOnboarding: async (phone: string, role: 'customer' | 'owner') => {
    try {
      set({ isLoading: true, error: null });
      const currentFirebaseUser = authService.getCurrentUser();
      if (!currentFirebaseUser) throw new Error('No user logged in');

      await authService.updateUserProfile(currentFirebaseUser.uid, { 
        phone, 
        role,
        onboardingCompleted: true 
      });

      const profile = await authService.getUserProfile(currentFirebaseUser.uid);
      if (!profile) throw new Error('Failed to fetch profile');

      const user = mapProfileToUser(profile);
      set({ 
        user, 
        isAuthenticated: true, 
        isOwner: role === 'owner',
        isLoading: false 
      });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
      set({ user: null, isAuthenticated: false, isOwner: false, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');

      set({ isLoading: true, error: null });
      
      const profileUpdates: Partial<UserProfile> = {
        displayName: updates.displayName,
        phone: updates.phone,
        photoURL: updates.photoURL,
      };

      await authService.updateUserProfile(currentUser.uid, profileUpdates);
      
      set({ 
        user: { ...currentUser, ...updates },
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      set({ isLoading: true, error: null });
      await authService.resetPassword(email);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  initAuth: async () => {
    try {
      set({ isLoading: true });
      
      // Check for redirect result first (mobile Google login)
      const redirectResult = await authService.checkRedirectResult();
      
      if (redirectResult) {
        const { profile, isNewUser } = redirectResult;
        
        // Check if needs onboarding
        if (isNewUser || !profile.phone || !profile.onboardingCompleted) {
          set({ isLoading: false });
          return;
        }
        
        const user = mapProfileToUser(profile);
        set({ 
          user, 
          isAuthenticated: true, 
          isOwner: user.role === 'owner' || user.role === 'admin',
          isLoading: false 
        });
        return;
      }
    } catch (error) {
      console.error('Redirect result error:', error);
      set({ error: 'Google giriş hatası' });
    }

    // Set up auth state listener for persistent login
    const unsubscribe = authService.onAuthStateChange((firebaseUser, profile) => {
      if (firebaseUser && profile) {
        const user = mapProfileToUser(profile);
        set({ 
          user, 
          isAuthenticated: true, 
          isOwner: user.role === 'owner' || user.role === 'admin',
          isLoading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isOwner: false,
          isLoading: false 
        });
      }
    });

    // Store unsubscribe function for cleanup
    return unsubscribe;
  },

  clearError: () => set({ error: null }),
}));
