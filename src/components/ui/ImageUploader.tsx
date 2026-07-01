import { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { r2Service } from '@/services/cloudflareR2Service';
import { useUIStore } from '@/store/uiStore';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
  folder?: string;
}

export function ImageUploader({ value, onChange, label, maxSizeMB = 5, folder = 'images' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useUIStore();

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setShowOptions(false);

    try {
      // Upload to Cloudflare R2
      const result = await r2Service.uploadImage(file, {
        folder,
        compress: true,
        maxSizeMB,
        generateThumbnail: false
      });
      
      setPreview(result.url);
      onChange(result.url);
      addToast('Görsel başarıyla yüklendi', 'success');
    } catch (error: any) {
      console.error('Upload error:', error);
      addToast(error.message || 'Görsel yükleme başarısız oldu', 'error');
    }

    setUploading(false);
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
                <>
                  <Loader2 size={32} className="text-[var(--liquid-chrome)] animate-spin" />
                  <span className="font-body text-sm text-[var(--muted-lead)]">Yükleniyor...</span>
                </>
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

