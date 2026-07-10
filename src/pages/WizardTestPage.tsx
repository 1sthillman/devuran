/**
 * Wizard Engine Test Page
 * Yeni wizard sistemini mevcut sistemi bozmadan test etmek için
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WizardEngine } from '@/components/wizard/WizardEngine';
import { hairdresserConfig } from '@/config/verticalConfigs/hairdresser';
import { salonsService } from '@/services/firebaseService';
import type { Salon } from '@/types';
import type { WizardState } from '@/types/wizard';
import { Loader2 } from 'lucide-react';

export default function WizardTestPage() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSalon();
  }, [salonId]);

  const loadSalon = async () => {
    if (!salonId) {
      setError('Salon ID bulunamadı');
      setLoading(false);
      return;
    }

    try {
      const data = await salonsService.getById(salonId);
      if (!data) {
        setError('Salon bulunamadı');
      } else {
        setSalon(data);
      }
    } catch (err) {
      console.error('Error loading salon:', err);
      setError('Salon yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (wizardState: WizardState) => {
    console.log('🎉 Wizard completed!', wizardState);
    
    // TODO: Create reservation in Firestore
    alert('Wizard tamamlandı! Console\'a bakın.');
    
    // Redirect to success page
    // navigate(`/booking/success?id=${reservationId}`);
  };

  const handleCancel = () => {
    if (confirm('Rezervasyonu iptal etmek istediğinize emin misiniz?')) {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Hata</h2>
          <p className="text-[var(--muted-lead)]">{error || 'Salon bulunamadı'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-[var(--primary)] text-white rounded-lg"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Test Banner */}
      <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-center text-sm">
        <strong>🧪 TEST MODE:</strong> Yeni Wizard Engine v2.0 - Mevcut sistem etkilenmez
      </div>

      <WizardEngine
        config={hairdresserConfig}
        salon={salon}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </>
  );
}
