import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://canteen.alathurpadidars.in';
const DEFAULT_TITLE = 'ADSA T-Board • Alathurpadi Dars Food Management System';
const DEFAULT_DESC =
  'Official dining logistics and token management platform for Alathurpadi Dars, Malappuram. Real-time token attendance, kitchen display manifest, dietary avoiders, and campus care concierge.';
const DEFAULT_IMAGE = `${BASE_URL}/og-preview.png`;

function setMetaTag(selector, attributeName, attributeValue, content) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalTag(url) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

/**
 * Custom React hook for dynamic SPA SEO metadata synchronization.
 * Updates document.title, description, canonical link, OpenGraph, and Twitter cards.
 */
export function useSEO({
  title,
  description = DEFAULT_DESC,
  keywords,
  image = DEFAULT_IMAGE,
  canonicalUrl,
} = {}) {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Resolve effective values
    const effectiveTitle = title ? `${title} • ADSA T-Board` : DEFAULT_TITLE;
    const effectiveCanonical =
      canonicalUrl ||
      `${BASE_URL}${location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '')}`;
    const effectiveImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

    // 2. Set Title
    document.title = effectiveTitle;
    setMetaTag('meta[name="title"]', 'name', 'title', effectiveTitle);

    // 3. Set Description & Keywords
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    if (keywords) {
      setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    }

    // 4. Set Canonical
    setCanonicalTag(effectiveCanonical);

    // 5. Set OpenGraph Meta Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', effectiveTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', effectiveCanonical);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', effectiveImage);
    setMetaTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', effectiveImage);

    // 6. Set Twitter Card Meta Tags
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', effectiveTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:url"]', 'name', 'twitter:url', effectiveCanonical);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', effectiveImage);
  }, [title, description, keywords, image, canonicalUrl, location.pathname]);
}

export default useSEO;
