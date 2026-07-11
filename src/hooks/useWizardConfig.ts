/**
 * ============================================================================
 * WIZARD KONFIGÜRASYON HOOK
 * ============================================================================
 * 
 * Her wizard için capabilities'den türetilen dinamik konfigürasyon
 */

import { useMemo } from 'react';
import type { Salon } from '@/types';
import { determineBookingType, getBookingTerminology, getDashboardModules } from '@/utils/bookingTypeResolver';
import { isSalonTableBased, isSalonStaffBased, getServiceStepTitle } from '@/utils/businessHelpers';

export function useWizardConfig(salon: Salon | null) {
  return useMemo(() => {
    if (!salon) {
      return {
        // Varsayılanlar
        bookingType: 'slot' as const,
        terminology: {
          singular: 'Randevu',
          plural: 'Randevular',
          action: 'Randevu Al',
          unit: 'saat'
        },
        hasStaff: true,
        hasTables: false,
        hasQueue: false,
        autoConfirm: true,
        requiresDeposit: false,
        serviceStepTitle: 'Hizmet Seçimi',
        isTableBased: false,
        isStaffBased: true,
        tableTerminology: 'Masa'
      };
    }

    const anySalon = salon as any;
    const capabilities = anySalon.capabilities;

    // Booking type bilgisi
    const bookingInfo = capabilities 
      ? determineBookingType(capabilities)
      : { 
          primary: 'slot' as const, 
          hasQueue: false, 
          requiresStaff: true, 
          requiresTables: false 
        };

    // Terminoloji
    const terminology = getBookingTerminology(capabilities);

    // Dashboard modules
    const modules = getDashboardModules(capabilities);

    // Helper'lar
    const isTableBased = isSalonTableBased(salon);
    const isStaffBased = isSalonStaffBased(salon);
    const serviceStepTitle = getServiceStepTitle(salon);

    return {
      bookingType: bookingInfo.primary,
      terminology,
      hasStaff: capabilities?.hasStaff ?? true,
      hasTables: capabilities?.hasTables ?? false,
      hasQueue: bookingInfo.hasQueue,
      autoConfirm: capabilities?.autoConfirmDefault ?? true,
      requiresDeposit: capabilities?.requiresDeposit ?? false,
      serviceStepTitle,
      isTableBased,
      isStaffBased,
      tableTerminology: capabilities?.tableTerminology || 'Masa',
      // Ek bilgiler
      isMobileService: capabilities?.isMobileService ?? false,
      hasDelivery: capabilities?.hasDelivery ?? false,
      isDurationBased: capabilities?.isDurationBased ?? true,
      isDateRangeBased: capabilities?.isDateRangeBased ?? false,
      modules
    };
  }, [salon]);
}
