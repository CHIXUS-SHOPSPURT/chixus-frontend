/**
 * CHIXUS GA4 Analytics Integration
 * Google Analytics 4 tracking module with strict privacy filters and SPA page-view tracking.
 *
 * Measurement ID: G-EZ7F7XS058
 * Production Domain: https://chixus.vercel.app
 */

export const GA_MEASUREMENT_ID = 'G-EZ7F7XS058';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Track previous page to avoid duplicate consecutive page-view dispatches
let lastTrackedPath: string | null = null;
let lastTrackedTimestamp = 0;
const DEDUPLICATION_INTERVAL_MS = 250;

// List of forbidden sensitive parameter keys that must never be sent to GA4
const SENSITIVE_KEYS_REGEX = /(pass|token|secret|key|auth|cred|phone|email|image|photo|frame|base64|blob|diagnostic|report|pin)/i;

/**
 * Sanitizes event parameters to ensure zero PII or sensitive data is transmitted.
 * Discards keys that match sensitive patterns, filters large strings (such as base64 images),
 * and only permits safe primitives (strings under 100 chars, numbers, booleans).
 */
function sanitizeParams(params?: Record<string, any>): Record<string, any> {
  if (!params) return {};

  const clean: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    if (SENSITIVE_KEYS_REGEX.test(key)) {
      continue; // Skip sensitive key
    }

    if (typeof value === 'string') {
      // Discard long strings (base64 image payloads, tokens, big payloads)
      if (value.length > 100 || value.startsWith('data:') || value.startsWith('ey')) {
        continue;
      }
      // Discard potential emails or phone numbers in values
      if (value.includes('@') || /^\+?[0-9]{7,15}$/.test(value)) {
        continue;
      }
      clean[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Tracks client-side Single Page Application (SPA) navigation.
 * Formats a clean path (e.g., /feed, /inspect, /login) and updates the document title.
 * Prevents duplicate events caused by React re-renders or rapid state changes.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;

  // De-duplicate if the same path was tracked within the deduplication window
  if (lastTrackedPath === normalizedPath && now - lastTrackedTimestamp < DEDUPLICATION_INTERVAL_MS) {
    return;
  }

  lastTrackedPath = normalizedPath;
  lastTrackedTimestamp = now;

  const title = pageTitle || document.title || 'CHIXUS';

  // Make sure window.gtag exists or queue to dataLayer
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: normalizedPath,
      page_title: title,
      page_location: `${window.location.origin}${normalizedPath}`,
      send_to: GA_MEASUREMENT_ID,
    });
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push([
      'event',
      'page_view',
      {
        page_path: normalizedPath,
        page_title: title,
        page_location: `${window.location.origin}${normalizedPath}`,
        send_to: GA_MEASUREMENT_ID,
      },
    ]);
  }

  // Developer feedback in local development console
  if (import.meta.env.DEV) {
    console.debug(`[GA4] PageView tracked -> ${normalizedPath} ("${title}")`);
  }
}

/**
 * Tracks safe UI interaction events (e.g. tab switches, theme changes, camera toggle)
 * while rigorously excluding any sensitive payload or PII.
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  const cleanParams = sanitizeParams(params);

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...cleanParams,
      send_to: GA_MEASUREMENT_ID,
    });
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push([
      'event',
      eventName,
      {
        ...cleanParams,
        send_to: GA_MEASUREMENT_ID,
      },
    ]);
  }

  if (import.meta.env.DEV) {
    console.debug(`[GA4] Event tracked -> ${eventName}`, cleanParams);
  }
}
