import { useState, useEffect, useCallback } from 'react';
import { resolveLinkMetadata } from '../utils/linkMetadataResolver';

/**
 * useLinkMetadata
 * React hook to fetch and cache metadata for any URL or internal path.
 */
export function useLinkMetadata(url, overrides = {}) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetadata = useCallback(
    async (force = false) => {
      if (!url) {
        setMetadata(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await resolveLinkMetadata(url, { skipNetwork: !force && false });
        if (data) {
          const merged = {
            ...data,
            title: overrides.title || data.title,
            description: overrides.description || data.description,
            image: overrides.image || data.image,
            trustStatus: overrides.trustStatus || data.trustStatus,
          };
          setMetadata(merged);
        } else {
          setError('Failed to resolve link preview');
        }
      } catch (err) {
        setError(err.message || 'Error fetching link metadata');
      } finally {
        setLoading(false);
      }
    },
    [url, overrides.title, overrides.description, overrides.image, overrides.trustStatus]
  );

  useEffect(() => {
    let isMounted = true;
    fetchMetadata().catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [fetchMetadata]);

  return { metadata, loading, error, refresh: () => fetchMetadata(true) };
}
