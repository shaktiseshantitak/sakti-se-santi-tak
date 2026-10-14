/**
 * DHARMA BOOKS PRO - CYBERSECURITY & HARDENING UTILITY
 * 
 * Provides defense-in-depth against common web vulnerabilities:
 * 1. XSS (Cross-Site Scripting) via strict input escaping & sanitization
 * 2. Form Spam / DoS via Client-side Sliding-Window Rate Limiting
 * 3. Bot Attacks via Honeypot Trapping
 * 4. Payload Overload / Memory Hanging via Input Truncation & Type Checking
 * 5. LocalStorage Tamper Crashes via Safe Encapsulated Accessors
 * 6. SQL Injection Prevention via Parameter Encoding & Validation
 */

// Rate limit tracker map
const rateLimitMap: Map<string, number[]> = new Map();

/**
 * Sanitizes raw string input against script-injection payloads and caps length to
 * prevent DoS via oversized fields. Strips control characters and dangerous URL
 * schemes/inline-event-handler patterns, but does NOT HTML-entity-encode the text.
 *
 * This used to also HTML-entity-encode quotes, slashes, and ampersands. That's the
 * right move if the value will later be embedded into raw HTML — but this app never
 * renders user data via dangerouslySetInnerHTML (verified: no occurrences anywhere
 * in src/); everything goes through normal React JSX text nodes, which already
 * auto-escape on render. Pre-encoding on top of that just double-encodes and
 * permanently corrupts ordinary data before it's ever stored: a name like "O'Brien"
 * became "O&#x27;Brien" in the database, and an address like "12/3, MG Road" (a very
 * common Indian address format) became "12&#x2F;3, MG Road" — both stored wrong and
 * shown wrong forever after (e.g. on shipping labels), for zero actual XSS benefit.
 */
export function sanitizeInput(input: string, maxLen: number = 1000): string {
  if (typeof input !== 'string') return '';

  // Enforce max length to prevent long payload DOM freezing
  let clean = input.slice(0, maxLen);

  // Strip control/zero-width characters that have no legitimate use in form input.
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove dangerous URL schemes & inline event-handler patterns (defense in depth,
  // in case this value is ever interpolated into an href/src or similar attribute).
  clean = clean.replace(/javascript:/gi, '')
               .replace(/data:/gi, '')
               .replace(/vbscript:/gi, '')
               .replace(/on\w+=/gi, '');

  return clean.trim();
}

/**
 * Decodes sanitized text back for safe rendering inside React text nodes (React auto-escapes, but useful for previewing).
 */
export function unescapeText(encodedStr: string): string {
  if (!encodedStr) return '';
  return encodedStr
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Recursively sanitizes string fields of any object payload.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, maxLen: number = 2000): T {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const val = sanitized[key];
      if (typeof val === 'string') {
        (sanitized as any)[key] = sanitizeInput(val, maxLen);
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        (sanitized as any)[key] = sanitizeObject(val, maxLen);
      }
    }
  }
  return sanitized;
}

/**
 * Sliding Window Rate Limiter to protect against automated spamming & site hanging.
 * Returns true if action is rate limited (blocked).
 * 
 * @param key Identifier for action (e.g. 'checkout-submit', 'contact-form', 'review-add')
 * @param maxAttempts Allowed attempts in time window
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 min)
 */
export function isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  
  // Filter out timestamps outside current time window
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= maxAttempts) {
    return true; // Rate limited (BLOCKED)
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return false; // Allowed
}

/**
 * Checks if a honeypot field has been filled (indicates automated bot spam).
 */
export function isHoneypotTriggered(honeypotVal: string | undefined | null): boolean {
  return Boolean(honeypotVal && honeypotVal.trim().length > 0);
}

/**
 * Strict Email Format Validation (RFC 5322 compliant subset).
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Indian & International Mobile Phone Validator.
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  return /^\d{10,15}$/.test(cleanPhone);
}

/**
 * Indian Postal Pincode Validator (6 digits).
 */
export function validatePincode(pincode: string): boolean {
  if (!pincode) return false;
  return /^\d{6}$/.test(pincode.trim());
}

/**
 * Safe LocalStorage Reader with JSON error protection to avoid crashing app on malformed data.
 */
export function safeStorageGet<T>(key: string, fallbackValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Security SafeStorage] Error parsing storage key "${key}". Falling back.`, err);
    return fallbackValue;
  }
}

/**
 * Safe LocalStorage Writer with quota overflow handling.
 */
export function safeStorageSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[Security SafeStorage] Failed to write storage key "${key}". Quota exceeded or restricted.`, err);
    return false;
  }
}

/**
 * Sanitizes SQL query parameter inputs against SQL Injection attacks.
 */
export function sanitizeSqlParam(param: string): string {
  if (typeof param !== 'string') return '';
  return param
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}
