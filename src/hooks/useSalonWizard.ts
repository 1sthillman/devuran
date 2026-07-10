import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salonsService } from '@/services/firebaseService';
import { authService } from '@/services/authService';
import type { Salon } from '@/types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

/**
 * Custom hook for managing salon wizard state and operations
 * Prevents duplicate wizard modals and centralizes logic
 */
export function useSalonWizard() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Salon | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Open wizard for creating new salon
   */
  const openCreateWizard = () => {
    setEditingSalon(undefined);
    setShowWizard(true);
  };

  /**
   * Open wizard for editing existing salon
   */
  const openEditWizard = (salon: Salon) => {
    setEditingSalon(salon);
    setShowWizard(true);
  };

  /**
   * Close wizard
   */
  const closeWizard = () => {
    setShowWizard(false);
    setEditingSalon(undefined);
  };

  /**
   * Fire confetti celebration
   */
  const celebrateSuccess = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  /**
   * Save salon (create or update)
   */
  const handleSave = async (
    salonData: Omit<Salon, 'id' | 'stats' | 'isPremium' | 'isActive' | 'isAcceptingBookings'>,
    userId: string,
    onSuccess?: (salon: Salon) => void
  ) => {
    setIsLoading(true);

    try {
      if (editingSalon) {
        // Edit mode - update existing salon
        await salonsService.update(editingSalon.id, salonData);
        toast.success('İşletme güncellendi!');
        closeWizard();
        if (onSuccess) onSuccess(editingSalon);
      } else {
        // Create mode - create new salon
        const newSalon = await salonsService.create({
          ...salonData,
          stats: {
            averageRating: 0,
            reviewCount: 0,
            totalAppointments: 0,
          },
          isPremium: false,
          isActive: true,
          isAcceptingBookings: true,
        });

        // Update user with salonId
        await authService.updateUserProfile(userId, { salonId: newSalon.id });

        // Celebrate!
        celebrateSuccess();
        toast.success('🎉 İşletmeniz başarıyla oluşturuldu!');

        // Close wizard and redirect after 2 seconds
        closeWizard();
        setTimeout(() => {
          navigate('/dashboard?tab=overview');
        }, 2000);
        
        if (onSuccess) onSuccess(newSalon);
      }
    } catch (error) {
      console.error('Error saving salon:', error);
      toast.error('İşletme kaydedilemedi: ' + (error as any).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showWizard,
    editingSalon,
    isLoading,
    openCreateWizard,
    openEditWizard,
    closeWizard,
    handleSave,
  };
}
