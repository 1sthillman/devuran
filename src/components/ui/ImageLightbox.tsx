import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black backdrop-blur-xl flex flex-col"
          onClick={(e) => {
            // Sadece backdrop'a tıklandığında kapat
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-[100] flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
            {/* Counter */}
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-mono text-xs sm:text-sm font-semibold shadow-lg pointer-events-auto">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95 shadow-lg border border-white/20"
                title="Tam Ekran"
              >
                <Maximize2 size={20} className="sm:hidden" strokeWidth={2.5} />
                <Maximize2 size={22} className="hidden sm:block" strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95 shadow-lg border border-white/20"
                title="Kapat"
              >
                <X size={20} className="sm:hidden" strokeWidth={2.5} />
                <X size={22} className="hidden sm:block" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Main Image Container */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 lg:p-12 pt-16 pb-32 sm:pt-20 sm:pb-36">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[currentIndex]}
                alt={`Galeri ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-2xl sm:rounded-3xl shadow-2xl"
              />
            </motion.div>
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95 z-[100] shadow-lg border border-white/20"
                title="Önceki"
              >
                <ChevronLeft size={28} className="sm:hidden" strokeWidth={2.5} />
                <ChevronLeft size={32} className="hidden sm:block" strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95 z-[100] shadow-lg border border-white/20"
                title="Sonraki"
              >
                <ChevronRight size={28} className="sm:hidden" strokeWidth={2.5} />
                <ChevronRight size={32} className="hidden sm:block" strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
              <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide max-w-full px-2 sm:px-4 pointer-events-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
                    className={`flex-shrink-0 w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all shadow-lg ${
                      i === currentIndex
                        ? 'border-white scale-110 shadow-xl'
                        : 'border-white/40 opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Swipe Hint */}
          <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium opacity-50 pointer-events-none sm:hidden">
            Kaydırarak gezin
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

