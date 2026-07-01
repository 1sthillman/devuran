/**
 * Cloudflare R2 Storage Service
 * Handles image and file uploads to Cloudflare R2
 */

import { compressImage, isValidImageType } from './mediaCompressionService';

// Cloudflare R2 Configuration
const R2_CONFIG = {
  accountId: 'c885d9b3bfb94036e6aa37d894548072',
  accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
  secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '',
  bucketName: import.meta.env.VITE_R2_BUCKET_NAME || 'devuran-images',
  publicUrl: import.meta.env.VITE_R2_PUBLIC_URL || 'https://images.devuran.com',
  region: 'auto',
};

interface UploadOptions {
  folder?: string;
  compress?: boolean;
  maxSizeMB?: number;
  generateThumbnail?: boolean;
}

interface UploadResult {
  url: string;
  key: string;
  size: number;
  thumbnailUrl?: string;
}

class CloudflareR2Service {
  private endpoint: string;

  constructor() {
    this.endpoint = `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`;
  }

  /**
   * Upload image to R2
   */
  async uploadImage(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const {
      folder = 'images',
      compress = true,
      maxSizeMB = 5,
      generateThumbnail = false
    } = options;

    // Validate file type
    if (!isValidImageType(file)) {
      throw new Error('Invalid image type. Only JPG, PNG, and WebP are allowed.');
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    // Compress image if enabled
    let processedFile = file;
    if (compress) {
      const compressed = await compressImage(file);
      // Convert base64 to File
      const blob = await fetch(compressed.base64).then(r => r.blob());
      processedFile = new File([blob], file.name, { type: compressed.mimeType });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomStr}.${extension}`;
    const key = `${folder}/${filename}`;

    // Upload to R2 via presigned URL or direct API
    const url = await this.uploadToR2(processedFile, key);

    const result: UploadResult = {
      url,
      key,
      size: processedFile.size
    };

    // Generate thumbnail if requested
    if (generateThumbnail) {
      result.thumbnailUrl = await this.generateThumbnail(processedFile, key);
    }

    return result;
  }

  /**
   * Upload file directly to R2
   */
  private async uploadToR2(file: File, key: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);

    // Use Cloudflare Workers endpoint for upload
    const uploadEndpoint = import.meta.env.VITE_R2_UPLOAD_ENDPOINT || '/api/r2/upload';

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Failed to upload to R2');
    }

    const data = await response.json();
    return data.url || `${R2_CONFIG.publicUrl}/${key}`;
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(file: File, originalKey: string): Promise<string> {
    // Use Cloudflare Image Resizing or generate locally
    const thumbnailKey = originalKey.replace(/(\.[^.]+)$/, '_thumb$1');
    
    // Create thumbnail (max 200x200)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
              const url = await this.uploadToR2(thumbnailFile, thumbnailKey);
              resolve(url);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<void> {
    const deleteEndpoint = import.meta.env.VITE_R2_DELETE_ENDPOINT || '/api/r2/delete';

    const response = await fetch(deleteEndpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete file from R2');
    }
  }

  /**
   * Get public URL for a key
   */
  getPublicUrl(key: string): string {
    return `${R2_CONFIG.publicUrl}/${key}`;
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload from base64
   */
  async uploadBase64(
    base64: string,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Convert base64 to File
    const blob = await fetch(base64).then(r => r.blob());
    const file = new File([blob], filename, { type: blob.type });
    
    return this.uploadImage(file, options);
  }
}

export const r2Service = new CloudflareR2Service();
