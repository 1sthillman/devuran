import { useCallback } from 'react';
import { staffService } from '@/services/firebaseService';
import { storageService } from '@/services/storageService';
import { useUIStore } from '@/store/uiStore';
import type { Staff } from '@/types';

export function useStaffManagement(onRefresh: () => Promise<void>) {
  const { addToast } = useUIStore();

  const handleSave = useCallback(async (staffData: Omit<Staff, 'id'>) => {
    try {
      await staffService.create(staffData);
      await onRefresh();
      addToast('Personel kaydedildi', 'success');
    } catch (error: any) {
      addToast(error?.message || 'Hata oluştu', 'error');
      throw error;
    }
  }, [onRefresh, addToast]);

  const handleDelete = useCallback(async (staffId: string, staff: Staff[]) => {
    const member = staff.find(s => s.id === staffId);
    if (!confirm(`"${member?.name}" silinecek, emin misiniz?`)) return;
    
    try {
      // R2'den fotoğrafları sil
      if (member?.photo && !member.photo.includes('ui-avatars')) {
        try {
          const url = new URL(member.photo);
          await storageService.deleteFile(url.pathname.substring(1), 'r2');
        } catch {}
      }
      
      await staffService.delete(staffId);
      await onRefresh();
      addToast('Personel silindi', 'success');
    } catch (error: any) {
      addToast(error?.message || 'Hata oluştu', 'error');
      throw error;
    }
  }, [onRefresh, addToast]);

  return { handleSave, handleDelete };
}
