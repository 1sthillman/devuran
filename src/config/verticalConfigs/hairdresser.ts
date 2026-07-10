/**
 * Hairdresser Vertical Configuration
 * Kuaför/Berber işletmeleri için wizard akışı
 */

import type { VerticalConfig } from '@/types/wizard';

export const hairdresserConfig: VerticalConfig = {
  id: 'hairdresser_v1',
  businessType: 'hairdresser',
  name: 'Kuaför Rezervasyon Sihirbazı',
  description: 'Kuaför ve berber işletmeleri için optimize edilmiş rezervasyon akışı',
  version: 1,
  
  steps: [
    // Step 1: Hizmet Seçimi
    {
      id: 'service_selection',
      type: 'ServiceSelection',
      title: 'Hangi hizmetleri almak istersiniz?',
      description: 'Birden fazla hizmet seçebilirsiniz',
      isOptional: false,
      order: 1,
      config: {
        allowMultiple: true,
        showPricing: true,
        showDuration: true,
        groupByCategory: true,
        categoryFilter: [], // Tüm kategoriler
      },
    },

    // Step 2: Personel Seçimi (Opsiyonel)
    {
      id: 'staff_selection',
      type: 'StaffSelection',
      title: 'Tercih ettiğiniz uzman var mı?',
      description: 'Farketmez seçeneği ile ilk müsait uzmanla randevu alabilirsiniz',
      isOptional: true,
      order: 2,
      config: {
        isRequired: false,
        filterByService: true,
        showAvailability: true,
        allowAnyStaff: true, // "Farketmez" seçeneği
      },
    },

    // Step 3: Tarih & Saat (TODO - sonraki primitive)
    // {
    //   id: 'datetime_selection',
    //   type: 'DateTimeSlot',
    //   title: 'Ne zaman gelmek istersiniz?',
    //   isOptional: false,
    //   order: 3,
    //   config: {
    //     slotDuration: 30, // Otomatik hesaplanacak
    //     slotInterval: 15,
    //     advanceBookingDays: 30,
    //     minAdvanceHours: 2,
    //     showStaffAvailability: true,
    //     allowSmartSuggestion: true,
    //   },
    // },

    // Step 4: Müşteri Bilgileri (TODO - primitive)
    // Step 5: Özet & Onay (TODO - primitive)
  ],

  pricingRules: [
    {
      id: 'base_pricing',
      name: 'Temel Fiyatlandırma',
      type: 'base',
      calculation: {
        formula: 'sum(selectedServices.price)',
        variables: {},
      },
    },
  ],

  availabilityRules: [
    {
      id: 'working_hours',
      name: 'Çalışma Saatleri',
      type: 'time_based',
      conditions: [
        {
          field: 'dayOfWeek',
          operator: 'in',
          value: [1, 2, 3, 4, 5, 6], // Pzt-Cmt
        },
      ],
      action: 'block',
    },
  ],

  settings: {
    autoConfirm: true, // Kuaför için otomatik onay
    requireDeposit: false,
    allowCancellation: true,
    cancellationHours: 2,
    reminderSchedule: [
      {
        hours: 24,
        message: 'Yarın randevunuz var, unutmayın! 🎉',
      },
      {
        hours: 2,
        message: '2 saat sonra randevunuz başlıyor! 💇',
      },
    ],
    notificationSettings: {
      email: true,
      sms: true,
      whatsapp: true,
    },
  },

  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
};
