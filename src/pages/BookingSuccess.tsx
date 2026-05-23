import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { salonsService } from '@/services/firebaseService';
import { PaymentInformation } from '@/components/booking/PaymentInformation';
import type { Reservation, Salon } from '@/types';
import { motion } from 'framer-motion';

export function BookingSuccess() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
    }
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      const data = await reservationService.getReservation(reservationId!);
      setReservation(data);
      
      // Load salon data for payment info
      if (data) {
        const salonData = await salonsService.getById(data.businessId);
        setSalon(salonData);
      }
    } catch (error) {
      console.error('Rezervasyon yüklenemedi:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--chrome-white)] mb-2">
            Rezervasyon Bulunamadı
          </h2>
          <p className="text-[var(--muted-lead)] mb-6">
            İstediğiniz rezervasyon mevcut değil.
          </p>
          <Link to="/" className="chromatic-btn inline-flex items-center gap-2">
            Anasayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const getReservationDetails = () => {
    switch (reservation.type) {
      case 'slot':
        return {
          title: 'Randevunuz Oluşturuldu',
          details: [
            { icon: Calendar, label: 'Tarih', value: reservation.date },
            { icon: Clock, label: 'Saat', value: `${reservation.startTime} - ${reservation.endTime}` },
            { icon: Phone, label: 'Telefon', value: reservation.userPhone }
          ]
        };
      case 'daily':
        return {
          title: 'Rezervasyonunuz Oluşturuldu',
          details: [
            { icon: Calendar, label: 'Tarih', value: reservation.eventDate },
            { icon: MapPin, label: 'Mekan', value: reservation.businessName },
            { icon: Phone, label: 'Telefon', value: reservation.userPhone }
          ]
        };
      case 'nightly':
        return {
          title: 'Rezervasyonunuz Oluşturuldu',
          details: [
            { icon: Calendar, label: 'Giriş', value: reservation.checkIn },
            { icon: Calendar, label: 'Çıkış', value: reservation.checkOut },
            { icon: Phone, label: 'Telefon', value: reservation.userPhone }
          ]
        };
      case 'project':
        return {
          title: 'Rezervasyonunuz Oluşturuldu',
          details: [
            { icon: Calendar, label: 'Etkinlik Tarihi', value: reservation.eventDate },
            { icon: MapPin, label: 'Organizatör', value: reservation.businessName },
            { icon: Phone, label: 'Telefon', value: reservation.userPhone }
          ]
        };
      case 'order':
        return {
          title: 'Siparişiniz Oluşturuldu',
          details: [
            { icon: Calendar, label: 'Teslimat Tarihi', value: reservation.deliveryDate },
            { icon: Clock, label: 'Teslimat Saati', value: reservation.deliveryTime },
            { icon: MapPin, label: 'Adres', value: reservation.deliveryAddress }
          ]
        };
    }
  };

  const info = getReservationDetails();

  return (
    <div className="min-h-screen bg-[var(--void)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="obsidian-card p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 size={48} className="text-[var(--success)]" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="font-display font-bold text-3xl text-[var(--chrome-white)] mb-2">
              {info.title}
            </h1>
            <p className="text-[var(--muted-lead)] mb-8">
              Rezervasyon No: <span className="font-mono text-[var(--liquid-chrome)]">#{reservation.id.slice(0, 8).toUpperCase()}</span>
            </p>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--slate-surface)] rounded-2xl p-6 mb-6 text-left"
          >
            <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
              Rezervasyon Detayları
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-lead)]">İşletme</span>
                <span className="font-heading font-semibold text-[var(--chrome-white)]">
                  {reservation.businessName}
                </span>
              </div>
              {info.details.map((detail, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[var(--muted-lead)]">
                    <detail.icon size={16} />
                    {detail.label}
                  </span>
                  <span className="font-heading font-semibold text-[var(--chrome-white)]">
                    {detail.value}
                  </span>
                </div>
              ))}
              <div className="border-t border-[var(--obsidian-rim)] pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-[var(--chrome-white)]">Toplam Tutar</span>
                  <span className="font-mono text-2xl font-bold text-[var(--liquid-chrome)]">
                    {reservation.pricing?.totalAmount ? reservation.pricing.totalAmount.toLocaleString('tr-TR') : '0'} ₺
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6"
          >
            <p className="text-sm text-blue-400 font-heading font-medium">
              {reservation.status === 'pending' && 'Rezervasyonunuz işletme tarafından onaylanacaktır'}
              {reservation.status === 'confirmed' && 'Rezervasyonunuz onaylandı'}
            </p>
          </motion.div>

          {/* Payment Information - Removed */}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              to="/appointments"
              className="flex-1 h-12 rounded-full bg-[var(--liquid-chrome)] hover:bg-[var(--liquid-chrome)]/90 text-[var(--void)] font-heading font-bold transition-all flex items-center justify-center gap-2"
            >
              Rezervasyonlarım
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/"
              className="flex-1 h-12 rounded-full bg-white/5 hover:bg-white/10 text-[var(--chrome-white)] font-heading font-semibold transition-all flex items-center justify-center"
            >
              Anasayfa
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
