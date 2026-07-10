/**
 * Customer Information Form Component
 */

import React, { useState } from 'react';
import { CustomerInfo } from '@/types/booking.types';

interface CustomerInfoFormProps {
  onSubmit: (customerInfo: CustomerInfo) => void;
  onBack: () => void;
  initialData: Partial<CustomerInfo>;
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  onSubmit,
  onBack,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<CustomerInfo>>({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    notes: initialData.notes || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof CustomerInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerInfo, string>> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'E-posta gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Telefon numarası gereklidir';
    } else if (!/^[0-9\s\-\+\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData as CustomerInfo);
    } catch (error) {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">İletişim Bilgileri</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          disabled={submitting}
        >
          ← Geri
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              Ad *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName || ''}
              onChange={e => handleChange('firstName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Adınız"
              disabled={submitting}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Soyad *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName || ''}
              onChange={e => handleChange('lastName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Soyadınız"
              disabled={submitting}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-posta *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ornek@email.com"
              disabled={submitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefon *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone || ''}
              onChange={e => handleChange('phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0555 123 4567"
              disabled={submitting}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Not (Opsiyonel)
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Özel bir isteğiniz varsa buraya yazabilirsiniz"
              disabled={submitting}
            />
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="privacy"
              required
              className="mt-1"
              disabled={submitting}
            />
            <label htmlFor="privacy" className="text-sm text-gray-600">
              <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                Gizlilik Politikası
              </a>
              'nı ve{' '}
              <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                Kullanım Koşulları
              </a>
              'nı okudum ve kabul ediyorum. *
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Randevu Oluşturuluyor...' : 'Randevuyu Onayla'}
          </button>
        </form>
      </div>
    </div>
  );
};
