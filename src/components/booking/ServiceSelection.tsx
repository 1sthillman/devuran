/**
 * Service Selection Component
 * 
 * Grid of service cards for user to choose from
 */

import React from 'react';
import { Service } from '@/types/booking.types';

interface ServiceSelectionProps {
  services: Service[];
  onServiceSelected: (service: Service) => void;
}

export const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  services,
  onServiceSelected,
}) => {
  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Şu anda aktif hizmet bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Hizmet Seçin</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <ServiceCard
            key={service.serviceId}
            service={service}
            onSelect={() => onServiceSelected(service)}
          />
        ))}
      </div>
    </div>
  );
};

// Service Card Component
const ServiceCard: React.FC<{
  service: Service;
  onSelect: () => void;
}> = ({ service, onSelect }) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours} saat ${mins} dk`;
    } else if (hours > 0) {
      return `${hours} saat`;
    } else {
      return `${mins} dakika`;
    }
  };

  return (
    <button
      onClick={onSelect}
      className="bg-white rounded-lg border-2 border-gray-200 p-6 text-left transition-all hover:border-blue-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {/* Service Image */}
      {service.imageUrl && (
        <img
          src={service.imageUrl}
          alt={service.name}
          className="w-full h-32 object-cover rounded-lg mb-4"
        />
      )}

      {/* Service Name */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {service.name}
      </h3>

      {/* Service Description */}
      {service.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Service Details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {/* Duration */}
          <div className="flex items-center gap-1 text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatDuration(service.duration)}</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-lg font-bold text-blue-600">
          {formatPrice(service.price, service.currency)}
        </div>
      </div>

      {/* Category Badge */}
      {service.category && (
        <div className="mt-3">
          <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
            {service.category}
          </span>
        </div>
      )}
    </button>
  );
};
