/**
 * Cloudflare R2 Storage Service
 * S3-compatible object storage with zero egress fees
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

class R2StorageService {
  private client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;
  private isConfigured: boolean = false;

  constructor() {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
    const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
    this.bucketName = import.meta.env.VITE_R2_BUCKET_NAME || 'randevu-images';
    this.publicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';

    if (accountId && accessKeyId && secretAccessKey) {
      try {
        this.client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.isConfigured = true;
        console.log('✅ Cloudflare R2 configured successfully');
      } catch (error) {
        console.error('❌ R2 configuration failed:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️ R2 credentials not found in environment variables');
    }
  }

  /**
   * Check if R2 is configured and ready
   */
  isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Test bucket connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const command = new HeadBucketCommand({ Bucket: this.bucketName });
      await this.client!.send(command);
      console.log('✅ R2 bucket connection successful');
      return true;
    } catch (error) {
      console.error('❌ R2 bucket connection failed:', error);
      return false;
    }
  }

  /**
   * Upload file to R2
   */
  async uploadFile(
    file: File,
    path: string,
    options: { contentType?: string; metadata?: Record<string, string> } = {}
  ): Promise<{ url: string; key: string }> {
    if (!this.isReady()) {
      throw new Error('R2 is not configured. Please check your environment variables.');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // SANITIZE METADATA - Remove Turkish characters and non-ASCII
      const sanitizedMetadata: Record<string, string> = {};
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          // Convert to ASCII-safe string
          const asciiKey = key.replace(/[^\x00-\x7F]/g, '');
          const asciiValue = value.replace(/[^\x00-\x7F]/g, '');
          if (asciiKey && asciiValue) {
            sanitizedMetadata[asciiKey] = asciiValue;
          }
        });
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: buffer,
        ContentType: options.contentType || file.type,
        Metadata: sanitizedMetadata, // Use sanitized metadata
      });

      await this.client!.send(command);

      // Construct public URL
      const url = `${this.publicUrl}/${path}`;

      console.log(`✅ File uploaded to R2: ${path}`);
      return { url, key: path };
    } catch (error: any) {
      console.error('❌ R2 upload failed:', error);
      throw new Error(`R2 upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('R2 is not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client!.send(command);
      console.log(`✅ File deleted from R2: ${key}`);
    } catch (error: any) {
      console.error('❌ R2 delete failed:', error);
      throw new Error(`R2 delete failed: ${error.message}`);
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Get bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }
}

export const r2Storage = new R2StorageService();
