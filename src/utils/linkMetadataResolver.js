/**
 * ADSA T-Board Intelligent Link Metadata & Security Resolver
 * 4-tier pipeline: Memory LRU -> LocalStorage (7d TTL) -> Curated Registry -> Edge / Microlink -> Algorithmic Fallback
 */

import {
  CURATED_CAMPUS_LINKS,
  INTERNAL_ROUTE_PREVIEWS,
  getContactPreview,
} from './linkRegistry';

// In-Memory LRU Cache for instantaneous zero-latency access
const memoryCache = new Map();
const MAX_MEMORY_ITEMS = 150;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_PREFIX = 'adsa_link_meta_v1_';

/**
 * Generate a short deterministic hash for localStorage keys
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract root domain and clean hostname
 */
export function extractDomain(urlStr) {
  if (!urlStr) return '';
  try {
    if (urlStr.startsWith('/') || urlStr.startsWith('#')) return 'adsa.internal';
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch (_) {
    return urlStr.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  }
}

/**
 * Generate vibrant deterministic gradients based on domain hash
 */
function getDomainGradient(domain) {
  const gradients = [
    'from-emerald-600 via-teal-600 to-emerald-900',
    'from-teal-600 via-cyan-600 to-slate-900',
    'from-blue-600 via-indigo-600 to-slate-900',
    'from-violet-600 via-purple-600 to-zinc-900',
    'from-amber-600 via-orange-600 to-amber-950',
    'from-rose-600 via-pink-600 to-slate-950',
  ];
  let sum = 0;
  for (let i = 0; i < domain.length; i++) {
    sum += domain.charCodeAt(i);
  }
  return gradients[sum % gradients.length];
}

/**
 * Clean up title or fallback
 */
function cleanTitle(str, domain) {
  if (!str) {
    const parts = domain.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + (parts.length > 1 ? ` ${parts[1].toUpperCase()}` : '');
  }
  return str.trim().slice(0, 110);
}

/**
 * Algorithmic Fallback Generator
 */
export function generateFallbackMetadata(urlStr) {
  const domain = extractDomain(urlStr);
  const isHttps = typeof urlStr === 'string' && urlStr.startsWith('https://');
  const isPdf = typeof urlStr === 'string' && urlStr.toLowerCase().endsWith('.pdf');

  return {
    url: urlStr,
    canonicalUrl: urlStr,
    domain,
    siteName: domain,
    title: isPdf ? `PDF Document: ${domain}` : cleanTitle('', domain),
    description: isPdf
      ? 'Portable Document Format file. Click to view or download document.'
      : `Preview details for ${domain}. Click to safely navigate to the external destination.`,
    image: null,
    favicon: domain && domain !== 'adsa.internal'
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
      : null,
    mediaType: isPdf ? 'pdf' : 'website',
    trustStatus: isHttps ? 'secure_external' : 'unverified',
    gradient: getDomainGradient(domain),
    badgeText: isPdf ? 'PDF File' : (isHttps ? 'HTTPS Secure' : 'Web Link'),
    readingTimeMinutes: 2,
    cachedAt: Date.now(),
  };
}

/**
 * Read from localStorage with TTL check
 */
function getFromStorage(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed;
  } catch (_) {
    return null;
  }
}

/**
 * Write to localStorage safely
 */
function saveToStorage(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (_) {}
}

/**
 * Save to In-Memory LRU Cache
 */
function saveToMemory(url, data) {
  if (memoryCache.size >= MAX_MEMORY_ITEMS) {
    const firstKey = memoryCache.keys().next().value;
    memoryCache.delete(firstKey);
  }
  memoryCache.set(url, data);
}

/**
 * Main Resolver Function
 * Resolves metadata for internal routes, curated links, and external URLs.
 */
export async function resolveLinkMetadata(rawUrl, options = {}) {
  if (!rawUrl) return null;
  const url = rawUrl.trim();

  // Tier 1: Check Memory LRU Cache (0ms)
  if (memoryCache.has(url)) {
    return memoryCache.get(url);
  }

  // Tier 2: Check Curated Hotline & Contact Links (0ms)
  const contactMeta = getContactPreview(url);
  if (contactMeta) {
    saveToMemory(url, contactMeta);
    return contactMeta;
  }

  // Tier 3: Check Internal Route Links (0ms)
  if (url.startsWith('/') || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('tel:'))) {
    const path = url.startsWith('/') ? url : `/${url}`;
    const internalMeta = INTERNAL_ROUTE_PREVIEWS[path];
    if (internalMeta) {
      const meta = {
        ...internalMeta,
        url,
        canonicalUrl: window?.location ? `${window.location.origin}${path}` : path,
        domain: 'adsa.internal',
        isInternalRoute: true,
        internalPath: path,
        cachedAt: Date.now(),
      };
      saveToMemory(url, meta);
      return meta;
    }
  }

  // Tier 4: Check Curated Campus Links (0ms)
  const domain = extractDomain(url);
  const normalizedUrl = url.replace(/\/+$/, '');
  const curatedMatch =
    CURATED_CAMPUS_LINKS[url] ||
    CURATED_CAMPUS_LINKS[normalizedUrl] ||
    CURATED_CAMPUS_LINKS[domain];

  if (curatedMatch) {
    const meta = {
      ...curatedMatch,
      url,
      cachedAt: Date.now(),
    };
    saveToMemory(url, meta);
    return meta;
  }

  // Tier 5: Check LocalStorage Persistent Cache
  const storageKey = hashString(url);
  const stored = getFromStorage(storageKey);
  if (stored) {
    saveToMemory(url, stored);
    return stored;
  }

  // Tier 6: Fetch OpenGraph Metadata via Scraper with fallback
  try {
    // If skipping network or offline
    if (options.skipNetwork || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      const fallback = generateFallbackMetadata(url);
      saveToMemory(url, fallback);
      return fallback;
    }

    // Call Microlink API with a strict 3.5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const endpoint = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false&meta=true`;
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const d = json.data;
        const resolved = {
          url,
          canonicalUrl: d.url || url,
          domain: extractDomain(d.url || url),
          siteName: d.publisher || domain,
          title: cleanTitle(d.title, domain),
          description: d.description ? d.description.slice(0, 180) : `Official content from ${domain}`,
          image: d.image?.url || null,
          imageAlt: d.title || domain,
          favicon: d.logo?.url || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
          mediaType: url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'website',
          trustStatus: url.startsWith('https://') ? 'secure_external' : 'unverified',
          readingTimeMinutes: Math.max(1, Math.round((d.description?.length || 200) / 150)),
          themeColor: d.theme || '#10b981',
          cachedAt: Date.now(),
        };

        saveToMemory(url, resolved);
        saveToStorage(storageKey, resolved);
        return resolved;
      }
    }
  } catch (_) {
    // Graceful fallback on network timeout or CORS issue
  }

  // Tier 7: High-fidelity algorithmic fallback
  const fallbackMeta = generateFallbackMetadata(url);
  saveToMemory(url, fallbackMeta);
  saveToStorage(storageKey, fallbackMeta);
  return fallbackMeta;
}
