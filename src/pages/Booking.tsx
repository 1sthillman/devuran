import { useParams, Navigate, Link } from 'react-router-dom';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { BookingWizardRouter } from '@/components/booking/BookingWizardRouter';
import { useState, useEffect } from 'react';
import { salonsService, servicesService, staffService } from '@/services/firebaseService';
import type { Salon } from '@/types';
import { X } from 'lucide-react';

export function Booking() {
  const { salonId } = useParams();
  const { user } = useAuthStore();
  const { init } = useBookingStore();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (salonId) {
      loadSalon();
    }
  }, [salonId]);

  const loadSalon = async () => {
    try {
      const salonData = await salonsService.getById(salonId!);
      if (salonData) {
        // Load services and staff separately
        const [services, staff] = await Promise.all([
          servicesService.getBySalon(salonId!),
          staffService.getBySalon(salonId!)
        ]);
        
        // Merge services and staff into salon object
        const completeSalon = {
          ...salonData,
          services,
          staff
        };
        
        setSalon(completeSalon);
        init(salonId!, completeSalon);
      }
    } catch (error) {
      console.error('Salon yüklenemedi:', error);
    }
    setLoading(false);
  };

  if (!user) {
    return <Navigate to={`/login?redirect=/booking/${salonId}`} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted-lead)]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--chrome-white)] mb-2">
            Salon Bulunamadı
          </h2>
          <p className="text-[var(--muted-lead)]">İstediğiniz salon mevcut değil.</p>
        </div>
      </div>
    );
  }

  if (salon.isAcceptingBookings === false) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center p-4">
        <div className="max-w-md w-full obsidian-card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4">
            <X size={40} className="text-[var(--error)]" />
          </div>
          <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-3">
            Randevu Sistemi Kapalı
          </h2>
          <p className="font-body text-[var(--muted-lead)] mb-6">
            {salon.name} şu anda randevu kabul etmiyor. Lütfen daha sonra tekrar deneyin.
          </p>
          <Link to="/" className="chromatic-btn inline-flex items-center gap-2">
            <span>Anasayfaya Dön</span>
          </Link>
        </div>
      </div>
    );
  }

  return <BookingWizardRouter />;
}
