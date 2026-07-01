import { lazy, Suspense } from 'react';
import { Image, Instagram, Youtube, Music } from 'lucide-react';

const ImageUploader = lazy(() => import('@/components/ui/ImageUploader').then(m => ({ default: m.ImageUploader })));
const MultiImageUploader = lazy(() => import('@/components/ui/MultiImageUploader').then(m => ({ default: m.MultiImageUploader })));

interface MediaUploadProps {
  data: {
    logo: string;
    coverImage: string;
    galleryImages: string[];
    socialMedia: {
      instagram: string;
      tiktok: string;
      youtube: string;
    };
  };
  onChange: (data: any) => void;
}

export function MediaUpload({ data, onChange }: MediaUploadProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Info Badge */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
        <p className="text-sm text-[var(--silver-frost)] text-center">
          Görseller işletmenizin ilk izlenimini oluşturur. En az kapak görseli ekleyin.
        </p>
      </div>

      <Suspense fallback={
        <div className="h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <div className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
              <Image size={16} className="text-purple-400" />
              Logo
            </label>
            <ImageUploader
              label=""
              value={data.logo}
              onChange={(url) => onChange({ ...data, logo: url })}
              folder="logos"
              useCloudStorage={true}
            />
            <p className="text-xs text-[var(--muted-lead)] mt-2 ml-1">
              Opsiyonel - İşletmenizin logosu
            </p>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
              <Image size={16} className="text-pink-400" />
              Kapak Görseli *
            </label>
            <ImageUploader
              label=""
              value={data.coverImage}
              onChange={(url) => onChange({ ...data, coverImage: url })}
              folder="covers"
              useCloudStorage={true}
            />
            <p className="text-xs text-[var(--muted-lead)] mt-2 ml-1">
              Zorunlu - Ana sayfa görseli (en az 1200x600px önerilir)
            </p>
          </div>

          {/* Gallery */}
          <div>
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
              <Image size={16} className="text-blue-400" />
              Galeri Görselleri
            </label>
            <MultiImageUploader
              label=""
              value={data.galleryImages}
              onChange={(urls) => onChange({ ...data, galleryImages: urls })}
              maxImages={10}
              folder="gallery"
              useCloudStorage={true}
            />
            <p className="text-xs text-[var(--muted-lead)] mt-2 ml-1">
              Opsiyonel - İşletmenizden fotoğraflar (maksimum 10 görsel)
            </p>
          </div>

          {/* Social Media */}
          <div className="pt-3 border-t border-white/10">
            <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-3">
              Sosyal Medya Hesapları
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
                  <Instagram size={16} className="text-pink-400" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={data.socialMedia.instagram}
                  onChange={(e) => onChange({ 
                    ...data, 
                    socialMedia: { ...data.socialMedia, instagram: e.target.value }
                  })}
                  placeholder="https://instagram.com/..."
                  className="w-full h-12 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
                  <Music size={16} className="text-cyan-400" />
                  TikTok
                </label>
                <input
                  type="url"
                  value={data.socialMedia.tiktok}
                  onChange={(e) => onChange({ 
                    ...data, 
                    socialMedia: { ...data.socialMedia, tiktok: e.target.value }
                  })}
                  placeholder="https://tiktok.com/@..."
                  className="w-full h-12 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
                  <Youtube size={16} className="text-red-400" />
                  YouTube
                </label>
                <input
                  type="url"
                  value={data.socialMedia.youtube}
                  onChange={(e) => onChange({ 
                    ...data, 
                    socialMedia: { ...data.socialMedia, youtube: e.target.value }
                  })}
                  placeholder="https://youtube.com/@..."
                  className="w-full h-12 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
