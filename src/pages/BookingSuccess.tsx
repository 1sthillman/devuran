import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, MapPin, Phone, Mail, ArrowRight, Sparkles, Home } from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { salonsService } from '@/services/firebaseService';
import { PaymentInformation } from '@/components/booking/PaymentInformation';
import type { Reservation, Salon } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function BookingSuccess() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Otomatik yukarı scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
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
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-2">
              Rezervasyon Bulunamadı
            </h2>
            <p className="text-[var(--muted-lead)] mb-6">
              İstediğiniz rezervasyon mevcut değil.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 hover:shadow-2xl hover:shadow-purple-500/40 text-white font-heading font-bold transition-all duration-200 active:scale-[0.98]"
            >
              <Home size={18} />
              Anasayfaya Dön
            </Link>
          </div>
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
    <div className="min-h-screen bg-[var(--void)] flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Success Icon with Gradient Background */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/50">
            <CheckCircle2 size={48} className="text-white" strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6"
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
          
          {/* Header */}
          <div className="relative z-10 text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-3">
              <Sparkles size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Başarılı</span>
            </div>
            <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent mb-2">
              {info.title}
            </h1>
            <p className="text-sm text-[var(--muted-lead)]">
              Rezervasyon No: <span className="font-mono text-emerald-400 font-semibold">#{reservation.id.slice(0, 8).toUpperCase()}</span>
            </p>
          </div>

          {/* Details Card */}
          <div className="relative z-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 mb-4">
            <h3 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              Rezervasyon Detayları
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <span className="text-sm text-[var(--muted-lead)]">İşletme</span>
                <span className="font-heading font-semibold text-[var(--chrome-white)]">
                  {reservation.businessName}
                </span>
              </div>
              {info.details.map((detail, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                  <span className="flex items-center gap-2 text-sm text-[var(--muted-lead)]">
                    <detail.icon size={16} className="text-purple-400" />
                    {detail.label}
                  </span>
                  <span className="font-heading font-semibold text-[var(--chrome-white)]">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="relative z-10 rounded-2xl p-5 mb-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-fuchsia-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="font-heading font-semibold text-[var(--chrome-white)]">Toplam Tutar</span>
              <span className="font-mono text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                {reservation.pricing?.totalAmount ? reservation.pricing.totalAmount.toLocaleString('tr-TR') : '0'} ₺
              </span>
            </div>
          </div>

          {/* 🆕 Kapora Bilgisi ve Ödeme */}
          {/* ✅ IBAN kontrolü: Hem bankTransfer aktif olmalı HEM de geçerli IBAN içeren hesap olmalı */}
          {salon?.paymentSettings?.bankTransferEnabled && 
           salon.paymentSettings.bankAccounts && 
           salon.paymentSettings.bankAccounts.length > 0 &&
           salon.paymentSettings.bankAccounts.some(acc => acc.iban && acc.iban.trim().length > 0) && (
            <div className="relative z-10 mb-4">
              <PaymentInformation
                bankAccounts={salon.paymentSettings.bankAccounts.filter(acc => acc.iban && acc.iban.trim().length > 0)}
                paymentInstructions={salon.paymentSettings.paymentInstructions}
                totalAmount={reservation.pricing?.totalAmount || 0}
                reservationId={reservation.id}
                depositRequired={reservation.pricing?.depositRequired}
                depositAmount={reservation.pricing?.depositAmount}
                remainingAmount={reservation.pricing?.finalAmount}
              />
            </div>
          )}

          {/* Status Badge */}
          <div className={cn(
            "relative z-10 rounded-3xl p-4 mb-6 border",
            reservation.status === 'confirmed' 
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-blue-500/10 border-blue-500/30"
          )}>
            <p className={cn(
              "text-sm font-heading font-medium text-center",
              reservation.status === 'confirmed' ? "text-emerald-400" : "text-blue-400"
            )}>
              {reservation.status === 'pending' && 'Rezervasyonunuz işletme tarafından onaylanacaktır'}
              {reservation.status === 'confirmed' && 'Rezervasyonunuz onaylandı'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col gap-3">
            <button
              onClick={() => navigate('/appointments')}
              className="h-12 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 hover:shadow-2xl hover:shadow-purple-500/40 text-white font-heading font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Rezervasyonlarım
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/')}
              className="h-12 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-[var(--chrome-white)] font-heading font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Home size={18} />
              Anasayfa
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
