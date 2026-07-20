import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { salonsService, servicesService } from '@/services/firebaseService';
import { storageService } from '@/services/storageService';
import { useUIStore } from '@/store/uiStore';
import type { Salon, Service } from '@/types';

export function useServiceManagement(salon: Salon, onRefresh: () => Promise<void>) {
  const { addToast } = useUIStore();

  const handleSave = useCallback(async (serviceData: Omit<Service, 'id'>) => {
    try {
      if ((serviceData as any).tableId) {
        const newService = { ...serviceData, id: nanoid(12), salonId: salon.id };
        await salonsService.update(salon.id, { 
          services: [...(salon.services || []), newService] 
        });
      } else {
        await servicesService.create(serviceData);
      }
      await onRefresh();
      addToast('Hizmet kaydedildi', 'success');
    } catch (error: any) {
      addToast(error?.message || 'Hata oluştu', 'error');
      throw error;
    }
  }, [salon, onRefresh, addToast]);

  const handleDelete = useCallback(async (serviceId: string) => {
    try {
      const service = salon.services?.find(s => s.id === serviceId);
      
      // R2'den görsel sil
      if (service?.image && !service.image.startsWith('data:')) {
        try {
          const url = new URL(service.image);
          await storageService.deleteFile(url.pathname.substring(1), 'r2');
        } catch {}
      }
      
      if (service && (service as any).tableId) {
        await salonsService.update(salon.id, { 
          services: (salon.services || []).filter(s => s.id !== serviceId) 
        });
      } else {
        await servicesService.delete(serviceId);
      }
      
      await onRefresh();
      addToast('Hizmet silindi', 'success');
    } catch (error: any) {
      addToast(error?.message || 'Hata oluştu', 'error');
      throw error;
    }
  }, [salon, onRefresh, addToast]);

  return { handleSave, handleDelete };
}
