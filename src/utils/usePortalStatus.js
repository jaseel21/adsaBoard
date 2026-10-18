import { useTokenLockStatus } from './useTokenLockStatus';

/**
 * Backward-compatible wrapper around useTokenLockStatus.
 * Allows components importing usePortalStatus to automatically benefit from
 * dynamic windows and granular locking without breaking changes.
 */
export function usePortalStatus() {
  const status = useTokenLockStatus();

  return {
    ...status,
    timeInRange: status.isTimeInWindow,
  };
}

export default usePortalStatus;
