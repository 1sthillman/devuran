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
import { useThemeStore } from '@/store/themeStore';
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
  const { actualTheme } = useThemeStore();
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
    }
  }, [id]);

  const loadSalonData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      let salonData: Salon | null = null;
      
      // Önce tüm salonları al ve slug ile ara (daha güvenilir)
      const allSalons = await salonsService.getAll();
      
      // Önce slug ile dene
      salonData = allSalons.find(s => s.slug === id) || null;
      
      // Slug ile bulunamadıysa, ID ile dene
      if (!salonData) {
        salonData = allSalons.find(s => s.id === id) || null;
      }
      
      if (!salonData) {
        console.error('Salon bulunamadı:', id);
        setLoading(false);
        return;
      }
      
      const [servicesData, staffData] = await Promise.all([
        servicesService.getBySalon(salonData.id),
        staffService.getBySalon(salonData.id),
      ]);
      
      // 🍽️ RESTORAN İÇİN: Salon.services array'inden de hizmetleri al
      let allServices = [...servicesData];
      if (salonData.services && Array.isArray(salonData.services) && salonData.services.length > 0) {
        // Salon array'indeki hizmetleri ekle (masa rezervasyonları için)
        const salonServices = salonData.services.filter((s: any) => s.isActive !== false);
        allServices = [...allServices, ...salonServices];
        
        // Duplicate kontrolü (aynı ID'ye sahip hizmetler varsa bir tane al)
        const uniqueServices = allServices.reduce((acc: Service[], curr: Service) => {
          if (!acc.find(s => s.id === curr.id)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        allServices = uniqueServices;
        
        console.log(`🍽️ Salon services array'inden ${salonServices.length} hizmet eklendi`);
      }
      
      setSalon(salonData);
      setServices(allServices);
      setStaff(staffData);
      
      // ✅ Salon belgesindeki subscriptionActive alanını kontrol et (subscriptions koleksyonunu okumaya gerek yok)
      if (salonData) {
        const hasActiveSubscription = salonData.subscriptionActive === true;
        const isPending = salonData.subscriptionPendingApproval === true;
        
        setSubscriptionStatus({
          hasActiveSubscription,
          isExpired: !hasActiveSubscription && !isPending,
          isPending,
          daysRemaining: 0, // Salon belgesinde süre bilgisi yok, önemli değil
        });
      }

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
    // ✅ Abonelik kontrolü - Aktif abonelik yoksa randevu alınamaz
    if (!subscriptionStatus?.hasActiveSubscription) {
      if (subscriptionStatus?.isPending) {
        addToast('Bu işletme abonelik onayı bekliyor. Şu anda randevu alınamaz.', 'warning');
      } else if (subscriptionStatus?.isExpired) {
        addToast('Bu işletmenin aboneliği sona ermiş. Randevu alınamaz.', 'error');
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
    <div 
      className="w-full pb-8 pt-6 relative"
    >
      {/* 🎨 Animated Background - Bokeh Effect (Sadece Aydınlık Mod) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden dark:hidden">
        <img
          src="/asset/Kaliteyi_bozmadan_loop_olmasn_istiyorum_kar.gif"
          alt=""
          className="w-full h-full object-cover blur-[20px] scale-105 opacity-[0.15]"
          loading="lazy"
          decoding="async"
          style={{
            imageRendering: 'auto',
            willChange: 'auto',
          }}
        />
      </div>
      
      {/* Contrast Overlay - Çok hafif */}
      <div className="fixed inset-0 bg-white/40 dark:hidden pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10">
      {/* Hero Image - Kompakt ve Modern */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[200px] md:h-[240px] lg:h-[280px] max-w-5xl mx-auto rounded-2xl overflow-hidden mb-6 px-4 sm:px-6 md:px-8"
      >
        <div className="relative h-full w-full rounded-2xl overflow-hidden">
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
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          <span className="liquid-glass-pill px-2.5 py-1 text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--chrome-white)]">
            {categoryLabels[salon.category]}
          </span>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--chrome-white)] mt-2">
            {salon.name}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <MapPin size={13} className="text-[var(--muted-lead)]" />
            <span className="font-body text-xs text-[var(--muted-lead)]">
              {salon.address.district}, {salon.address.city}
            </span>
          </div>
        </div>
        </div>
      </motion.div>

      {/* Rating & Actions - Kompakt Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sol Kolon - Rating ve Açıklama */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <StarRating score={salon.stats.averageRating} size={18} />
            <span className="font-heading font-bold text-xl text-black dark:text-[var(--chrome-white)]">
              {salon.stats.averageRating}
            </span>
            <span className="font-body text-sm text-gray-600 dark:text-[var(--muted-lead)]">
              ({salon.stats.reviewCount} yorum)
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="font-body text-[14px] text-[var(--silver-frost)] leading-relaxed">
              {salon.description}
            </p>
          </div>
        </div>

        {/* Sağ Kolon - Kompakt Randevu Kartı (Sticky) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {/* Kompakt Randevu Kartı */}
          <div className="p-4 rounded-2xl obsidian-card border border-[var(--obsidian-rim)]">
          {/* Abonelik Uyarısı */}
          {subscriptionStatus && !subscriptionStatus.hasActiveSubscription && (
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-bold text-xs text-red-400 mb-0.5">
                    {subscriptionStatus.isPending ? 'İşletme Onay Bekliyor' : 'İşletme Kapalı'}
                  </h4>
                  <p className="font-body text-[11px] text-red-300/80 leading-relaxed">
                    {subscriptionStatus.isPending 
                      ? 'Bu işletme abonelik onayı bekliyor. Şu anda randevu alınamaz.'
                      : 'Bu işletme şu anda randevu kabul etmemektedir. Lütfen daha sonra tekrar deneyin.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              'w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0',
              subscriptionStatus?.hasActiveSubscription
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
                : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-500/30'
            )}>
              <Calendar size={20} className={subscriptionStatus?.hasActiveSubscription ? 'text-emerald-400' : 'text-gray-400'} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-0.5">
                {salon.category === 'restoran' ? 'Masa Rezervasyonu' : 'Randevu Oluştur'}
              </h3>
              <p className="font-body text-[11px] text-[var(--muted-lead)] leading-relaxed">
                {subscriptionStatus?.hasActiveSubscription 
                  ? (salon.category === 'restoran' ? 'Müsait masaları görüntüleyin' : 'Müsait saatleri görüntüleyin')
                  : 'Randevu alınamaz'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2.5">
            <button
              onClick={handleBook}
              disabled={!subscriptionStatus?.hasActiveSubscription}
              className={cn(
                'flex-1 h-11 rounded-full font-heading font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2',
                subscriptionStatus?.hasActiveSubscription
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] cursor-pointer'
                  : 'bg-gray-500/20 text-gray-500 cursor-not-allowed opacity-50'
              )}
            >
              <Calendar size={16} strokeWidth={2.5} />
              <span>
                {subscriptionStatus?.hasActiveSubscription 
                  ? (salon.category === 'restoran' ? 'Rezervasyon Al' : 'Randevu Al')
                  : 'Kapalı'}
              </span>
            </button>
            <a
              href={`https://wa.me/${salon.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-[var(--obsidian-rim)] hover:border-emerald-500/30 text-[var(--chrome-white)] transition-all active:scale-[0.98] flex items-center justify-center"
            >
              <MessageCircle size={16} strokeWidth={2.5} />
            </a>
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* Services - Kompakt Container */}
      <section className="mt-8 max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="font-display font-bold text-xl text-[var(--chrome-white)] mb-3">
          Hizmetler
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {Object.entries(servicesByCategory).map(([category, services]) => (
          <ObsidianCard key={category} hover={false} className="overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <span className="font-heading font-semibold text-sm text-white">
                {category}
              </span>
              {expandedCategories[category] ? (
                <ChevronUp size={16} className="text-white/70" />
              ) : (
                <ChevronDown size={16} className="text-white/70" />
              )}
            </button>
            {expandedCategories[category] && (
              <div className="pb-1">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between px-3 py-2.5 border-t border-[var(--obsidian-rim)]">
                    <div>
                      <span className="font-body text-[14px] text-white">{service.name}</span>
                      {/* Sadece slot-based kategorilerde dakika göster */}
                      {['kuafor', 'berber', 'guzellik', 'tirnak', 'fotograf', 'video-produksiyon', 'drone-cekim'].includes(salon.category) && (
                        <span className="block font-body text-[12px] text-white/70">{service.duration} dk</span>
                      )}
                    </div>
                    <span className="font-mono font-medium text-sm text-white">{service.price} TL</span>
                  </div>
                ))}
              </div>
            )}
          </ObsidianCard>
        ))}
        </div>
      </section>

      {/* Staff - Kompakt Container */}
      <section className="mt-8 max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="font-display font-bold text-xl text-[var(--chrome-white)] mb-3">
          Ekibimiz
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {staff.map((member) => (
            <StaffCard key={member.id} staff={member} variant="compact" />
          ))}
        </div>
      </section>

      {/* Gallery - Kompakt Container */}
      {salon.galleryImages && salon.galleryImages.length > 0 && (
        <section className="mt-8 max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="font-display font-bold text-xl text-[var(--chrome-white)] mb-3">
            Galeri
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
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
                className="aspect-[4/3] rounded-xl overflow-hidden obsidian-card cursor-pointer group relative hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <img
                  src={img}
                  loading="lazy"
                  alt={`${salon.name} galeri ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Reviews - Kompakt Container */}
      <section className="mt-8 max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-xl text-[var(--chrome-white)]">
            Musteri Yorumlari
          </h2>
          <span className="liquid-glass-pill px-2.5 py-0.5 font-mono text-sm text-[var(--silver-frost)]">
            {salon.stats.averageRating}
          </span>
        </div>
        <ReviewList salonId={salon.id} limit={2} />
        
        {salon.stats.reviewCount > 2 && (
          <button
            onClick={() => setShowAllReviews(true)}
            className="w-full mt-3 h-11 rounded-full bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] hover:from-[#1f2535] hover:to-[#141a24] border border-emerald-900/20 hover:border-emerald-500/30 text-[var(--chrome-white)] font-heading font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <MessageSquare size={16} />
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

      {/* Location - Kompakt Container */}
      <section className="mt-8 max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="font-display font-bold text-xl text-[var(--chrome-white)] mb-3">
          Konum
        </h2>
        <SalonMap
          coordinates={salon.address.coordinates}
          address={salon.address.full}
          salonName={salon.name}
        />
      </section>

      {/* Contact */}
      <section className="mt-8 mb-24 md:mb-8 max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="font-display font-bold text-xl text-white mb-3">
          Iletisim
        </h2>
        <ObsidianCard hover={false} className="p-4 space-y-3 bg-white dark:bg-[var(--slate-surface)]">
          <a
            href={`tel:${salon.phone}`}
            className="flex items-center gap-3 p-2.5 rounded-full hover:bg-white/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--liquid-chrome)]/10 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-[var(--liquid-chrome)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-medium text-xs text-white">Telefon</p>
              <p className="font-mono text-sm text-white/80">{salon.phone}</p>
            </div>
          </a>
          
          <div className="flex items-start gap-3 p-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--liquid-chrome)]/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-[var(--liquid-chrome)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-medium text-xs text-white mb-0.5">Adres</p>
              <p className="font-body text-sm text-white/80 leading-relaxed">{salon.address.full}</p>
            </div>
          </div>
        </ObsidianCard>

        {/* Social Media */}
        {salon.socialMedia && (salon.socialMedia.instagram || salon.socialMedia.tiktok || salon.socialMedia.youtube) && (
          <div className="mt-3">
            <h3 className="font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2.5">
              Sosyal Medya
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              {salon.socialMedia.instagram && (
                <a
                  href={salon.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 liquid-glass-pill px-4 py-2.5 font-heading font-medium text-xs text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Instagram size={15} className="flex-shrink-0" />
                  <span>Instagram</span>
                </a>
              )}
              {salon.socialMedia.tiktok && (
                <a
                  href={salon.socialMedia.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 liquid-glass-pill px-4 py-2.5 font-heading font-medium text-xs text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Music size={15} className="flex-shrink-0" />
                  <span>TikTok</span>
                </a>
              )}
              {salon.socialMedia.youtube && (
                <a
                  href={salon.socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 liquid-glass-pill px-4 py-2.5 font-heading font-medium text-xs text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Youtube size={15} className="flex-shrink-0" />
                  <span>YouTube</span>
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Floating Book Button (Mobile) - Güvenli ve Performanslı */}
      <div className="fixed bottom-0 left-0 right-0 p-3 md:hidden z-[100] pointer-events-none">
        <div className="pointer-events-auto rounded-2xl bg-gradient-to-br from-[#1a1f2e]/98 to-[#0f1419]/98 border border-white/[0.08] backdrop-blur-xl p-3 shadow-2xl">
          <button 
            onClick={handleBook} 
            disabled={!subscriptionStatus?.hasActiveSubscription}
            className={cn(
              'w-full h-12 rounded-full font-heading font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2',
              subscriptionStatus?.hasActiveSubscription
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 active:from-emerald-400 active:to-teal-400 text-white shadow-emerald-900/40 active:scale-[0.97]'
                : 'bg-gray-500/20 text-gray-500 cursor-not-allowed opacity-50'
            )}
          >
            <Calendar size={18} />
            <span>
              {subscriptionStatus?.hasActiveSubscription 
                ? (salon.category === 'restoran' ? 'Rezervasyon Al' : 'Randevu Al')
                : 'Kapalı'}
            </span>
          </button>
        </div>
      </div>
      </div> {/* Content wrapper kapanışı */}
    </div>
  );
}

