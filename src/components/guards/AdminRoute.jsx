import React from 'react';
import RoleRoute from './RoleRoute';
import { ROLES } from '../../utils/rbac';

/**
 * Route guard that restricts access exclusively to ADSA Central Committee and Developers.
 * Wraps RoleRoute to ensure full backward compatibility across legacy admin routes.
 */
export default function AdminRoute({ children }) {
  return (
    <RoleRoute allowedRoles={[ROLES.CENTRAL_COMMITTEE, ROLES.DEVELOPER]}>
      {children}
    </RoleRoute>
  );
}
