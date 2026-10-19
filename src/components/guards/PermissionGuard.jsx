import React, { useContext } from 'react';
import { AuthContext } from '../../store/AuthContext';

/**
 * Component-level guard that conditionally displays children or renders a fallback
 * based on whether the active staff user has the requested permission.
 *
 * Example:
 * <PermissionGuard permission={PERMISSIONS.DELETE_STUDENTS} fallback={<span className="text-xs text-gray-400">Action Restricted</span>}>
 *   <button onClick={handleDelete}>Delete</button>
 * </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  children,
  fallback = null,
  requireAll = false,
}) {
  const { hasPermission } = useContext(AuthContext);

  if (!permission) return children;

  const permissions = Array.isArray(permission) ? permission : [permission];
  const isAuthorized = requireAll
    ? permissions.every((p) => hasPermission(p))
    : permissions.some((p) => hasPermission(p));

  if (!isAuthorized) {
    return fallback;
  }

  return children;
}
