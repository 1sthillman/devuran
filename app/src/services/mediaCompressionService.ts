import imageCompression from 'browser-image-compression';

// Maksimum dosya boyutları (Firestore limitleri göz önünde bulundurularak)
const MAX_IMAGE_SIZE_KB = 100; // 100KB - Firestore document 1MB limit
const MAX_VIDEO_SIZE_KB = 500; // 500KB - 15 saniye için
const MAX_VIDEO_DURATION = 15; // saniye

// Görsel kalite ayarları
const IMAGE_QUALITY = 0.7;
const IMAGE_MAX_WIDTH = 800;
const IMAGE_MAX_HEIGHT = 800;

// Video ayarları
const VIDEO_MAX_WIDTH = 640;
const VIDEO_MAX_HEIGHT = 480;
const VIDEO_BITRATE = 250000; // 250kbps

export interface CompressionResult {
  base64: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  originalSize: number;
  compressionRatio: number;
}

export interface VideoCompressionResult extends CompressionResult {
  duration: number;
  thumbnail: string;
}

/**
 * Görseli sıkıştırır ve base64 formatına çevirir
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  try {
    const originalSize = file.size;

    // Görsel sıkıştırma seçenekleri
    const options = {
      maxSizeMB: MAX_IMAGE_SIZE_KB / 1024,
      maxWidthOrHeight: Math.max(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT),
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: IMAGE_QUALITY,
    };

    // Görseli sıkıştır
    const compressedFile = await imageCompression(file, options);

    // Base64'e çevir
    const base64 = await fileToBase64(compressedFile);

    // Boyutları al
    const dimensions = await getImageDimensions(base64);

    return {
      base64,
      size: compressedFile.size,
      width: dimensions.width,
      height: dimensions.height,
      mimeType: compressedFile.type,
      originalSize,
      compressionRatio: ((1 - compressedFile.size / originalSize) * 100).toFixed(2) as any,
    };
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Görsel sıkıştırma başarısız oldu');
  }
}

/**
 * Videoyu sıkıştırır ve base64 formatına çevirir
 */
export async function compressVideo(file: File): Promise<VideoCompressionResult> {
  try {
    const originalSize = file.size;

    // Video süresini kontrol et
    const duration = await getVideoDuration(file);
    if (duration > MAX_VIDEO_DURATION) {
      throw new Error(`Video süresi maksimum ${MAX_VIDEO_DURATION} saniye olmalıdır`);
    }

    // Video'yu sıkıştır
    const compressedBlob = await compressVideoFile(file);

    // Base64'e çevir
    const base64 = await blobToBase64(compressedBlob);

    // Thumbnail oluştur
    const thumbnail = await generateVideoThumbnail(file);

    // Boyutları al
    const dimensions = await getVideoDimensions(file);

    return {
      base64,
      size: compressedBlob.size,
      width: dimensions.width,
      height: dimensions.height,
      mimeType: compressedBlob.type,
      originalSize,
      compressionRatio: ((1 - compressedBlob.size / originalSize) * 100).toFixed(2) as any,
      duration,
      thumbnail,
    };
  } catch (error) {
    console.error('Video compression error:', error);
    throw error;
  }
}

/**
 * Çoklu görselleri sıkıştırır
 */
export async function compressMultipleImages(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i]);
    results.push(result);

    if (onProgress) {
      onProgress(((i + 1) / total) * 100);
    }
  }

  return results;
}

/**
 * File'ı base64'e çevirir
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Blob'u base64'e çevirir
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Görsel boyutlarını alır
 */
function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64;
  });
}

/**
 * Video süresini alır
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Video boyutlarını alır
 */
function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Video'yu sıkıştırır (Canvas ve MediaRecorder kullanarak)
 */
async function compressVideoFile(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context alınamadı'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = async () => {
      // Video boyutlarını ayarla
      const scale = Math.min(
        VIDEO_MAX_WIDTH / video.videoWidth,
        VIDEO_MAX_HEIGHT / video.videoHeight,
        1
      );

      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      // MediaRecorder ile kaydet
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: VIDEO_BITRATE,
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Boyut kontrolü
        if (blob.size > MAX_VIDEO_SIZE_KB * 1024) {
          reject(new Error(`Video boyutu ${MAX_VIDEO_SIZE_KB}KB'dan büyük olamaz`));
        } else {
          resolve(blob);
        }
      };

      mediaRecorder.onerror = reject;

      // Video'yu oynat ve kaydet
      video.play();
      mediaRecorder.start();

      const drawFrame = () => {
        if (video.ended || video.paused) {
          mediaRecorder.stop();
          window.URL.revokeObjectURL(video.src);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Video thumbnail oluşturur
 */
async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context alınamadı'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      // İlk frame'i yakala
      video.currentTime = 0;
    };

    video.onseeked = async () => {
      // Thumbnail boyutları
      const scale = Math.min(400 / video.videoWidth, 300 / video.videoHeight, 1);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      // Frame'i çiz
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Base64'e çevir
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

      window.URL.revokeObjectURL(video.src);
      resolve(thumbnail);
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Base64 boyutunu hesaplar (bytes)
 */
export function getBase64Size(base64: string): number {
  const base64Length = base64.length - (base64.indexOf(',') + 1);
  const padding = (base64.charAt(base64.length - 2) === '=' ? 2 : base64.charAt(base64.length - 1) === '=' ? 1 : 0);
  return base64Length * 0.75 - padding;
}

/**
 * Dosya tipini kontrol eder
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Video tipini kontrol eder
 */
export function isValidVideoType(file: File): boolean {
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  return validTypes.includes(file.type);
}

/**
 * Dosya boyutunu formatlar
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Video süresini formatlar
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
