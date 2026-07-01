/**
 * Universal Storage Service
 * Supports: Cloudflare R2 (primary), Firebase Storage (fallback), Base64
 * R2-optimized with aggressive compression to stay within free tier
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { r2Storage } from './r2StorageService';
import app from '@/lib/firebase';

const storage = getStorage(app);

export type StorageProvider = 'r2' | 'firebase' | 'base64';

interface UploadOptions {
  folder?: string;
  provider?: StorageProvider;
  filename?: string;
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface UploadResult {
  url: string;
  path: string;
  provider: StorageProvider;
  size: number;
}

class StorageService {
  private defaultProvider: StorageProvider = 'firebase';

  // R2-optimized compression defaults (stay within 10GB free tier)
  private readonly DEFAULT_MAX_WIDTH = 1280;  // Reduced from 1920
  private readonly DEFAULT_MAX_HEIGHT = 720;  // Reduced from 1080
  private readonly DEFAULT_QUALITY = 0.70;    // Reduced from 0.80

  constructor() {
    // Auto-detect best provider
    if (r2Storage.isReady()) {
      this.defaultProvider = 'r2';
      console.log('✅ Using Cloudflare R2 as default storage');
      
      // Test connection
      r2Storage.testConnection().then(success => {
        if (success) {
          console.log('✅ R2 connection verified');
        } else {
          console.warn('⚠️ R2 connection failed, falling back to Firebase');
          this.defaultProvider = 'firebase';
        }
      });
    } else {
      console.log('✅ Using Firebase Storage as default');
    }
  }

  /**
   * Upload file to storage with aggressive compression for R2
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { 
      folder = 'uploads', 
      provider = this.defaultProvider, 
      filename, 
      compress = true,
      maxWidth = this.DEFAULT_MAX_WIDTH,
      maxHeight = this.DEFAULT_MAX_HEIGHT,
      quality = this.DEFAULT_QUALITY
    } = options;

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop();
    const finalFilename = filename || `${timestamp}-${randomStr}.${ext}`;
    const path = `${folder}/${finalFilename}`;

    // Compress if needed (ALWAYS compress for R2 to save space)
    let fileToUpload = file;
    if (compress && this.isImage(file)) {
      console.log(`📦 Compressing image: ${file.size} bytes → target: ${maxWidth}x${maxHeight} @ ${quality * 100}%`);
      fileToUpload = await this.compressImage(file, maxWidth, maxHeight, quality);
      console.log(`✅ Compressed: ${file.size} → ${fileToUpload.size} bytes (${((1 - fileToUpload.size / file.size) * 100).toFixed(1)}% reduction)`);
    }

    switch (provider) {
      case 'r2':
        return this.uploadToR2(fileToUpload, path);
      case 'firebase':
        return this.uploadToFirebase(fileToUpload, path);
      case 'base64':
        return this.convertToBase64(fileToUpload, path);
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  }

  /**
   * Check if file is an image
   */
  private isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Upload to Firebase Storage
   */
  private async uploadToFirebase(file: File, path: string): Promise<UploadResult> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      return {
        url,
        path,
        provider: 'firebase',
        size: snapshot.metadata.size,
      };
    } catch (error: any) {
      console.error('Firebase upload error:', error);
      throw new Error(`Firebase upload failed: ${error.message}`);
    }
  }

  /**
   * Upload to Cloudflare R2 (S3-compatible)
   */
  private async uploadToR2(file: File, path: string): Promise<UploadResult> {
    try {
      const result = await r2Storage.uploadFile(file, path, {
        contentType: file.type,
        metadata: {
          name: file.name.replace(/[^\x00-\x7F]/g, ''), // ASCII-safe
          uploaded: new Date().toISOString(),
        },
      });

      return {
        url: result.url,
        path: result.key,
        provider: 'r2',
        size: file.size,
      };
    } catch (error: any) {
      console.error('R2 upload error:', error);
      // Don't fallback to Firebase - throw error
      throw new Error(`R2 upload failed: ${error.message}`);
    }
  }

  /**
   * Convert to Base64 (for small images, previews)
   */
  private async convertToBase64(file: File, path: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64 = reader.result as string;
        resolve({
          url: base64,
          path,
          provider: 'base64',
          size: file.size,
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed to convert to base64'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Delete file from storage
   */
  async deleteFile(path: string, provider: StorageProvider = this.defaultProvider): Promise<void> {
    switch (provider) {
      case 'r2':
        return this.deleteFromR2(path);
      case 'firebase':
        return this.deleteFromFirebase(path);
      case 'base64':
        // Base64 doesn't need deletion
        return;
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  }

  /**
   * Delete from Firebase Storage
   */
  private async deleteFromFirebase(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      console.error('Firebase delete error:', error);
      throw new Error(`Firebase delete failed: ${error.message}`);
    }
  }

  /**
   * Delete from Cloudflare R2
   */
  private async deleteFromR2(path: string): Promise<void> {
    try {
      await r2Storage.deleteFile(path);
    } catch (error: any) {
      console.error('R2 delete error:', error);
      throw new Error(`R2 delete failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploads = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploads);
  }

  /**
   * Compress image before upload (R2-optimized: smaller size, less bandwidth)
   */
  async compressImage(
    file: File,
    maxWidth: number = this.DEFAULT_MAX_WIDTH,
    maxHeight: number = this.DEFAULT_MAX_HEIGHT,
    quality: number = this.DEFAULT_QUALITY
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions (maintain aspect ratio)
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          
          // Enable image smoothing for better quality
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg', // Always use JPEG for better compression
                lastModified: Date.now(),
              });

              // If compressed file is larger, use original (rare case)
              if (compressedFile.size > file.size) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            },
            'image/jpeg', // JPEG for better compression
            quality
          );
        };

        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get current storage provider
   */
  getProvider(): StorageProvider {
    return this.defaultProvider;
  }

  /**
   * Get storage stats
   */
  async getStorageStats(): Promise<{ used: number; limit: number; provider: string }> {
    return {
      used: 0,
      limit: this.defaultProvider === 'r2' ? Infinity : 5 * 1024 * 1024 * 1024, // 5GB for Firebase
      provider: this.defaultProvider,
    };
  }
}

export const storageService = new StorageService();
