import { useParams, useNavigate } from 'react-router-dom';
import { StarRating } from '@/components/ui/StarRating';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { StaffCard } from '@/components/salon/StaffCard';
import { SalonMap } from '@/components/salon/SalonMap';
import { ReviewList } from '@/components/reviews/ReviewList';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { blockingService } from '@/services/blockingService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const categoryLabels: Record<string, string> = {
  kuafor: 'Kuaför',
  berber: 'Berber',
  guzellik: 'Güzellik Merkezi',
  tirnak: 'Tırnak Salonu',
};
import { ObsidianCard } from '@/components/ui/ObsidianCard';
import { useBookingStore } from '@/store/bookingStore';
import { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, ChevronDown, ChevronUp, Instagram, Music, Youtube } from 'lucide-react';
import { salonsService, servicesService, staffService } from '@/services/firebaseService';
import type { Salon, Service, Staff } from '@/types';

export function SalonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const init = useBookingStore((s) => s.init);
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    isExpired: boolean;
    isPending: boolean;
    daysRemaining: number;
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadSalonData();
      checkSubscription();
    }
  }, [id]);

  const checkSubscription = async () => {
    if (!id) return;
    
    try {
      const { subscriptionService } = await import('@/services/subscriptionService');
      const subscription = await subscriptionService.getBusinessSubscription(id);
      
      if (!subscription) {
        setSubscriptionStatus({
          hasActiveSubscription: false,
          isExpired: true,
          isPending: false,
          daysRemaining: 0,
        });
        return;
      }
      
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      setSubscriptionStatus({
        hasActiveSubscription: subscription.status === 'active' && daysRemaining > 0,
        isExpired: subscription.status === 'expired' || daysRemaining <= 0,
        isPending: subscription.status === 'pending',
        daysRemaining: Math.max(0, daysRemaining),
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        isExpired: true,
        isPending: false,
        daysRemaining: 0,
      });
    }
  };

  const loadSalonData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [salonData, servicesData, staffData] = await Promise.all([
        salonsService.getById(id),
        servicesService.getBySalon(id),
        staffService.getBySalon(id),
      ]);
      
      setSalon(salonData);
      setServices(servicesData);
      setStaff(staffData);

      // Check if user is blocked or banned
      if (user && id) {
        try {
          const [blocked, banned] = await Promise.all([
            blockingService.isBusinessBlocked(user.uid, id),
            blockingService.isCustomerBanned(user.uid, id),
          ]);
          setIsBlocked(blocked);
          setIsBanned(banned);
        } catch (error: any) {
          // Permission hatası - rules henüz deploy edilmemiş
          if (error.code === 'permission-denied') {
            // Sessizce geç
          }
        }
      }
    } catch (error) {
      console.error('Error loading salon data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-[var(--muted-lead)]">Yukleniyor...</p>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="text-center py-20">
        <p className="font-body text-[var(--muted-lead)]">Salon bulunamadi.</p>
      </div>
    );
  }

  const handleBook = () => {
    // Abonelik kontrolü - EN ÖNCELİKLİ
    if (!subscriptionStatus?.hasActiveSubscription) {
      if (subscriptionStatus?.isPending) {
        addToast('Bu işletme şu anda randevu kabul etmemektedir. İşletme aboneliği onay bekliyor.', 'warning');
      } else if (subscriptionStatus?.isExpired) {
        addToast('Bu işletme şu anda kapalıdır. Randevu alınamaz.', 'error');
      } else {
        addToast('Bu işletme şu anda randevu kabul etmemektedir.', 'error');
      }
      return;
    }
    
    // Check if user is blocked or banned
    if (isBlocked) {
      addToast('Bu işletmeyi engellediniz. Randevu almak için engeli kaldırın.', 'error');
      return;
    }
    
    if (isBanned) {
      addToast('Bu işletme tarafından engellendiniz. Randevu alamazsınız.', 'error');
      return;
    }

    init(salon.id, salon);
    navigate(`/booking/${salon.id}`);
  };

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[300px] md:h-[400px] -mx-4 sm:-mx-6 lg:-mx-8"
      >
        {salon.coverImage ? (
          <img
            src={salon.coverImage}
            loading="lazy"
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--void)] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="liquid-glass-pill px-3 py-1 text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--chrome-white)]">
            {categoryLabels[salon.category]}
          </span>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-[var(--chrome-white)] mt-3">
            {salon.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <MapPin size={14} className="text-[var(--muted-lead)]" />
            <span className="font-body text-sm text-[var(--muted-lead)]">
              {salon.address.district}, {salon.address.city}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Rating & Actions */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <StarRating score={salon.stats.averageRating} size={20} />
          <span className="font-heading font-bold text-2xl text-[var(--chrome-white)]">
            {salon.stats.averageRating}
          </span>
          <span className="font-body text-sm text-[var(--muted-lead)]">
            ({salon.stats.reviewCount} yorum)
          </span>
        </div>

        {/* Modern Randevu Kartı */}
        <div className="mt-6 p-6 rounded-3xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-emerald-900/20">
          {/* Abonelik Uyarısı */}
          {subscriptionStatus && !subscriptionStatus.hasActiveSubscription && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-bold text-sm text-red-400 mb-1">
                    {subscriptionStatus.isPending ? 'İşletme Onay Bekliyor' : 'İşletme Kapalı'}
                  </h4>
                  <p className="font-body text-xs text-red-300/80 leading-relaxed">
                    {subscriptionStatus.isPending 
                      ? 'Bu işletme abonelik onayı bekliyor. Şu anda randevu alınamaz.'
                      : 'Bu işletme şu anda randevu kabul etmemektedir. Lütfen daha sonra tekrar deneyin.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-5">
            <div className={cn(
              'w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0',
              subscriptionStatus?.hasActiveSubscription
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
                : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-500/30'
            )}>
              <Calendar size={28} className={subscriptionStatus?.hasActiveSubscription ? 'text-emerald-400' : 'text-gray-400'} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-1">
                Randevu Oluştur
              </h3>
              <p className="font-body text-sm text-[var(--muted-lead)] leading-relaxed">
                {subscriptionStatus?.hasActiveSubscription 
                  ? 'Müsait saatleri görüntüleyin ve anında rezervasyon yapın'
                  : 'Randevu alınamaz'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleBook}
              disabled={!subscriptionStatus?.hasActiveSubscription}
              className={cn(
                'flex-1 h-14 rounded-full font-heading font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2.5',
                subscriptionStatus?.hasActiveSubscription
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-900/40 hover:shadow-emerald-500/30 active:scale-[0.98] cursor-pointer'
                  : 'bg-gray-500/20 text-gray-500 cursor-not-allowed opacity-50'
              )}
            >
              <Calendar size={20} strokeWidth={2.5} />
              <span>{subscriptionStatus?.hasActiveSubscription ? 'Randevu Al' : 'Randevu Kapalı'}</span>
            </button>
            <a
              href={`https://wa.me/${salon.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 w-14 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-emerald-900/20 hover:border-emerald-500/30 text-[var(--chrome-white)] transition-all active:scale-[0.98] flex items-center justify-center"
            >
              <MessageCircle size={20} strokeWidth={2.5} />
            </a>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8">
        <p className="font-body text-[15px] text-[var(--silver-frost)] leading-relaxed">
          {salon.description}
        </p>
      </div>

      {/* Services */}
      <section className="mt-10">
        <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-4">
          Hizmetler
        </h2>
        {Object.entries(servicesByCategory).map(([category, services]) => (
          <ObsidianCard key={category} hover={false} className="mb-3 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <span className="font-heading font-semibold text-base text-[var(--silver-frost)]">
                {category}
              </span>
              {expandedCategories[category] ? (
                <ChevronUp size={18} className="text-[var(--muted-lead)]" />
              ) : (
                <ChevronDown size={18} className="text-[var(--muted-lead)]" />
              )}
            </button>
            {expandedCategories[category] && (
              <div className="pb-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between px-4 py-3 border-t border-[var(--obsidian-rim)]">
                    <div>
                      <span className="font-body text-[15px] text-[var(--chrome-white)]">{service.name}</span>
                      {/* Sadece slot-based kategorilerde dakika göster */}
                      {['kuafor', 'berber', 'guzellik', 'tirnak', 'fotograf', 'video-produksiyon', 'drone-cekim'].includes(salon.category) && (
                        <span className="block font-body text-[13px] text-[var(--muted-lead)]">{service.duration} dk</span>
                      )}
                    </div>
                    <span className="font-mono font-medium text-[var(--silver-frost)]">{service.price} TL</span>
                  </div>
                ))}
              </div>
            )}
          </ObsidianCard>
        ))}
      </section>

      {/* Staff */}
      <section className="mt-10">
        <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-4">
          Ekibimiz
        </h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {staff.map((member) => (
            <StaffCard key={member.id} staff={member} variant="compact" />
          ))}
        </div>
      </section>

      {/* Gallery */}
      {salon.galleryImages && salon.galleryImages.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--chrome-white)] mb-4">
            Galeri
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {salon.galleryImages.filter(img => img).map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden obsidian-card cursor-pointer group relative hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <img
                  src={img}
                  loading="lazy"
                  alt={`${salon.name} galeri ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <ImageLightbox
            images={salon.galleryImages.filter(img => img)}
            initialIndex={lightboxIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </section>
      )}

      {/* Reviews */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)]">
            Musteri Yorumlari
          </h2>
          <span className="liquid-glass-pill px-3 py-1 font-mono text-sm text-[var(--silver-frost)]">
            {salon.stats.averageRating}
          </span>
        </div>
        <ReviewList salonId={salon.id} limit={2} />
        
        {salon.stats.reviewCount > 2 && (
          <button
            onClick={() => setShowAllReviews(true)}
            className="w-full mt-4 h-12 rounded-full bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] hover:from-[#1f2535] hover:to-[#141a24] border border-emerald-900/20 hover:border-emerald-500/30 text-[var(--chrome-white)] font-heading font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <MessageSquare size={18} />
            <span>Tüm Yorumları Gör ({salon.stats.reviewCount})</span>
          </button>
        )}
      </section>

      {/* All Reviews Modal */}
      {showAllReviews && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl"
            onClick={() => setShowAllReviews(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl sm:my-auto h-[85vh] sm:h-auto sm:max-h-[85vh] bg-[var(--slate-surface)] rounded-t-3xl sm:rounded-3xl border-t border-white/[0.08] sm:border shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-white/[0.08] p-5 z-10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <MessageSquare size={22} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-[var(--chrome-white)]">
                        Müşteri Yorumları
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)]">
                        {salon.stats.reviewCount} yorum • {salon.stats.averageRating} puan
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAllReviews(false)}
                    className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
                  >
                    <X size={18} className="text-[var(--muted-lead)]" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5" style={{ WebkitOverflowScrolling: 'touch' }}>
                <ReviewList salonId={salon.id} limit={100} />
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-gradient-to-t from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-white/[0.08] p-5 flex-shrink-0">
                <button
                  onClick={() => setShowAllReviews(false)}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-bold shadow-lg shadow-emerald-900/40 transition-all active:scale-[0.98]"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Location */}
      <section className="mt-10">
        <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-4">
          Konum
        </h2>
        <SalonMap
          coordinates={salon.address.coordinates}
          address={salon.address.full}
          salonName={salon.name}
        />
      </section>

      {/* Contact */}
      <section className="mt-10 mb-24 md:mb-8">
        <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-4">
          Iletisim
        </h2>
        <ObsidianCard hover={false} className="p-5 space-y-4">
          <a
            href={`tel:${salon.phone}`}
            className="flex items-center gap-3 p-3 rounded-full hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--liquid-chrome)]/10 flex items-center justify-center flex-shrink-0">
              <Phone size={18} className="text-[var(--liquid-chrome)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-medium text-sm text-[var(--chrome-white)]">Telefon</p>
              <p className="font-mono text-sm text-[var(--silver-frost)]">{salon.phone}</p>
            </div>
          </a>
          
          <div className="flex items-start gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-[var(--liquid-chrome)]/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-[var(--liquid-chrome)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-medium text-sm text-[var(--chrome-white)] mb-1">Adres</p>
              <p className="font-body text-sm text-[var(--silver-frost)] leading-relaxed">{salon.address.full}</p>
            </div>
          </div>
        </ObsidianCard>

        {/* Social Media */}
        {salon.socialMedia && (salon.socialMedia.instagram || salon.socialMedia.tiktok || salon.socialMedia.youtube) && (
          <div className="mt-4">
            <h3 className="font-heading font-semibold text-base sm:text-lg text-[var(--chrome-white)] mb-3">
              Sosyal Medya
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {salon.socialMedia.instagram && (
                <a
                  href={salon.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 liquid-glass-pill px-4 sm:px-5 py-3 font-heading font-medium text-sm text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Instagram size={16} className="sm:size-[18px] flex-shrink-0" />
                  <span>Instagram</span>
                </a>
              )}
              {salon.socialMedia.tiktok && (
                <a
                  href={salon.socialMedia.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 liquid-glass-pill px-4 sm:px-5 py-3 font-heading font-medium text-sm text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Music size={16} className="sm:size-[18px] flex-shrink-0" />
                  <span>TikTok</span>
                </a>
              )}
              {salon.socialMedia.youtube && (
                <a
                  href={salon.socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 liquid-glass-pill px-4 sm:px-5 py-3 font-heading font-medium text-sm text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Youtube size={16} className="sm:size-[18px] flex-shrink-0" />
                  <span>YouTube</span>
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Floating Book Button (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 md:hidden z-[100]">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a1f2e]/95 to-[#0f1419]/95 border border-white/[0.08] backdrop-blur-xl p-3 sm:p-4 shadow-2xl">
          <button 
            onClick={handleBook} 
            className="w-full h-12 sm:h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          >
            <Calendar size={18} className="sm:size-5" />
            <span>Randevu Al</span>
          </button>
        </div>
      </div>
    </div>
  );
}

