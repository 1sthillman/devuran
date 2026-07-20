/**
 * 🔇 PRODUCTION-SAFE LOGGER
 * 
 * Console.log'ları sadece development'ta çalışır
 * Production build'de otomatik olarak sessiz kalır
 * 
 * Kullanım:
 * import { logger } from '@/utils/logger';
 * 
 * logger.log('Debug info');
 * logger.warn('Warning');
 * logger.error('Error');
 * 
 * @date 2026-07-20
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Error'lar production'da da gösterilsin (critical)
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  table: (...args: any[]) => {
    if (isDevelopment) {
      console.table(...args);
    }
  }
};

// Legacy uyumluluk için global console override (opsiyonel)
// Bunu kullanmak için main.tsx veya App.tsx'te import edin
export const overrideConsole = () => {
  if (!isDevelopment) {
    const noop = () => {};
    window.console.log = noop;
    window.console.info = noop;
    window.console.warn = noop;
    window.console.debug = noop;
    window.console.table = noop;
    // console.error'u bırak (critical hatalar için)
  }
};
