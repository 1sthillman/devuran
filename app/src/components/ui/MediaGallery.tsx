import { useState } from 'react';
import { X, Play, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types';
import { formatDuration } from '@/services/mediaCompressionService';

interface MediaGalleryProps {
  media: MediaItem[];
  className?: string;
}

export function MediaGallery({ media, className }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setIsPlaying(false);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setIsPlaying(false);
  };

  const goToPrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + media.length) % media.length);
    setIsPlaying(false);
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % media.length);
    setIsPlaying(false);
  };

  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null;

  if (media.length === 0) return null;

  return (
    <>
      {/* Gallery Grid */}
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3', className)}>
        {media.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-3xl overflow-hidden cursor-pointer group bg-slate-surface"
          >
            {/* Image */}
            {item.type === 'image' && (
              <img
                src={item.base64}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
            )}

            {/* Video Thumbnail */}
            {item.type === 'video' && (
              <>
                <img
                  src={item.thumbnail}
                  alt={`Video ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                  <div className="p-3 rounded-full bg-white/90 group-hover:bg-white transition-colors">
                    <Play className="w-6 h-6 text-slate-surface fill-current" />
                  </div>
                </div>
                {item.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                    {formatDuration(item.duration)}
                  </div>
                )}
              </>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white">
                <ZoomIn className="w-4 h-4" />
                <span className="text-xs">Görüntüle</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation */}
            {media.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/10 rounded-full text-white text-sm z-10">
              {selectedIndex! + 1} / {media.length}
            </div>

            {/* Media Content */}
            <motion.div
              key={selectedIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl max-h-[90vh] w-full"
            >
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.base64}
                  alt="Full size"
                  className="w-full h-full object-contain rounded-3xl"
                />
              ) : (
                <div className="relative">
                  {!isPlaying ? (
                    <>
                      <img
                        src={selectedMedia.thumbnail}
                        alt="Video thumbnail"
                        className="w-full h-full object-contain rounded-3xl"
                      />
                      <button
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="p-6 rounded-full bg-white/90 hover:bg-white transition-colors">
                          <Play className="w-12 h-12 text-slate-surface fill-current" />
                        </div>
                      </button>
                    </>
                  ) : (
                    <video
                      src={selectedMedia.base64}
                      controls
                      autoPlay
                      className="w-full h-full object-contain rounded-3xl"
                      onEnded={() => setIsPlaying(false)}
                    />
                  )}
                </div>
              )}
            </motion.div>

            {/* Thumbnails */}
            {media.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 py-2 bg-black/50 rounded-full">
                {media.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(index);
                    }}
                    className={cn(
                      'w-16 h-16 rounded-3xl overflow-hidden flex-shrink-0 border-2 transition-all',
                      index === selectedIndex
                        ? 'border-white scale-110'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <img
                      src={item.type === 'image' ? item.base64 : item.thumbnail}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

