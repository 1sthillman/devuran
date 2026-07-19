/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Sanitize user input for database storage
 * Removes dangerous characters but keeps basic formatting
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length to prevent DoS
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
}

/**
 * Sanitize phone number - preserves international format
 * Supports Turkish phone numbers (starts with 0 or +90)
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit and non-plus characters
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('+90')) {
    // International format: +905331234567 → keep as is
    return cleaned.slice(0, 13); // +90 + 10 digits
  } else if (cleaned.startsWith('90') && cleaned.length > 10) {
    // 905331234567 → add +
    return '+' + cleaned.slice(0, 12);
  } else if (cleaned.startsWith('0')) {
    // Turkish format: 05331234567 → keep 0
    return cleaned.slice(0, 11); // 0 + 10 digits
  } else {
    // Just digits: 5331234567 → keep as is
    return cleaned.slice(0, 10);
  }
}

/**
 * Sanitize email address - preserves + symbol for Gmail tags
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Convert to lowercase
  let sanitized = email.toLowerCase().trim();
  
  // Remove dangerous characters but keep + for Gmail tags
  sanitized = sanitized.replace(/[<>()[\]\\,;:\s"]/g, '');
  
  // Validate basic email format
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return ''; // Invalid email format
  }
  
  // Limit length
  if (sanitized.length > 254) {
    sanitized = sanitized.substring(0, 254);
  }
  
  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow http, https, mailto
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('mailto:') &&
      !trimmed.startsWith('/')) {
    return '';
  }
  
  return url.trim();
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 250);
    sanitized = `${name}.${ext}`;
  }
  
  return sanitized;
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  // Remove special regex characters
  let sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 100);
  
  return sanitized;
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJSON(input: string): any {
  try {
    const parsed = JSON.parse(input);
    
    // Recursively sanitize all string values
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeInput(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[sanitizeInput(key)] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };
    
    return sanitizeObject(parsed);
  } catch (error) {
    throw new Error('Invalid JSON input');
  }
}

/**
 * Check if string contains potential XSS - includes unicode detection
 */
export function containsXSS(input: string): boolean {
  if (!input) return false;
  
  // Decode unicode escapes first
  let decoded = input;
  try {
    // Decode \uXXXX patterns
    decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => 
      String.fromCharCode(parseInt(code, 16))
    );
    // Decode &#xXX; patterns
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => 
      String.fromCharCode(parseInt(code, 16))
    );
    // Decode &#XX; patterns
    decoded = decoded.replace(/&#(\d+);/g, (match, code) => 
      String.fromCharCode(parseInt(code, 10))
    );
  } catch (e) {
    // If decoding fails, continue with original
  }
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
    /<img[^>]*src[^>]*onerror/i,
    /<svg[^>]*onload/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(input) || pattern.test(decoded));
}

/**
 * Sanitize all user inputs in an object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeInput(item) : item
        );
      } else if (value && typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as T;
}
