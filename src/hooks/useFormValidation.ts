import { useState } from 'react';
import { validation } from '@/utils/validation';

interface ValidationErrors {
  [key: string]: string;
}

export function useFormValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (field: string, value: string, type: 'phone' | 'email' | 'name'): boolean => {
    const result = validation[type](value);
    
    if (!result.valid) {
      setErrors(prev => ({ ...prev, [field]: result.message || '' }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    }
  };

  const validatePhone = (field: string, value: string): boolean => {
    return validateField(field, value, 'phone');
  };

  const validateEmail = (field: string, value: string): boolean => {
    return validateField(field, value, 'email');
  };

  const validateName = (field: string, value: string): boolean => {
    return validateField(field, value, 'name');
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const hasErrors = (): boolean => {
    return Object.keys(errors).length > 0;
  };

  return {
    errors,
    validatePhone,
    validateEmail,
    validateName,
    clearError,
    clearAllErrors,
    hasErrors
  };
}
