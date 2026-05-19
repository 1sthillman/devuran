/**
 * Secure Form Wrapper
 * Adds CSRF protection, honeypot, and request signing to forms
 */

import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { HoneypotField } from './HoneypotField';
import { csrfProtection, signRequest, isHoneypotTriggered } from '@/utils/security';
import { rateLimiter } from '@/utils/rateLimiter';

interface SecureFormProps {
  children: ReactNode;
  onSubmit: (data: FormData, signature: { signature: string; timestamp: number }) => Promise<void>;
  rateLimitAction?: string;
  className?: string;
}

export function SecureForm({ children, onSubmit, rateLimitAction, className }: SecureFormProps) {
  const [honeypotValue, setHoneypotValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // SECURITY: Check honeypot (bot detection)
    if (honeypotValue.trim() !== '') {
      // Bot detected - silently fail
      setError('Form submission failed. Please try again.');
      return;
    }

    // SECURITY: Rate limiting
    if (rateLimitAction && !rateLimiter.isAllowed(rateLimitAction)) {
      const resetTime = Math.ceil(rateLimiter.getResetTime(rateLimitAction) / 1000);
      setError(`Too many requests. Please wait ${resetTime} seconds.`);
      return;
    }

    // SECURITY: CSRF token validation
    const csrfToken = csrfProtection.getToken();
    if (!csrfToken) {
      setError('Security token missing. Please refresh the page.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get form data
      const formData = new FormData(e.currentTarget);
      const formObject: Record<string, any> = {};
      formData.forEach((value, key) => {
        formObject[key] = value;
      });

      // Add CSRF token
      formObject._csrf = csrfToken;

      // SECURITY: Sign request
      const signature = await signRequest(formObject);

      // Submit form
      await onSubmit(formData, signature);

      // Regenerate CSRF token after successful submission
      csrfProtection.generateToken();
    } catch (err: any) {
      setError(err.message || 'Form submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* SECURITY: Honeypot field */}
      <HoneypotField onValueChange={setHoneypotValue} />

      {/* SECURITY: CSRF token */}
      <input
        type="hidden"
        name="_csrf"
        value={csrfProtection.getToken()}
      />

      {children}

      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}

      {isSubmitting && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </form>
  );
}
