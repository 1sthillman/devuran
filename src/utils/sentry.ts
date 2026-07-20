/**
 * 🔍 SENTRY ERROR TRACKING INTEGRATION
 * 
 * Production'da otomatik hata izleme ve monitoring
 * 
 * Kurulum:
 * 1. npm install @sentry/react @sentry/vite-plugin
 * 2. .env dosyasına VITE_SENTRY_DSN ekleyin
 * 3. main.tsx'te bu dosyayı import edin
 * 
 * @date 2026-07-20
 */

// Bu dosya production'da aktif olacak
// Şimdilik mock implementasyon, Sentry kurulunca uncomment edin

interface SentryConfig {
  enabled: boolean;
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
}

const config: SentryConfig = {
  enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // Production'da %10, dev'de %100
};

export const initSentry = () => {
  if (!config.enabled) {
    console.log('🔍 Sentry disabled (development mode or missing DSN)');
    return;
  }

  // Sentry kurulunca uncomment edin:
  /*
  import * as Sentry from '@sentry/react';
  
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate,
    
    // Performance Monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Set 'tracePropagationTargets' to control what URLs distributed tracing should be enabled for
        tracePropagationTargets: ['localhost', /^https:\/\/api\.yourdomain\.com/],
      }),
      new Sentry.Replay({
        maskAllText: true, // KVKK uyumluluğu için text'leri maskele
        blockAllMedia: true,
      }),
    ],
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // %10 oturumları kaydet
    replaysOnErrorSampleRate: 1.0, // Hata olan tüm oturumları kaydet
    
    // Hata filtreleme (gereksiz hataları ignore et)
    beforeSend(event, hint) {
      // Ağ hataları (kullanıcı internet bağlantısını kaybetmiş olabilir)
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      
      // Ad-blocker'ların sebep olduğu hatalar
      if (event.exception?.values?.[0]?.value?.includes('Script error')) {
        return null;
      }
      
      return event;
    },
    
    // Kullanıcı bilgilerini ekle (dikkat: PII göndermemeye özen gösterin)
    beforeSendTransaction(transaction) {
      // Transaction'a ekstra context ekleyebilirsiniz
      return transaction;
    },
  });
  
  console.log('✅ Sentry initialized');
  */
};

// Custom error logger - Sentry'ye gönderir
export const logError = (error: Error, context?: Record<string, any>) => {
  if (config.enabled) {
    // Sentry kurulunca uncomment edin:
    // Sentry.captureException(error, { extra: context });
  }
  
  // Development'ta console'a da yaz
  if (import.meta.env.DEV) {
    console.error('🔥 Error:', error);
    if (context) {
      console.error('📋 Context:', context);
    }
  }
};

// Custom warning logger
export const logWarning = (message: string, context?: Record<string, any>) => {
  if (config.enabled) {
    // Sentry kurulunca uncomment edin:
    // Sentry.captureMessage(message, { level: 'warning', extra: context });
  }
  
  if (import.meta.env.DEV) {
    console.warn('⚠️ Warning:', message);
    if (context) {
      console.warn('📋 Context:', context);
    }
  }
};

// Performance monitoring için custom transaction
export const startTransaction = (name: string, op: string) => {
  if (!config.enabled) return null;
  
  // Sentry kurulunca uncomment edin:
  // return Sentry.startTransaction({ name, op });
  
  return null;
};

// Critical işlemler için alert kurulum helper'ı
export const setupCriticalAlerts = () => {
  // Bu fonksiyon Sentry dashboard'dan alert kuralları kurmanız için
  // gerekli metrikleri ve threshold'ları dökümente eder
  
  return {
    alerts: [
      {
        name: 'High Reservation Failure Rate',
        condition: 'error_count > 10 within 1 hour',
        filter: 'transaction.name:createReservation',
        notification: 'Slack/Email',
      },
      {
        name: 'Payment Webhook Failure',
        condition: 'error_count > 5 within 1 hour',
        filter: 'transaction.name:paymentWebhook',
        notification: 'Slack/Email (Critical)',
      },
      {
        name: 'High Error Rate',
        condition: 'error_rate > 5% for 10 minutes',
        notification: 'Slack/Email',
      },
    ],
  };
};

export default {
  initSentry,
  logError,
  logWarning,
  startTransaction,
  setupCriticalAlerts,
};
