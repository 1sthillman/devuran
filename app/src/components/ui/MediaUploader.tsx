import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  compressImage,
  compressVideo,
  isValidImageType,
  isValidVideoType,
  formatFileSize,
  formatDuration,
  type CompressionResult,
  type VideoCompressionResult,
} from '@/services/mediaCompressionService';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  base64: string;
  thumbnail?: string;
  size: number;
  width: number;
  height: number;
  duration?: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  compressionRatio?: number;
}

interface MediaUploaderProps {
  maxImages?: number;
  maxVideos?: number;
  onMediaChange?: (media: MediaItem[]) => void;
  existingMedia?: MediaItem[];
  className?: string;
}

export function MediaUploader({
  maxImages = 10,
  maxVideos = 3,
  onMediaChange,
  existingMedia = [],
  className,
}: MediaUploaderProps) {
  const [media, setMedia] = useState<MediaItem[]>(existingMedia);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageCount = media.filter((m) => m.type === 'image').length;
  const videoCount = media.filter((m) => m.type === 'video').length;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newMedia: MediaItem[] = [];

    for (const file of fileArray) {
      const id = `${Date.now()}-${Math.random()}`;

      if (isValidImageType(file)) {
        if (imageCount + newMedia.filter((m) => m.type === 'image').length >= maxImages) {
          continue;
        }

        newMedia.push({
          id,
          type: 'image',
          base64: '',
          size: 0,
          width: 0,
          height: 0,
          status: 'uploading',
        });

        // Asenkron sıkıştırma
        compressImageAsync(file, id);
      } else if (isValidVideoType(file)) {
        if (videoCount + newMedia.filter((m) => m.type === 'video').length >= maxVideos) {
          continue;
        }

        newMedia.push({
          id,
          type: 'video',
          base64: '',
          thumbnail: '',
          size: 0,
          width: 0,
          height: 0,
          duration: 0,
          status: 'uploading',
        });

        // Asenkron sıkıştırma
        compressVideoAsync(file, id);
      }
    }

    if (newMedia.length > 0) {
      const updatedMedia = [...media, ...newMedia];
      setMedia(updatedMedia);
    }
  };

  const compressImageAsync = async (file: File, id: string) => {
    try {
      const result = await compressImage(file);

      setMedia((prev) => {
        const updated = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                base64: result.base64,
                size: result.size,
                width: result.width,
                height: result.height,
                status: 'success' as const,
                compressionRatio: result.compressionRatio,
              }
            : item
        );
        onMediaChange?.(updated);
        return updated;
      });
    } catch (error: any) {
      setMedia((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'error' as const, error: error.message }
            : item
        )
      );
    }
  };

  const compressVideoAsync = async (file: File, id: string) => {
    try {
      const result = await compressVideo(file);

      setMedia((prev) => {
        const updated = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                base64: result.base64,
                thumbnail: result.thumbnail,
                size: result.size,
                width: result.width,
                height: result.height,
                duration: result.duration,
                status: 'success' as const,
                compressionRatio: result.compressionRatio,
              }
            : item
        );
        onMediaChange?.(updated);
        return updated;
      });
    } catch (error: any) {
      setMedia((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'error' as const, error: error.message }
            : item
        )
      );
    }
  };

  const removeMedia = (id: string) => {
    const updated = media.filter((item) => item.id !== id);
    setMedia(updated);
    onMediaChange?.(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer',
          'hover:border-chrome-white/40 hover:bg-liquid-glass',
          isDragging && 'border-chrome-white bg-liquid-glass scale-105'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-liquid-glass">
            <Upload className="w-8 h-8 text-silver-frost" />
          </div>

          <div>
            <p className="text-lg font-medium text-chrome-white mb-1">
              Görsel veya Video Yükle
            </p>
            <p className="text-sm text-muted-lead">
              Sürükle bırak veya tıklayarak seç
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-lead">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>
                {imageCount}/{maxImages} Görsel
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span>
                {videoCount}/{maxVideos} Video
              </span>
            </div>
          </div>

          <p className="text-xs text-ash">
            Görseller max 100KB, Videolar max 500KB ve 15 saniye
          </p>
        </div>
      </div>

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {media.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-surface border border-obsidian-rim"
              >
                {/* Media Preview */}
                {item.status === 'success' && (
                  <>
                    {item.type === 'image' ? (
                      <img
                        src={item.base64}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={item.thumbnail}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        {item.duration && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                            {formatDuration(item.duration)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Loading State */}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-surface">
                    <Loader2 className="w-8 h-8 text-chrome-white animate-spin" />
                    <p className="text-xs text-muted-lead">Sıkıştırılıyor...</p>
                  </div>
                )}

                {/* Error State */}
                {item.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-surface p-4">
                    <AlertCircle className="w-8 h-8 text-error" />
                    <p className="text-xs text-error text-center">{item.error}</p>
                  </div>
                )}

                {/* Success Badge */}
                {item.status === 'success' && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-success/90 rounded text-xs text-white">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.compressionRatio && <span>{item.compressionRatio}%</span>}
                  </div>
                )}

                {/* Info Badge */}
                {item.status === 'success' && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                    {formatFileSize(item.size)}
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeMedia(item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-error rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
