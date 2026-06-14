import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { announcementService } from '@/services/announcementService';
import { useAuthStore } from '@/store/authStore';
import type { Announcement } from '@/types/announcement';

interface AnnouncementPopupProps {
  userType: 'customer' | 'owner';
  businessId?: string;
  serviceIds?: string[];
}

export function AnnouncementPopup({ userType, businessId, serviceIds }: AnnouncementPopupProps) {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (user) {
      loadAnnouncements();
    }
  }, [user, businessId, serviceIds]);

  const loadAnnouncements = async () => {
    if (!user) return;

    try {
      const data = await announcementService.getUserAnnouncements(
        user.uid,
        userType,
        businessId,
        serviceIds
      );

      // Sadece okunmamış duyuruları göster
      const unread = data.filter(a => !a.readBy.includes(user.uid));
      
      if (unread.length > 0) {
        setAnnouncements(unread);
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
    }
  };

  const currentAnnouncement = announcements[currentIndex];

  const handleClose = async () => {
    if (currentAnnouncement && user) {
      await announcementService.markAsRead(currentAnnouncement.id, user.uid);
    }
    
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowPopup(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!showPopup || !currentAnnouncement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-gradient-to-br from-[var(--slate-surface)] to-[var(--slate-elevated)] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[var(--chrome-white)] mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {currentAnnouncement.title}
                </h2>
                <p className="text-xs text-[var(--muted-lead)]">
                  {new Date(currentAnnouncement.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-[var(--muted-lead)]" />
              </motion.button>
            </div>

            {/* Navigation Dots */}
            {announcements.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'w-1.5 bg-white/20 hover:bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {!showDetail ? (
              <div className="space-y-6">
                {/* Image */}
                {currentAnnouncement.imageUrl && (
                  <div className="relative rounded-3xl overflow-hidden aspect-video bg-white/5">
                    <img
                      src={currentAnnouncement.imageUrl}
                      alt={currentAnnouncement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Message Preview */}
                <div className="space-y-4">
                  <p className="text-[var(--chrome-white)] leading-relaxed line-clamp-4">
                    {currentAnnouncement.message}
                  </p>

                  {currentAnnouncement.message.length > 200 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDetail(true)}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                    >
                      Detayları Gör
                    </motion.button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Full Image */}
                {currentAnnouncement.imageUrl && (
                  <div className="relative rounded-3xl overflow-hidden bg-white/5">
                    <img
                      src={currentAnnouncement.imageUrl}
                      alt={currentAnnouncement.title}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* Full Message */}
                <div className="prose prose-invert max-w-none">
                  <p className="text-[var(--chrome-white)] leading-relaxed whitespace-pre-wrap">
                    {currentAnnouncement.message}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDetail(false)}
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-[var(--chrome-white)] font-semibold transition-all"
                >
                  Özete Dön
                </motion.button>
              </div>
            )}
          </div>

          {/* Footer with Navigation */}
          {announcements.length > 1 && (
            <div className="p-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--chrome-white)] font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Önceki
              </motion.button>

              <span className="text-sm text-[var(--muted-lead)]">
                {currentIndex + 1} / {announcements.length}
              </span>

              <motion.button
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={currentIndex === announcements.length - 1}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--chrome-white)] font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Sonraki
                <ChevronRight size={18} />
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
