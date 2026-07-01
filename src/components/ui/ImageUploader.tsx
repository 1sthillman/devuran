import { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, X, Loader2, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, isValidImageType } from '@/services/mediaCompressionService';
import { storageService } from '@/services/storageService';
import { useUIStore } from '@/store/uiStore';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
  folder?: string;
  useCloudStorage?: boolean; // Firebase/R2 kullan, yoksa base64
}

export function ImageUploader({ 
  value, 
  onChange, 
  label, 
  maxSizeMB = 5, 
  folder = 'images',
  useCloudStorage = true // ✅ Default: Cloud storage (R2/Firebase)
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [showOptions, setShowOptions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useUIStore();

  const handleFileSelect = async (file: File) => {
    if (!isValidImageType(file)) {
      addToast('Sadece JPG, PNG veya WebP formatında görsel yükleyebilirsiniz', 'warning');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      addToast(`Dosya boyutu maksimum ${maxSizeMB}MB olmalıdır`, 'warning');
      return;
    }

    setUploading(true);
    setShowOptions(false);
    setUploadProgress(0);

    try {
      // Görseli sıkıştır
      const compressed = await compressImage(file);
      setUploadProgress(30);

      if (useCloudStorage) {
        // Cloud storage kullan (Firebase/R2)
        const compressedFile = new File(
          [await (await fetch(compressed.base64)).blob()],
          file.name,
          { type: file.type }
        );

        setUploadProgress(50);
        // Zaten compress edildi, tekrar compress etme
        const result = await storageService.uploadFile(compressedFile, { 
          folder,
          compress: false // Manuel compress edildi
        });
        setUploadProgress(100);

        setPreview(result.url);
        onChange(result.url);
        
        const provider = storageService.getProvider();
        const providerName = provider === 'firebase' ? 'Firebase' : provider === 'r2' ? 'Cloudflare R2' : 'Cloud';
        addToast(`✅ Görsel ${providerName}'a yüklendi`, 'success');
      } else {
        // Base64 kullan (mevcut davranış)
        setUploadProgress(100);
        setPreview(compressed.base64);
        onChange(compressed.base64);
        addToast('✅ Görsel başarıyla yüklendi', 'success');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      addToast(`❌ Yükleme başarısız: ${error.message}`, 'error');
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div>
      {label && (
        <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {preview ? (
          <div className="relative w-full h-48 rounded-full overflow-hidden bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)]">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[var(--error)] flex items-center justify-center hover:bg-[var(--error)]/80 transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              disabled={uploading}
              className="w-full h-48 rounded-full border-2 border-dashed border-[var(--obsidian-rim)] bg-[var(--void)] hover:border-[var(--liquid-chrome)] transition-colors flex flex-col items-center justify-center gap-3"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-[var(--liquid-chrome)] animate-spin" />
                  <span className="font-body text-sm text-[var(--muted-lead)]">Yükleniyor...</span>
                  {uploadProgress > 0 && (
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                      />
                    </div>
                  )}
                  {useCloudStorage && (
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{storageService.getProvider() === 'firebase' ? 'Firebase' : 'Cloudflare R2'}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload size={32} className="text-[var(--muted-lead)]" />
                  <span className="font-heading font-medium text-sm text-[var(--silver-frost)]">
                    Görsel Yükle
                  </span>
                  <span className="font-body text-xs text-[var(--muted-lead)]">
                    Tıklayın veya sürükleyin
                  </span>
                </>
              )}
            </button>

            <AnimatePresence>
              {showOptions && !uploading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 p-2 rounded-full bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] shadow-xl z-10"
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-3xl hover:bg-white/5 transition-colors text-left"
                  >
                    <ImageIcon size={20} className="text-[var(--liquid-chrome)]" />
                    <div>
                      <p className="font-heading font-medium text-sm text-[var(--chrome-white)]">
                        Galeriden Seç
                      </p>
                      <p className="font-body text-xs text-[var(--muted-lead)]">
                        Cihazınızdan görsel seçin
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-3xl hover:bg-white/5 transition-colors text-left"
                  >
                    <Camera size={20} className="text-[var(--liquid-chrome)]" />
                    <div>
                      <p className="font-heading font-medium text-sm text-[var(--chrome-white)]">
                        Fotoğraf Çek
                      </p>
                      <p className="font-body text-xs text-[var(--muted-lead)]">
                        Kamera ile çekin
                      </p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );
}

