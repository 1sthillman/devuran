import { useState, useRef } from 'react';
import { X, Loader2, Plus, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { compressMultipleImages, isValidImageType } from '@/services/mediaCompressionService';
import { storageService } from '@/services/storageService';
import { useUIStore } from '@/store/uiStore';

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxImages?: number;
  folder?: string;
  useCloudStorage?: boolean;
}

export function MultiImageUploader({ 
  value, 
  onChange, 
  label, 
  maxImages = 10,
  folder = 'gallery',
  useCloudStorage = true
}: MultiImageUploaderProps) {
  const { addToast } = useUIStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    const validFiles = fileArray.filter(file => {
      if (!isValidImageType(file)) {
        addToast(`${file.name} geçersiz format`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (value.length + validFiles.length > maxImages) {
      addToast(`Maksimum ${maxImages} görsel yükleyebilirsiniz`, 'warning');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const compressed = await compressMultipleImages(validFiles, setProgress);
      
      if (useCloudStorage) {
        const uploadPromises = compressed.map(async (img, index) => {
          const blob = await (await fetch(img.base64)).blob();
          const file = new File([blob], `image-${Date.now()}-${index}.webp`, { type: 'image/webp' });
          // Zaten compress edildi, tekrar compress etme
          const result = await storageService.uploadFile(file, { 
            folder,
            compress: false // Manuel compress edildi
          });
          return result.url;
        });
        
        const urls = await Promise.all(uploadPromises);
        onChange([...value, ...urls]);
        
        const provider = storageService.getProvider();
        addToast(`✅ ${urls.length} görsel ${provider === 'r2' ? 'R2' : 'Firebase'}'ya yüklendi`, 'success');
      } else {
        const base64URLs = compressed.map(img => img.base64);
        onChange([...value, ...base64URLs]);
        addToast('✅ Görseller yüklendi', 'success');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      addToast('❌ Yükleme başarısız', 'error');
    }

    setUploading(false);
    setProgress(0);
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  return (
    <div>
      {label && (
        <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
          {label}
        </label>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {value.map((url, index) => (
          <motion.div
            key={url}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-square rounded-full overflow-hidden bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)]"
          >
            <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--error)] flex items-center justify-center hover:bg-[var(--error)]/80 transition-colors"
            >
              <X size={12} className="text-white" />
            </button>
          </motion.div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-full border-2 border-dashed border-[var(--obsidian-rim)] bg-[var(--void)] hover:border-[var(--liquid-chrome)] transition-colors flex flex-col items-center justify-center gap-2"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="text-[var(--liquid-chrome)] animate-spin" />
                <span className="font-body text-xs text-[var(--muted-lead)]">{Math.round(progress)}%</span>
                {useCloudStorage && (
                  <div className="flex items-center gap-1 text-[10px] text-white/40">
                    <Cloud className="w-3 h-3" />
                    <span>{storageService.getProvider() === 'r2' ? 'R2' : 'FB'}</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Plus size={24} className="text-[var(--muted-lead)]" />
                <span className="font-body text-xs text-[var(--muted-lead)]">Ekle</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
        {value.length} / {maxImages} görsel
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}

