import { useParams, useNavigate } from 'react-router-dom';
import { StarRating } from '@/components/ui/StarRating';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { StaffCard } from '@/components/salon/StaffCard';
import { SalonMap } from '@/components/salon/SalonMap';
import { ReviewList } from '@/components/reviews/ReviewList';

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
import { motion } from 'framer-motion';
import { salonsService, servicesService, staffService } from '@/services/firebaseService';
import type { Salon, Service, Staff } from '@/types';

export function SalonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const init = useBookingStore((s) => s.init);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadSalonData();
    }
  }, [id]);

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <div className="flex items-center gap-3">
          <StarRating score={salon.stats.averageRating} size={20} />
          <span className="font-heading font-bold text-2xl text-[var(--chrome-white)]">
            {salon.stats.averageRating}
          </span>
          <span className="font-body text-sm text-[var(--muted-lead)]">
            ({salon.stats.reviewCount} yorum)
          </span>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleBook}
            className="chromatic-btn flex-1 h-12 text-sm"
          >
            <span>Randevu Al</span>
          </button>
          <a
            href={`https://wa.me/${salon.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass-pill flex items-center justify-center gap-2 px-6 h-12 font-heading font-medium text-sm text-[var(--silver-frost)]"
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <p className="font-body text-[15px] text-[var(--silver-frost)] leading-relaxed">
          {salon.description}
        </p>
      </motion.div>

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
                      <span className="block font-body text-[13px] text-[var(--muted-lead)]">{service.duration} dk</span>
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
          <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-4">
            Galeri
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                className="aspect-square rounded-3xl overflow-hidden obsidian-card cursor-pointer group relative hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <img
                  src={img}
                  loading="lazy"
                  alt={`${salon.name} galeri ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <ReviewList salonId={salon.id} limit={10} />
      </section>

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
            <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-3">
              Sosyal Medya
            </h3>
            <div className="flex flex-wrap gap-3">
              {salon.socialMedia.instagram && (
                <a
                  href={salon.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] liquid-glass-pill px-5 py-3 font-heading font-medium text-sm text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Instagram size={18} />
                  <span>Instagram</span>
                </a>
              )}
              {salon.socialMedia.tiktok && (
                <a
                  href={salon.socialMedia.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] liquid-glass-pill px-5 py-3 font-heading font-medium text-sm text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Music size={18} />
                  <span>TikTok</span>
                </a>
              )}
              {salon.socialMedia.youtube && (
                <a
                  href={salon.socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] liquid-glass-pill px-5 py-3 font-heading font-medium text-sm text-[var(--silver-frost)] hover:text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2"
                >
                  <Youtube size={18} />
                  <span>YouTube</span>
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Floating Book Button (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:hidden z-[100] bg-[var(--void)]/95 backdrop-blur-xl border-t border-[var(--obsidian-rim)]">
        <button onClick={handleBook} className="chromatic-btn w-full h-12 text-sm">
          <span>Randevu Al</span>
        </button>
      </div>
    </div>
  );
}

