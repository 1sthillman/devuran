import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserSession {
  userId: string;
  ipAddress: string;
  deviceId: string;
  userAgent: string;
  timestamp: string;
  loginMethod: 'email' | 'google';
  deviceInfo: {
    platform: string;
    vendor: string;
    language: string;
    screenResolution: string;
  };
}

// Generate unique device ID based on browser fingerprint
function generateDeviceId(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return 'device_' + Math.abs(hash).toString(36);
}

// Get IP address from external service
async function getIPAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP:', error);
    return 'unknown';
  }
}

// Save device ID to localStorage
function saveDeviceIdToLocal(deviceId: string) {
  try {
    localStorage.setItem('deviceId', deviceId);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Get device ID from localStorage or generate new one
function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = generateDeviceId();
      saveDeviceIdToLocal(deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error with localStorage:', error);
    return generateDeviceId();
  }
}

// Check if user or device is banned
export async function checkIfBanned(userId: string, deviceId: string): Promise<boolean> {
  try {
    // Check if user is banned
    const userBanDoc = await getDocs(
      query(collection(db, 'bannedUsers'), where('userId', '==', userId))
    );
    
    if (!userBanDoc.empty) {
      return true;
    }
    
    // Check if device is banned
    const deviceBanDoc = await getDocs(
      query(collection(db, 'bannedUsers'), where('deviceId', '==', deviceId))
    );
    
    if (!deviceBanDoc.empty) {
      return true;
    }
    
    return false;
  } catch (error: any) {
    // Permission errors are expected for non-admin users - silently ignore
    if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
      return false;
    }
    // Only log unexpected errors
    if (import.meta.env.DEV) {
      console.warn('Unexpected ban check error:', error);
    }
    return false;
  }
}

// Record user session
export async function recordUserSession(
  userId: string,
  loginMethod: 'email' | 'google'
): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();
    const ipAddress = await getIPAddress();
    
    // Check if banned
    const isBanned = await checkIfBanned(userId, deviceId);
    if (isBanned) {
      throw new Error('Bu hesap veya cihaz yasaklanmıştır.');
    }
    
    const session: UserSession = {
      userId,
      ipAddress,
      deviceId,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      loginMethod,
      deviceInfo: {
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
      },
    };
    
    // Save to Firestore
    const sessionId = `${userId}_${Date.now()}`;
    await setDoc(doc(db, 'userSessions', sessionId), session);
    
    // Save to localStorage
    try {
      const localSessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
      localSessions.push({
        userId,
        deviceId,
        timestamp: session.timestamp,
        loginMethod,
      });
      // Keep only last 10 sessions
      if (localSessions.length > 10) {
        localSessions.shift();
      }
      localStorage.setItem('userSessions', JSON.stringify(localSessions));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('localStorage save failed:', error);
      }
    }
    
  } catch (error: any) {
    // Permission errors are expected for non-admin users - silently ignore
    if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
      return;
    }
    // Only log unexpected errors
    if (import.meta.env.DEV) {
      console.warn('Unexpected session recording error:', error);
    }
    // Don't throw - allow login to continue
  }
}

// Get device ID (for display purposes)
export function getDeviceId(): string {
  return getOrCreateDeviceId();
}

// Get all sessions from localStorage
export function getLocalSessions(): any[] {
  try {
    return JSON.parse(localStorage.getItem('userSessions') || '[]');
  } catch (error) {
    return [];
  }
}

// Clear local sessions
export function clearLocalSessions(): void {
  try {
    localStorage.removeItem('userSessions');
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}
