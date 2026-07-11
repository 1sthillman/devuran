/**
 * İŞLETME TERMİNOLOJİSİ HOOK
 * Capabilities'den dinamik kelime türetimi
 */

import { useMemo } from 'react';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import { getBookingTerminology } from '@/utils/bookingTypeResolver';

export function useBusinessTerminology(capabilities?: BusinessCapabilities) {
  return useMemo(() => {
    return getBookingTerminology(capabilities);
  }, [capabilities]);
}
